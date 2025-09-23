import type { HttpTypes } from "@medusajs/types";

/**
 * Auth API dostosowane do JWT w nagłówku + serwerowy HttpOnly cookie.
 * Front woła lokalne endpointy Next: /api/auth/login, /register, /me, /logout
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
    const resp = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...credentials, rememberMe })
    })
    if (!resp.ok) throw new Error(await resp.text())
    const me = await fetch('/api/auth/me', { method: 'GET' })
    if (!me.ok) throw new Error('Nie udało się pobrać danych użytkownika')
    const data = await me.json()
    return { data: { customer: data.customer as Customer } }
  } catch (error: any) {
    return { error: { message: error.message || 'Błąd logowania', status: 401 } }
  }
}

/**
 * Rejestracja użytkownika zgodnie z dokumentacją Medusa
 * https://docs.medusajs.com/resources/storefront-development/customers/register
 */
export async function registerCustomer(userData: RegisterRequest): Promise<ApiResponse<{ customer: Customer }>> {
  try {
    const resp = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    if (!resp.ok) throw new Error(await resp.text())
    const me = await fetch('/api/auth/me', { method: 'GET' })
    if (!me.ok) throw new Error('Nie udało się pobrać danych użytkownika')
    const data = await me.json()
    return { data: { customer: data.customer as Customer } }
  } catch (error: any) {
    return { error: { message: error.message || 'Błąd rejestracji', status: 400 } }
  }
}

/**
 * Pobieranie danych zalogowanego użytkownika
 * https://docs.medusajs.com/resources/storefront-development/customers/retrieve
 */
export async function getCurrentCustomer(): Promise<ApiResponse<{ customer: Customer | null }>> {
  try {
    const me = await fetch('/api/auth/me', { method: 'GET' })
    if (!me.ok) return { data: { customer: null } }
    const data = await me.json()
    return { data: { customer: data.customer as Customer } }
    
  } catch (error: any) {
    return { data: { customer: null } }
  }
}

/**
 * Wylogowanie użytkownika
 */
export async function logoutCustomer(): Promise<ApiResponse<{ success: boolean }>> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' })
    localStorage.removeItem('auth_remember')
    localStorage.removeItem('remembered_email')
    return { data: { success: true } }
    
  } catch (error: any) {
    localStorage.removeItem('auth_remember')
    localStorage.removeItem('remembered_email')
    return { data: { success: true } }
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