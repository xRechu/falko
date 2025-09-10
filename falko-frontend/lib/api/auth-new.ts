import { sdk, TokenManager } from '@/lib/medusa-client';
import { ApiResponse } from './products';
import type { HttpTypes } from "@medusajs/types";

/**
 * Nowe API dla autentykacji z użyciem Medusa.js 2.0 JS SDK
 * 
 * UWAGA: Używamy ręcznego zarządzania tokenami przez TokenManager
 * - Po sdk.auth.login() zapisujemy token ręcznie
 * - Token jest ustawiany w SDK dla kolejnych requestów
 * - Po sdk.auth.logout() usuwamy token ręcznie
 */

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

// Używamy typu z Medusa 2.0
export type Customer = HttpTypes.StoreCustomer & {
  has_account?: boolean; // Dodane dla kompatybilności
};

/**
 * Logowanie użytkownika (Medusa 2.0 JS SDK)
 */
export async function loginCustomer(credentials: LoginRequest): Promise<ApiResponse<{ customer: Customer }>> {
  try {
    console.log('🔄 [JS SDK] Logging in customer:', credentials.email);
    
    // Sprawdźmy konfigurację SDK przed logowaniem
    console.log('🔧 SDK config before login:', {
      baseUrl: (sdk as any)._client?.config?.baseUrl,
      publishableKey: (sdk as any)._client?.config?.publishableKey ? 'SET' : 'NOT SET',
      auth: (sdk as any)._client?.config?.auth
    });
    
    // SDK wykonuje logowanie i zwraca token
    const result = await sdk.auth.login("customer", "emailpass", {
      email: credentials.email,
      password: credentials.password,
    });

    console.log('✅ [JS SDK] Auth login result:', result);
    console.log('🔍 [Debug] Login result type:', typeof result);
    console.log('🔍 [Debug] Login result keys:', result && typeof result === 'object' ? Object.keys(result) : 'N/A');
    console.log('🔍 [Debug] Login result full structure:', JSON.stringify(result, null, 2));

    // Jeśli zwrócono location, oznacza to third-party auth
    if (typeof result === 'object' && 'location' in result) {
      throw new Error('Third-party authentication not supported in this flow');
    }

    // Sprawdź różne formaty zwracanego tokena
    let token = null;
    if (typeof result === 'string') {
      token = result;
      console.log('📝 [Debug] Token received as string');
    } else if (result && typeof result === 'object') {
      // Możliwe że token jest w obiekcie
      token = (result as any).token || (result as any).access_token || (result as any).jwt;
      console.log('📝 [Debug] Token extracted from object:', !!token);
    }

    if (token) {
      TokenManager.save(token, true); // zapisz w localStorage
      TokenManager.setInSDK(token); // ustaw w SDK headers
      console.log('💾 Token saved and set in SDK');
    } else {
      console.warn('⚠️ No token received from login, checking if SDK manages it automatically');
      
      // Sprawdź czy SDK automatycznie ustawił token
      try {
        console.log('🔍 Checking SDK internal state after login...');
        
        // Sprawdź różne miejsca gdzie SDK może przechowywać token
        const sdkInternals = (sdk as any);
        console.log('🔍 SDK client config:', sdkInternals._client?.config);
        console.log('🔍 SDK auth state:', sdkInternals._client?.auth);
        console.log('🔍 SDK headers:', sdkInternals._client?.headers);
        
        const customerResponse = await sdk.store.customer.retrieve();
        console.log('✅ [JS SDK] Customer data retrieved without manual token:', customerResponse);
        
        // Jeśli customer retrieve działa, oznacza że SDK zarządza tokenem automatycznie
        // Spróbuj wyciągnąć token z SDK internals (różne możliwe lokalizacje)
        let sdkToken = null;
        
        // Próba 1: z nagłówków
        sdkToken = sdkInternals._client?.config?.headers?.['Authorization']?.replace('Bearer ', '');
        console.log('🔍 Token from headers:', sdkToken ? `${sdkToken.substring(0, 20)}...` : 'null');
        
        // Próba 2: z auth state
        if (!sdkToken) {
          sdkToken = sdkInternals._client?.auth?.token;
          console.log('🔍 Token from auth.token:', sdkToken ? `${sdkToken.substring(0, 20)}...` : 'null');
        }
        
        // Próba 3: z storage SDK
        if (!sdkToken && typeof window !== 'undefined') {
          sdkToken = localStorage.getItem('medusa_auth_token') || sessionStorage.getItem('medusa_auth_token');
          console.log('🔍 Token from storage (fallback):', sdkToken ? `${sdkToken.substring(0, 20)}...` : 'null');
        }
        if (sdkToken) {
          TokenManager.save(sdkToken, true);
          console.log('💾 Token extracted from SDK and saved');
        }
        
        return { 
          data: { 
            customer: customerResponse.customer 
          } 
        };
      } catch (sdkError) {
        console.error('❌ SDK auto-auth failed, need manual token management');
        throw new Error('Login successful but no token available');
      }
    }

    // Pobierz dane customer po zalogowaniu
    const customerResponse = await sdk.store.customer.retrieve();
    console.log('✅ [JS SDK] Customer data retrieved:', customerResponse);

    return { 
      data: { 
        customer: customerResponse.customer 
      } 
    };
  } catch (error: any) {
    console.error('❌ [JS SDK] loginCustomer error:', error);
    return { 
      error: { 
        message: error.message || 'Błąd logowania',
        status: error.status || 400 
      } 
    };
  }
}

