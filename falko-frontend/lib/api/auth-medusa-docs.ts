import { sdk } from '@/lib/medusa-client';
import type { HttpTypes } from "@medusajs/types";
import { FetchError } from "@medusajs/js-sdk";

/**
 * Auth API zgodny z dokumentacją Medusa 2.0 - tylko session authentication
 * Dokumentacja: https://docs.medusajs.com/resources/storefront-development/customers/
 */

// Używamy typu z Medusa 2.0
export type Customer = HttpTypes.StoreCustomer & {
  has_account?: boolean;
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

export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    status?: number;
  };
}

/**
 * Logowanie użytkownika zgodnie z dokumentacją Medusa
 * https://docs.medusajs.com/resources/storefront-development/customers/login
 */
export async function loginCustomer(credentials: LoginRequest, rememberMe: boolean = false): Promise<ApiResponse<{ customer: Customer }>> {
  try {
    console.log('🔄 Logging in customer via SDK (session mode):', credentials.email);
    
    // Krok 1: Logowanie przez SDK (automatycznie zarządza session cookies)
    const loginResult = await sdk.auth.login(
      "emailpass",
      {
        email: credentials.email,
        password: credentials.password,
      },
      { actor_type: "customer" }
    );
    
    console.log('✅ SDK login raw response keys:', Object.keys(loginResult || {}));
    
    // Zapisz preferencje remember me (bez tokenów, tylko UI preferences)
    if (rememberMe) {
      localStorage.setItem('auth_remember', 'true');
      localStorage.setItem('remembered_email', credentials.email);
    } else {
      localStorage.removeItem('auth_remember');
      localStorage.removeItem('remembered_email');
    }
    
    // Krok 2: Pobierz dane customera (SDK automatycznie używa session cookies)
    const customerResponse = await sdk.store.customer.retrieve();
    
    console.log('✅ Customer data retrieved (session):', customerResponse.customer?.email);
    
    return { data: { customer: customerResponse.customer as Customer } };
    
  } catch (error: any) {
    console.error('❌ loginCustomer SDK error:', error);
    
    return {
      error: {
        message: error.message || 'Błąd logowania',
        status: 400
      }
    };
  }
}

/**
 * Rejestracja użytkownika zgodnie z dokumentacją Medusa
 * https://docs.medusajs.com/resources/storefront-development/customers/register
 */
export async function registerCustomer(userData: RegisterRequest): Promise<ApiResponse<{ customer: Customer }>> {
  try {
    console.log('🔄 Registering customer via SDK (following official docs):', userData.email);
    
    // 1) Zarejestruj tożsamość (identity). Zwracana wartość NIE tworzy sesji cookie.
    await sdk.auth.register(
      "emailpass",
      {
        email: userData.email,
        password: userData.password,
      },
      { actor_type: "customer" }
    );

    // 2) Natychmiast zaloguj użytkownika, aby ustawić ciasteczko sesyjne (session auth)
    try {
      await sdk.auth.login(
        "emailpass",
        {
          email: userData.email,
          password: userData.password,
        },
        { actor_type: "customer" }
      );
      console.log('✅ Login after registration succeeded (session cookie set)');
    } catch (e: any) {
      console.warn('⚠️ Login right after registration failed:', e?.message || e);
      // Bez zalogowania nie utworzymy profilu – zakończ z błędem z jasnym komunikatem
      return {
        error: {
          message: 'Rejestracja się udała, ale logowanie nie powiodło się. Spróbuj zalogować się ręcznie.',
          status: 401,
        }
      }
    }

    // 3) Teraz, gdy mamy sesję, spróbuj stworzyć profil klienta
    try {
      const customerCreateResponse = await sdk.store.customer.create({
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
      });
      console.log('✅ Customer profile created successfully');
      return { data: { customer: customerCreateResponse.customer as Customer } };
    } catch (createErr: any) {
      console.warn('⚠️ Customer profile creation failed, trying to retrieve existing:', createErr?.message || createErr);
      // Może profil już istnieje – spróbuj pobrać bieżącego klienta
      try {
        const existing = await sdk.store.customer.retrieve();
        if (existing?.customer) {
          console.log('✅ Retrieved existing customer profile');
          return { data: { customer: existing.customer as Customer } };
        }
      } catch (retrieveErr: any) {
        console.error('❌ Failed to retrieve customer after registration:', retrieveErr?.message || retrieveErr);
      }
      return {
        error: {
          message: 'Rejestracja się udała, ale nie udało się utworzyć profilu. Spróbuj się zalogować.',
          status: 400,
        }
      }
    }
    
  } catch (error: any) {
    const fetchError = error as FetchError;
    
    // Zgodnie z dokumentacją: handle case where email already exists
    if (fetchError.message?.includes("Identity with email already exists")) {
      console.log('📧 Email already exists, trying login flow as per Medusa docs...');
      
      try {
        // Login flow dla istniejącego identity (dokumentacja Medusa)
        const loginResult = await sdk.auth.login("customer", "emailpass", {
          email: userData.email,
          password: userData.password,
        });
        
        if (!loginResult) {
          return {
            error: {
              message: 'Konto z tym e-mailem już istnieje, ale hasło jest nieprawidłowe.',
              status: 400
            }
          };
        }
        
        if (typeof loginResult !== "string") {
          return {
            error: {
              message: 'Authentication requires more actions, which is not supported by this flow.',
              status: 400
            }
          };
        }
        
        console.log('✅ Login successful for existing identity');
        
      } catch (loginError: any) {
        return {
          error: {
            message: 'Konto z tym e-mailem już istnieje. Sprawdź hasło lub zaloguj się.',
            status: 400
          }
        };
      }
    } else {
      // Inne błędy rejestracji
      console.error('❌ Registration error:', error);
      
      return {
        error: {
          message: `Błąd rejestracji: ${error.message}` || 'Nie udało się zarejestrować użytkownika.',
          status: 400
        }
      };
    }
  }
  
  // Krok 2: Utwórz profil customera (zgodnie z docs - auth.register daje token)
  try {
    const customerCreateResponse = await sdk.store.customer.create({
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      phone: userData.phone,
    });
    
    console.log('✅ Customer profile created successfully');
    
    return { data: { customer: customerCreateResponse.customer as Customer } };
    
  } catch (createError: any) {
    console.warn('Customer profile creation failed, trying to retrieve existing:', createError);
    
    // Może profil już istnieje, spróbuj go pobrać
    try {
      const existingCustomer = await sdk.store.customer.retrieve();
      console.log('✅ Retrieved existing customer profile');
      return { data: { customer: existingCustomer.customer as Customer } };
    } catch (retrieveError: any) {
      console.error('Failed to retrieve customer after registration:', retrieveError);
      return {
        error: {
          message: 'Rejestracja się udała, ale nie udało się utworzyć profilu. Spróbuj się zalogować.',
          status: 400
        }
      };
    }
  }
}

