import { API_CONFIG } from '@/lib/api-config';
import { ApiResponse } from './products';
import { sdk } from '@/lib/medusa-client';
import TokenManager from '@/lib/token-manager';
import { loginDirectAPI, getCustomerDirectAPI, logoutDirectAPI } from './auth-direct';
import type { HttpTypes } from "@medusajs/types";

/**
 * API functions dla autentykacji użytkowników w Medusa.js 2.0 SDK
 * Customer authentication, registration, profile management
 */

// Używamy typu z Medusa 2.0
export type Customer = HttpTypes.StoreCustomer & {
  has_account?: boolean; // Dodane dla kompatybilności
};

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

/**
 * Logowanie użytkownika (Medusa 2.0 SDK with Direct API fallback)
 */
export async function loginCustomer(credentials: LoginRequest, rememberMe: boolean = false): Promise<ApiResponse<{ customer: Customer }>> {
  try {
    console.log('🔄 [Hybrid Auth] Attempting SDK login first:', credentials.email);
    
    // Try SDK first
    try {
      const response = await sdk.auth.login("customer", "emailpass", {
        email: credentials.email,
        password: credentials.password,
      });

      console.log('✅ SDK login successful');

      // Set remember me preferences
      if (rememberMe) {
        localStorage.setItem('auth_remember', 'true');
        localStorage.setItem('remembered_email', credentials.email);
      } else {
        localStorage.removeItem('auth_remember');
        localStorage.removeItem('remembered_email');
      }

      // Get customer data after successful login
      const customerResponse = await sdk.store.customer.retrieve();
      console.log('✅ Customer data retrieved via SDK:', customerResponse.customer?.email);

      return { data: { customer: customerResponse.customer as Customer } };
      
    } catch (sdkError: any) {
      console.log('❌ SDK login failed, trying direct API fallback:', sdkError.message);
      
      // Fallback to direct API call
      return await loginDirectAPI(credentials, rememberMe);
    }
    
  } catch (error: any) {
    console.error('❌ [Hybrid Auth] All login methods failed:', error);
    return {
      error: {
        message: error.message || 'Błąd logowania',
        status: 401
      }
    };
  }
}

/**
 * Rejestracja nowego użytkownika (Medusa 2.0 SDK)
 */
export async function registerCustomer(userData: RegisterRequest): Promise<ApiResponse<{ customer: Customer }>> {
  try {
    console.log('🔄 Registering customer via SDK:', userData.email);
    
    // Krok 1: Rejestracja konta auth
    const authResult = await sdk.auth.register("customer", "emailpass", {
      email: userData.email,
      password: userData.password,
    });
    
    console.log('✅ Auth registration successful');
    
    // Krok 2: Logowanie żeby uzyskać sesję
    await sdk.auth.login("customer", "emailpass", {
      email: userData.email,
      password: userData.password,
    });
    
    console.log('✅ Auto-login after registration successful');
    
    // Krok 3: Aktualizacja profilu customera (imię, nazwisko)
    const customerResponse = await sdk.store.customer.update({
      first_name: userData.first_name,
      last_name: userData.last_name,
      phone: userData.phone,
    });
    
    console.log('✅ Customer profile updated with personal data');
    return { 
      data: { 
        customer: customerResponse.customer as Customer
      } 
    };
  } catch (error: any) {
    console.error('❌ registerCustomer error:', error);
    return { 
      error: { 
        message: error.message || 'Błąd rejestracji',
        status: 400 
      } 
    };
  }
}

/**
 * Pobiera dane zalogowanego użytkownika (Medusa 2.0 SDK with Direct API fallback)
 */
export async function getCustomer(): Promise<ApiResponse<Customer>> {
  try {
    console.log('🔄 [Hybrid Auth] Getting customer data...');
    
    // Try SDK first
    try {
      const response = await sdk.store.customer.retrieve();
      if (response.customer) {
        console.log('✅ SDK customer data retrieved:', response.customer?.email);
        return { data: response.customer as Customer };
      }
      throw new Error('No customer data returned from SDK');
    } catch (sdkError: any) {
      console.log('❌ SDK failed, trying manual token management...', sdkError.message);
      
      // Try with manual token
      try {
        return await getCustomerWithManualToken();
      } catch (tokenError: any) {
        console.log('❌ Manual token failed, trying direct API fallback...', tokenError.message);
        
        // Final fallback: direct API call
        return await getCustomerDirectAPI();
      }
    }
  } catch (error: any) {
    console.error('❌ [Hybrid Auth] All customer retrieval methods failed:', error);
    return { 
      error: { 
        message: error.message || 'Błąd pobierania danych użytkownika',
        status: 401 
      } 
    };
  }
}

/**
 * Fallback funkcja z ręcznym zarządzaniem tokenami dla pobierania danych klienta
 */