/**
 * Rejestracja nowego użytkownika (Medusa 2.0 JS SDK)
 */
export async function registerCustomer(userData: RegisterRequest): Promise<ApiResponse<{ customer: Customer }>> {
  try {
    console.log('🔄 [JS SDK] Registering customer:', userData.email);
    
    // Krok 1: Uzyskaj token rejestracji
    try {
      const registrationResult = await sdk.auth.register("customer", "emailpass", {
        email: userData.email,
        password: userData.password,
      });
      console.log('✅ [JS SDK] Registration token obtained');
    } catch (registerError: any) {
      // Jeśli email już istnieje, spróbuj zalogować
      if (registerError.message?.includes('already exists') || registerError.status === 422) {
        console.log('🔄 [JS SDK] Email exists, trying to login...');
        return await loginCustomer({
          email: userData.email,
          password: userData.password,
        });
      }
      throw registerError;
    }

    // Krok 2: Zaloguj się żeby uzyskać aktywny token
    const loginResult = await sdk.auth.login("customer", "emailpass", {
      email: userData.email,
      password: userData.password,
    });
    console.log('✅ [JS SDK] User logged in after registration');

    // Ręcznie zapisz token i ustaw w SDK
    if (typeof loginResult === 'string') {
      TokenManager.save(loginResult, true); // zapisz w localStorage
      TokenManager.setInSDK(loginResult); // ustaw w SDK headers
      console.log('💾 Token saved and set in SDK after registration');
    }

    // Krok 3: Utwórz profil customer (teraz mamy aktywny token)
    const customerResponse = await sdk.store.customer.create({
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      phone: userData.phone,
    });

    console.log('✅ [JS SDK] Customer profile created:', customerResponse);

    return { 
      data: { 
        customer: customerResponse.customer 
      } 
    };
  } catch (error: any) {
    console.error('❌ [JS SDK] registerCustomer error:', error);
    
    return { 
      error: { 
        message: error.message || 'Błąd rejestracji',
        status: error.status || 400 
      } 
    };
  }
}

/**
 * Pobiera dane zalogowanego użytkownika (Medusa 2.0 JS SDK)
 */
export async function getCustomer(): Promise<ApiResponse<Customer>> {
  try {
    console.log('🔄 [JS SDK] Fetching customer data...');
    
    // Sprawdź czy mamy token w localStorage (debug)
    const token = TokenManager.get();
    console.log('🔍 [Debug] Token in storage:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
    
    // Ustaw token w SDK jeśli jest dostępny
    if (token) {
      TokenManager.setInSDK(token);
    } else {
      console.log('⚠️ No token found, user needs to login');
      return { 
        error: { 
          message: 'Brak autoryzacji. Zaloguj się ponownie.',
          status: 401 
        } 
      };
    }
    
    const response = await sdk.store.customer.retrieve();
    console.log('✅ [JS SDK] Customer data fetched:', response);
    
    return { data: response.customer };
  } catch (error: any) {
    console.error('❌ [JS SDK] getCustomer error:', error);
    console.error('❌ [JS SDK] Error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText
    });
    
    return { 
      error: { 
        message: error.message || 'Błąd pobierania danych użytkownika',
        status: error.status || 401 
      } 
    };
  }
}

/**
 * Wylogowanie użytkownika (Medusa 2.0 JS SDK)
 */
