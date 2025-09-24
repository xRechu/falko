import { API_CONFIG } from '@/lib/api-config';
import { ApiResponse } from './products';
import { sdk } from '@/lib/medusa-client';
import TokenManager from '@/lib/token-manager';

/**
 * API functions dla zarządzania profilem użytkownika w Medusa.js 2.0 SDK
 * Customer profile, password management
 */

export interface CustomerProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  has_account?: boolean; // Opcjonalne - może nie być dostępne w SDK
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  metadata?: Record<string, any>;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

/**
 * Konwertuje StoreCustomer z SDK na nasz CustomerProfile
 */
function transformStoreCustomerToProfile(customer: any): CustomerProfile {
  return {
    id: customer.id,
    email: customer.email,
    first_name: customer.first_name || undefined,
    last_name: customer.last_name || undefined,
    phone: customer.phone || undefined,
    has_account: customer.has_account ?? true, // Domyślnie true jeśli nie ma
    created_at: customer.created_at,
    updated_at: customer.updated_at,
    metadata: customer.metadata || undefined,
  };
}

/**
 * Pobiera profil zalogowanego użytkownika (Medusa 2.0 SDK)
 */
export async function getCustomerProfile(): Promise<ApiResponse<CustomerProfile>> {
  try {
    console.log('🔄 [API Proxy] getCustomerProfile - Fetching profile via /api/customer/profile');
    const resp = await fetch('/api/customer/profile', { method: 'GET' })
    if (!resp.ok) {
      const msg = await resp.text().catch(() => '')
      throw new Error(msg || 'Unauthorized')
    }
    const data = await resp.json()
    return { data: transformStoreCustomerToProfile(data.customer) }
  } catch (error: any) {
    console.error('❌ [JS SDK] getCustomerProfile error:', error);
    return { 
      error: { 
        message: error.message || 'Błąd pobierania profilu',
        status: error.status || 400 
      } 
    };
  }
}

/**
 * Fallback funkcja z ręcznym zarządzaniem tokenami dla profilu
 */
async function getProfileWithManualToken(): Promise<ApiResponse<CustomerProfile>> {
  // Pobieramy token z TokenManager
  const token = TokenManager.get();
  console.log('TokenManager.get() result:', token ? `${token.substring(0, 20)}...` : 'null');
  
  if (!token) {
    console.warn('❌ [JS SDK] getCustomerProfile - No auth token found');
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
  console.log('✅ [JS SDK] Customer profile retrieved with manual token');
  return { data: transformStoreCustomerToProfile(response.customer) };
}

/**
 * Aktualizuje profil zalogowanego użytkownika (Medusa 2.0 SDK)
 */
export async function updateCustomerProfile(
  updates: UpdateProfileRequest
): Promise<ApiResponse<CustomerProfile>> {
  try {
    console.log('🔄 [API Proxy] updateCustomerProfile - Updating via /api/customer/profile', updates);
    const resp = await fetch('/api/customer/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    if (!resp.ok) {
      const msg = await resp.text().catch(() => '')
      throw new Error(msg || 'Update failed')
    }
    const data = await resp.json()
    return { data: transformStoreCustomerToProfile(data.customer) }
  } catch (error: any) {
    console.error('❌ [JS SDK] updateCustomerProfile error:', error);
    return { 
      error: { 
        message: error.message || 'Błąd aktualizacji profilu',
        status: error.status || 400 
      } 
    };
  }
}

/**
 * Fallback funkcja z ręcznym zarządzaniem tokenami dla aktualizacji profilu
 */
async function updateProfileWithManualToken(
  updates: UpdateProfileRequest
): Promise<ApiResponse<CustomerProfile>> {
  // Pobieramy token z TokenManager
  const token = TokenManager.get();
  console.log('TokenManager.get() result:', token ? `${token.substring(0, 20)}...` : 'null');
  
  if (!token) {
    console.warn('❌ [JS SDK] updateCustomerProfile - No auth token found');
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
  console.log('✅ [JS SDK] Customer profile updated with manual token');
  return { data: transformStoreCustomerToProfile(response.customer) };
}

/**
 * Zmienia hasło użytkownika (Medusa 2.0 SDK)
 * Używa bezpośredniego fetch przez SDK client dla custom endpointów auth
 */
export async function changeCustomerPassword(
  passwordData: ChangePasswordRequest
): Promise<ApiResponse<void>> {
  try {
    console.log('🔄 [JS SDK] changeCustomerPassword - Changing password...');
    
    // Najpierw sprawdźmy czy SDK ma automatyczną autoryzację
    try {
      // W Medusa 2.0 może być inny endpoint dla zmiany hasła
      // Użyjemy SDK client fetch dla custom endpointów
      await sdk.client.fetch('/auth/customer/emailpass/update', {
        method: 'POST',
        body: JSON.stringify({
          old_password: passwordData.old_password,
          new_password: passwordData.new_password,
        }),
      });
      
      console.log('✅ SDK has automatic authorization, password changed');
      return { data: undefined };
    } catch (authError) {
      console.log('❌ SDK does not have automatic authorization, trying manual token management...');
      console.log('Auth error:', authError);
      
      // Fallback: użyj ręcznego zarządzania tokenami
      return await changePasswordWithManualToken(passwordData);
    }
  } catch (error: any) {
    console.error('❌ [JS SDK] changeCustomerPassword error:', error);
    return { 
      error: { 
        message: error.message || 'Błąd zmiany hasła',
        status: error.status || 400 
      } 
    };
  }
}

/**
 * Fallback funkcja z ręcznym zarządzaniem tokenami dla zmiany hasła
 */
async function changePasswordWithManualToken(
  passwordData: ChangePasswordRequest
): Promise<ApiResponse<void>> {
  // Pobieramy token z TokenManager
  const token = TokenManager.get();
  console.log('TokenManager.get() result:', token ? `${token.substring(0, 20)}...` : 'null');
  
  if (!token) {
    console.warn('❌ [JS SDK] changeCustomerPassword - No auth token found');
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
  await sdk.client.fetch('/auth/customer/emailpass/update', {
    method: 'POST',
    body: JSON.stringify({
      old_password: passwordData.old_password,
      new_password: passwordData.new_password,
    }),
  });
  
  console.log('✅ [JS SDK] Customer password changed with manual token');
  return { data: undefined };
}

/**
 * Waliduje dane profilu
 */
export const validateProfileData = (profile: Partial<UpdateProfileRequest>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (profile.first_name !== undefined && !profile.first_name?.trim()) {
    errors.push('Imię nie może być puste');
  }
  
  if (profile.last_name !== undefined && !profile.last_name?.trim()) {
    errors.push('Nazwisko nie może być puste');
  }
  
  if (profile.phone && !/^\+?[1-9]\d{1,14}$/.test(profile.phone.replace(/\s/g, ''))) {
    errors.push('Podaj prawidłowy numer telefonu');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Waliduje hasło
 */
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Hasło musi mieć co najmniej 8 znaków');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Hasło musi zawierać co najmniej jedną wielką literę');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Hasło musi zawierać co najmniej jedną małą literę');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Hasło musi zawierać co najmniej jedną cyfrę');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Formatuje imię i nazwisko
 */
export const formatFullName = (profile: CustomerProfile): string => {
  const parts = [profile.first_name, profile.last_name].filter(Boolean);
  return parts.join(' ') || 'Użytkownik';
};