/**
 * Pobieranie danych zalogowanego użytkownika
 * https://docs.medusajs.com/resources/storefront-development/customers/retrieve
 */
export async function getCurrentCustomer(): Promise<ApiResponse<{ customer: Customer | null }>> {
  try {
    console.log('🔄 Retrieving current customer via SDK...');
    
    const customerResponse = await sdk.store.customer.retrieve();
    
    console.log('✅ Current customer retrieved:', customerResponse.customer?.email);
    
    return { data: { customer: customerResponse.customer as Customer } };
    
  } catch (error: any) {
    console.log('❌ No current customer or error:', error.message);
    
    // Nie jest błędem jeśli nie ma zalogowanego użytkownika
    return { data: { customer: null } };
  }
}

/**
 * Wylogowanie użytkownika
 */
export async function logoutCustomer(): Promise<ApiResponse<{ success: boolean }>> {
  try {
    console.log('🔄 Logging out customer via SDK...');
    
    // Wyloguj przez SDK (automatycznie usunie session cookies)
    await sdk.auth.logout();
    
    // Usuń preferencje z localStorage
    localStorage.removeItem('auth_remember');
    localStorage.removeItem('remembered_email');
    
    console.log('✅ Customer logged out successfully');
    
    return { data: { success: true } };
    
  } catch (error: any) {
    console.error('❌ Logout error:', error);
    
    // Nawet jeśli SDK logout się nie uda, usuń local data
    localStorage.removeItem('auth_remember');
    localStorage.removeItem('remembered_email');
    
    return {
      error: {
        message: 'Błąd podczas wylogowywania',
        status: 500
      }
    };
  }
}

/**
 * Sprawdź czy użytkownik jest zalogowany
 */
export async function isCustomerLoggedIn(): Promise<boolean> {
  try {
    const response = await getCurrentCustomer();
    return !!response.data?.customer;
  } catch {
    return false;
  }
}

/**
 * Helper do sprawdzenia czy email jest zapamiętany
 */
export function getRememberedEmail(): string | null {
  try {
    return localStorage.getItem('remembered_email');
  } catch {
    return null;
  }
}

/**
 * Helper do sprawdzenia czy remember me jest aktywne
 */
export function isRememberMeEnabled(): boolean {
  try {
    return localStorage.getItem('auth_remember') === 'true';
  } catch {
    return false;
  }
}