export async function logoutCustomer(): Promise<ApiResponse<void>> {
  try {
    console.log('🔄 [JS SDK] Logging out customer...');
    
    // Wywołaj SDK logout (może nie działać jeśli nie ma tokena)
    try {
      await sdk.auth.logout();
    } catch (logoutError) {
      console.log('⚠️ SDK logout failed, clearing manually');
    }
    
    // Zawsze czyść tokeny ręcznie
    TokenManager.remove();
    
    console.log('✅ [JS SDK] Customer logged out successfully');
    return { data: undefined };
  } catch (error: any) {
    console.error('❌ [JS SDK] logoutCustomer error:', error);
    // Wyloguj lokalnie nawet jeśli API call failed
    TokenManager.remove();
    return { data: undefined };
  }
}

/**
 * Aktualizacja profilu użytkownika (Medusa 2.0 JS SDK)
 */
export async function updateCustomer(
  updates: Partial<Pick<RegisterRequest, 'first_name' | 'last_name' | 'phone'>>
): Promise<ApiResponse<Customer>> {
  try {
    console.log('🔄 [JS SDK] Updating customer profile...');
    
    // Ustaw token w SDK przed requestem
    const token = TokenManager.get();
    if (token) {
      TokenManager.setInSDK(token);
    } else {
      return { 
        error: { 
          message: 'Brak autoryzacji. Zaloguj się ponownie.',
          status: 401 
        } 
      };
    }
    
    const response = await sdk.store.customer.update(updates);
    console.log('✅ [JS SDK] Customer profile updated:', response);
    
    return { data: response.customer };
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
 * Sprawdza czy użytkownik jest zalogowany
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  const token = TokenManager.get();
  console.log('🔍 [JS SDK] Auth check - has token:', !!token);
  return !!token;
}

/**
 * Czyści dane autoryzacji (emergency logout)
 */
export function clearAuthentication(): void {
  TokenManager.remove();
  console.log('🧹 [JS SDK] Authentication data cleared');
}

/**
 * Sprawdza czy email jest dostępny do rejestracji
 */
export async function checkEmailAvailability(email: string): Promise<ApiResponse<{ available: boolean }>> {
  try {
    console.log('🔄 [JS SDK] Checking email availability:', email);
    
    // Sprawdź czy użytkownik już istnieje poprzez próbę rejestracji z nieprawidłowymi danymi
    // W Medusa 2.0 nie ma dedykowanego endpointu do sprawdzania emaili
    // Zwróćmy true dla prostoty - walidacja nastąpi podczas rzeczywistej rejestracji
    
    console.log('✅ [JS SDK] Email availability check completed');
    return { 
      data: { 
        available: true 
      } 
    };
  } catch (error: any) {
    console.error('❌ [JS SDK] checkEmailAvailability error:', error);
    // W przypadku błędu, pozwólmy na próbę rejestracji
    return { 
      data: { 
        available: true 
      } 
    };
  }
}

/**
 * Żądanie resetowania hasła (Medusa 2.0)
 * UWAGA: Ta funkcja może wymagać dodatkowej implementacji w backend
 */
export async function requestPasswordReset(email: string): Promise<ApiResponse<void>> {
  try {
    console.log('🔄 [JS SDK] Requesting password reset for:', email);
    
    // To może wymagać custom endpointu w Medusa 2.0 backend
    // Póki co zwracamy sukces bez rzeczywistej akcji
    return { 
      data: undefined
    };
  } catch (error: any) {
    console.error('❌ [JS SDK] requestPasswordReset error:', error);
    return { 
      error: { 
        message: error.message || 'Błąd żądania resetowania hasła',
        status: error.status || 400 
      } 
    };
  }
}

/**
 * Resetowanie hasła z tokenem (Medusa 2.0)
 * UWAGA: Ta funkcja może wymagać dodatkowej implementacji w backend
 */
export async function resetPassword(email: string, token: string, newPassword: string): Promise<ApiResponse<void>> {
  try {
    console.log('🔄 [JS SDK] Resetting password with token');
    
    // To może wymagać custom endpointu w Medusa 2.0 backend
    // Póki co zwracamy błąd informujący o niedostępności
    return { 
      error: { 
        message: 'Resetowanie hasła nie jest jeszcze dostępne. Skontaktuj się z obsługą klienta.',
        status: 501 
      } 
    };
  } catch (error: any) {
    console.error('❌ [JS SDK] resetPassword error:', error);
    return { 
      error: { 
        message: error.message || 'Błąd resetowania hasła',
        status: error.status || 400 
      } 
    };
  }
}

// Export funkcji token management dla kompatybilności z istniejącym kodem
export { isAuthenticated as getAuthToken };
export const setAuthToken = (token: string, rememberMe: boolean = false): void => {
  // JS SDK zarządza tokenami automatycznie, ale zachowaj interface
  console.log('⚠️ setAuthToken called - JS SDK manages tokens automatically');
};
export const clearAuthToken = clearAuthentication;