async function getCustomerWithManualToken(): Promise<ApiResponse<Customer>> {
  // Pobieramy token z TokenManager
  const token = TokenManager.get();
  console.log('TokenManager.get() result:', token ? `${token.substring(0, 20)}...` : 'null');
  
  if (!token) {
    console.warn('❌ [JS SDK] getCustomer - No auth token found');
    return { 
      error: { 
        message: 'Brak tokena uwierzytelniającego - zaloguj się ponownie',
        status: 401 
      } 
    };
  }

  // Ustawiamy token w SDK
  TokenManager.setInSDK(token);
  
  // Próbuj ponownie z tokenem
  const response = await sdk.store.customer.retrieve();
  if (response.customer) {
    console.log('✅ [JS SDK] Customer data retrieved with manual token');
    return { data: response.customer as Customer };
  }
  
  throw new Error('No customer data returned even with token');
}

/**
 * Wylogowanie użytkownika (Medusa 2.0 SDK with Direct API fallback)
 */
export async function logoutCustomer(): Promise<ApiResponse<void>> {
  try {
    console.log('🔄 [Hybrid Auth] Logging out customer...');
    
    // Try SDK first
    try {
      await sdk.auth.logout();
      console.log('✅ SDK logout successful');
    } catch (sdkError: any) {
      console.log('❌ SDK logout failed, trying direct API fallback:', sdkError.message);
      
      // Fallback to direct API call
      await logoutDirectAPI();
    }

    // Clean up local storage regardless of API success
    localStorage.removeItem('auth_remember');
    localStorage.removeItem('remembered_email');
    
    return { data: undefined };
  } catch (error: any) {
    console.error('❌ logoutCustomer error:', error);
    // Always clean up locally even if API calls failed
    localStorage.removeItem('auth_remember');
    localStorage.removeItem('remembered_email');
    return { data: undefined };
  }
}

/**
 * Aktualizacja profilu użytkownika (Medusa 2.0 SDK)
 */
export async function updateCustomer(
  updates: Partial<Pick<RegisterRequest, 'first_name' | 'last_name' | 'phone'>>
): Promise<ApiResponse<Customer>> {
  try {
    console.log('🔄 [JS SDK] updateCustomer - Updating customer profile...', updates);
    
    // Najpierw sprawdźmy czy SDK ma automatyczną autoryzację
    try {
      const response = await sdk.store.customer.update(updates);
      console.log('✅ SDK has automatic authorization, customer updated:', response);
      return { data: response.customer as Customer };
    } catch (authError) {
      console.log('❌ SDK does not have automatic authorization, trying manual token management...');
      console.log('Auth error:', authError);
      
      // Fallback: użyj ręcznego zarządzania tokenami
      return await updateCustomerWithManualToken(updates);
    }
  } catch (error: any) {
    console.error('❌ [JS SDK] updateCustomer error:', error);
    return {
      error: {
        message: error.message || 'Błąd aktualizacji profilu',
        status: error.status || 400
      }
    };
  }
}

/**
 * Fallback funkcja z ręcznym zarządzaniem tokenami dla aktualizacji klienta
 */
async function updateCustomerWithManualToken(
  updates: Partial<Pick<RegisterRequest, 'first_name' | 'last_name' | 'phone'>>
): Promise<ApiResponse<Customer>> {
  // Pobieramy token z TokenManager
  const token = TokenManager.get();
  console.log('TokenManager.get() result:', token ? `${token.substring(0, 20)}...` : 'null');
  
  if (!token) {
    console.warn('❌ [JS SDK] updateCustomer - No auth token found');
    return { 
      error: { 
        message: 'Brak tokena uwierzytelniającego - zaloguj się ponownie',
        status: 401 
      } 
    };
  }

  // Ustawiamy token w SDK
  TokenManager.setInSDK(token);
  
  // Próbuj ponownie z tokenem
  const response = await sdk.store.customer.update(updates);
  console.log('✅ [JS SDK] Customer updated with manual token');
  return { data: response.customer as Customer };
}

/**
 * Reset hasła - wysłanie emaila z linkiem (Medusa 2.0 SDK)
 */
