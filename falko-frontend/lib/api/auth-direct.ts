import { API_CONFIG } from '@/lib/api-config';
import { ApiResponse } from './products';
import { Customer } from './auth';

/**
 * Alternative authentication functions using direct fetch
 * For cases where SDK authentication fails
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Login using direct API call instead of SDK
 */
export async function loginDirectAPI(
  credentials: LoginCredentials,
  rememberMe: boolean = false
): Promise<ApiResponse<{ customer: Customer }>> {
  try {
    console.log('🔄 [Direct API] Logging in user:', credentials.email);
    
    // Step 1: Login to auth endpoint
    const loginResponse = await fetch(`${API_CONFIG.MEDUSA_BACKEND_URL}/auth/customer/emailpass`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': API_CONFIG.MEDUSA_PUBLISHABLE_KEY || '',
      },
      credentials: 'include', // Important for cookies
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json().catch(() => null);
      throw new Error(errorData?.message || `Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ [Direct API] Login successful');

    // Step 2: Get customer data
    const customerResponse = await fetch(`${API_CONFIG.MEDUSA_BACKEND_URL}/store/customers/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': API_CONFIG.MEDUSA_PUBLISHABLE_KEY || '',
      },
      credentials: 'include', // Important for cookies
    });

    if (!customerResponse.ok) {
      const errorData = await customerResponse.json().catch(() => null);
      throw new Error(errorData?.message || `Failed to get customer data: ${customerResponse.status}`);
    }

    const customerData = await customerResponse.json();
    console.log('✅ [Direct API] Customer data retrieved:', customerData.customer?.email);

    // Store remember me preference
    if (rememberMe) {
      localStorage.setItem('auth_remember', 'true');
      localStorage.setItem('remembered_email', credentials.email);
    } else {
      localStorage.removeItem('auth_remember');
      localStorage.removeItem('remembered_email');
    }

    return { data: { customer: customerData.customer as Customer } };
    
  } catch (error: any) {
    console.error('❌ [Direct API] Login error:', error);
    return {
      error: {
        message: error.message || 'Błąd logowania',
        status: 401
      }
    };
  }
}

/**
 * Get customer data using direct API call
 */
export async function getCustomerDirectAPI(): Promise<ApiResponse<Customer>> {
  try {
    console.log('🔄 [Direct API] Getting customer data...');
    
    const response = await fetch(`${API_CONFIG.MEDUSA_BACKEND_URL}/store/customers/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': API_CONFIG.MEDUSA_PUBLISHABLE_KEY || '',
      },
      credentials: 'include', // Important for cookies
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `Failed to get customer data: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [Direct API] Customer data retrieved');
    
    return { data: data.customer as Customer };
    
  } catch (error: any) {
    console.error('❌ [Direct API] Get customer error:', error);
    return {
      error: {
        message: error.message || 'Błąd pobierania danych użytkownika',
        status: 401
      }
    };
  }
}

/**
 * Logout using direct API call
 */
export async function logoutDirectAPI(): Promise<ApiResponse<void>> {
  try {
    console.log('🔄 [Direct API] Logging out...');
    
    const response = await fetch(`${API_CONFIG.MEDUSA_BACKEND_URL}/auth/customer/emailpass`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': API_CONFIG.MEDUSA_PUBLISHABLE_KEY || '',
      },
      credentials: 'include', // Important for cookies
    });

    // Don't throw error if logout fails - clean up locally anyway
    if (response.ok) {
      console.log('✅ [Direct API] Logout successful');
    } else {
      console.warn('⚠️ [Direct API] Logout failed on server, cleaning up locally');
    }

    // Clean up local storage
    localStorage.removeItem('auth_remember');
    localStorage.removeItem('remembered_email');
    
    return { data: undefined };
    
  } catch (error: any) {
    console.error('❌ [Direct API] Logout error:', error);
    // Still return success - we want to clean up locally
    return { data: undefined };
  }
}