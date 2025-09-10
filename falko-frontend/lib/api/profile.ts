import { API_CONFIG } from '@/lib/api-config';
import { ApiResponse } from './products';
import { sdk } from '@/lib/medusa-client';

/**
 * API functions dla zarządzania profilem użytkownika w Medusa.js 2.0 SDK
 * Customer profile, password management
 * 
 * UWAGA: SDK automatycznie zarządza tokenami i autoryzacją
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
    console.log('🔄 Fetching customer profile via SDK...');
    
    // SDK automatycznie zarządza tokenami
    const response = await sdk.store.customer.retrieve();

    console.log('✅ Customer profile fetched successfully via SDK');
    return { data: transformStoreCustomerToProfile(response.customer) };
  } catch (error: any) {
    console.error('❌ getCustomerProfile SDK error:', error);
    return { 
      error: { 
        message: error.message || 'Błąd pobierania profilu',
        status: 400 
      } 
    };
  }
}

/**
 * Aktualizuje profil zalogowanego użytkownika (Medusa 2.0 SDK)
 */
export async function updateCustomerProfile(
  updates: UpdateProfileRequest
): Promise<ApiResponse<CustomerProfile>> {
  try {
    console.log('🔄 Updating customer profile via SDK...');
    
    const response = await sdk.store.customer.update(updates);

    console.log('✅ Customer profile updated successfully via SDK');
    return { data: transformStoreCustomerToProfile(response.customer) };
  } catch (error: any) {
    console.error('❌ updateCustomerProfile SDK error:', error);
    return { 
      error: { 
        message: error.message || 'Błąd aktualizacji profilu',
        status: 400 
      } 
    };
  }
}

/**
 * Zmienia hasło użytkownika (Medusa 2.0 SDK)
 * Używa bezpośredniego fetch przez SDK client dla custom endpointów auth
 */
export async function changeCustomerPassword(
  passwordData: ChangePasswordRequest
): Promise<ApiResponse<void>> {
  try {
    console.log('🔄 Changing customer password via SDK...');
    
    // W Medusa 2.0 może być inny endpoint dla zmiany hasła
    // Użyjemy SDK client fetch dla custom endpointów
    await sdk.client.fetch('/auth/customer/emailpass/update', {
      method: 'POST',
      body: JSON.stringify({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      }),
    });

    console.log('✅ Customer password changed successfully via SDK');
    return { data: undefined };
  } catch (error: any) {
    console.error('❌ changeCustomerPassword SDK error:', error);
    return { 
      error: { 
        message: error.message || 'Błąd zmiany hasła',
        status: 400 
      } 
    };
  }
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