export async function requestPasswordReset(email: string): Promise<ApiResponse<void>> {
  try {
    console.log('🔄 Requesting password reset for:', email);
    
    // Używamy bezpośredniego fetch dla reset password - SDK może nie mieć tej metody
    await sdk.client.fetch('/auth/customer/emailpass/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    console.log('✅ Password reset email sent successfully via SDK client');
    return { data: undefined };
  } catch (error: any) {
    console.error('❌ requestPasswordReset SDK error:', error);
    return { 
      error: { 
        message: error.message || 'Błąd wysyłania emaila resetującego',
        status: 400 
      } 
    };
  }
}

/**
 * Reset hasła z tokenem (Medusa 2.0 SDK)
 */
export async function resetPassword(
  email: string, 
  token: string, 
  password: string
): Promise<ApiResponse<any>> {
  try {
    console.log('🔄 Resetting password for:', email);
    
    const response = await sdk.client.fetch('/auth/customer/emailpass/update', {
      method: 'POST',
      body: JSON.stringify({
        email,
        token,
        password,
      }),
    });

    console.log('✅ Password reset successfully via SDK');
    return { data: response };
  } catch (error: any) {
    console.error('❌ resetPassword SDK error:', error);
    return { 
      error: { 
        message: error.message || 'Błąd resetowania hasła',
        status: 400 
      } 
    };
  }
}

/**
 * Sprawdzanie dostępności emaila (czy email już istnieje w systemie)
 */
export async function checkEmailAvailability(email: string): Promise<ApiResponse<{ available: boolean }>> {
  try {
    console.log('🔄 Checking email availability:', email);
    
    // Walidacja podstawowa
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { 
        error: { 
          message: 'Nieprawidłowy format emaila',
          status: 400 
        } 
      };
    }
    
    // Metoda 1: Próba sprawdzenia przez endpoint resetowania hasła
    // To jest bezpieczny sposób sprawdzenia czy użytkownik istnieje
    try {
      await sdk.client.fetch('/auth/customer/emailpass/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: email,
        }),
      });
      
      // Jeśli żądanie się powiodło, znaczy że email istnieje
      console.log('❌ Email not available (user exists):', email);
      return { data: { available: false } };
      
    } catch (resetError: any) {
      console.log('Reset error details:', resetError.message);
      
      // Analizuj typ błędu
      const errorMessage = resetError.message?.toLowerCase() || '';
      
      if (errorMessage.includes('404') || 
          errorMessage.includes('not found') || 
          errorMessage.includes('user not found') ||
          errorMessage.includes('customer not found') ||
          errorMessage.includes('does not exist') ||
          errorMessage.includes('no customer found')) {
        // Email nie istnieje - jest dostępny
        console.log('✅ Email available (user not found):', email);
        return { data: { available: true } };
      }
      
      // Dla innych błędów (np. 400, 500) - spróbuj innej metody
      console.log('Trying alternative validation method...');
      
      // Metoda 2: Próba logowania z nieprawidłowym hasłem
      // Jeśli dostaniemy "Invalid credentials" - user istnieje
      // Jeśli dostaniemy "User not found" - user nie istnieje
      try {
        await sdk.client.fetch('/auth/customer/emailpass', {
          method: 'POST',
          body: JSON.stringify({
            email: email,
            password: 'invalid_password_' + Math.random(), // Losowe hasło
          }),
        });
        
        // Jeśli nie było błędu (dziwne, ale załóżmy że user istnieje)
        console.log('❌ Email not available (login succeeded):', email);
        return { data: { available: false } };
        
      } catch (loginError: any) {
        const loginErrorMessage = loginError.message?.toLowerCase() || '';
        
        if (loginErrorMessage.includes('invalid credentials') ||
            loginErrorMessage.includes('incorrect password') ||
            loginErrorMessage.includes('wrong password')) {
          // User istnieje ale hasło jest złe
          console.log('❌ Email not available (invalid credentials):', email);
          return { data: { available: false } };
        }
        
        if (loginErrorMessage.includes('not found') ||
            loginErrorMessage.includes('user not found') ||
            loginErrorMessage.includes('customer not found')) {
          // User nie istnieje
          console.log('✅ Email available (user not found in login):', email);
          return { data: { available: true } };
        }
        
        // Dla innych błędów - zachowawczy: załóż że email może być zajęty
        console.log('❓ Email availability uncertain, defaulting to unavailable:', email);
        return { data: { available: false } };
      }
    }
    
  } catch (error: any) {
    console.error('❌ checkEmailAvailability error:', error);
    return { 
      error: { 
        message: 'Nie można sprawdzić dostępności emaila. Spróbuj ponownie.',
        status: 500 
      } 
    };
  }
}

/**
 * Sprawdza czy użytkownik jest zalogowany
 */
export function isAuthenticated(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    
    const localToken = localStorage.getItem('medusa_auth_token');
    const sessionToken = sessionStorage.getItem('medusa_auth_token');
    const isRemembered = localStorage.getItem('auth_remember') === 'true';
    
    const hasToken = !!(localToken || sessionToken);
    
    console.log('🔍 [isAuthenticated] Check:', {
      hasLocalToken: !!localToken,
      hasSessionToken: !!sessionToken,
      isRemembered,
      result: hasToken
    });
    
    return hasToken;
  } catch (error) {
    console.error('isAuthenticated error:', error);
    return false;
  }
}

/**
 * Czyści dane autentykacji lokalnie
 */
export function clearAuthentication(): void {
  try {
    if (typeof window === 'undefined') return;
    
    // Clear all authentication tokens
    sessionStorage.removeItem('medusa_auth_token');
    localStorage.removeItem('medusa_auth_token');
    
    // Clear Remember Me data
    localStorage.removeItem('remembered_email');
    localStorage.removeItem('auth_remember');
    
    // Clear other potential SDK keys
    sessionStorage.removeItem('medusa_publishable_key');
    localStorage.removeItem('medusa_publishable_key');
    
    console.log('✅ Authentication and Remember Me data cleared completely');
  } catch (error) {
    console.error('clearAuthentication error:', error);
  }
}

/**
 * Eksportowane funkcje do zarządzania tokenami
 */
// SDK zarządza tokenami automatycznie - nie eksportujemy starych funkcji token management
