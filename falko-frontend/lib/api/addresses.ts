import { sdk, TokenManager } from '@/lib/medusa-client';
import { ApiResponse } from './products';
import type { HttpTypes } from "@medusajs/types";

/**
 * API functions dla zarządzania adresami klientów - Medusa.js 2.0 JS SDK
 */

// Używamy typów z Medusa SDK
export type CustomerAddress = HttpTypes.StoreCustomerAddress;
export type CreateAddressRequest = HttpTypes.StoreCreateCustomerAddress;
export type UpdateAddressRequest = HttpTypes.StoreUpdateCustomerAddress;
export type CustomerAddressData = CreateAddressRequest;

/**
 * Lista krajów z kodami
 */
export const COUNTRIES = [
  { code: 'PL', name: 'Polska' },
  { code: 'US', name: 'Stany Zjednoczone' },
  { code: 'DE', name: 'Niemcy' },
  { code: 'FR', name: 'Francja' },
  { code: 'IT', name: 'Włochy' },
  { code: 'ES', name: 'Hiszpania' },
  { code: 'GB', name: 'Wielka Brytania' },
];

/**
 * Formatuje adres do wyświetlenia
 */
export const formatAddress = (address: CustomerAddress): string => {
  const parts = [
    address.first_name && address.last_name ? `${address.first_name} ${address.last_name}` : '',
    address.company || '',
    address.address_1 || '',
    address.address_2 || '',
    [address.postal_code, address.city].filter(Boolean).join(' '),
    COUNTRIES.find(c => c.code === address.country_code)?.name || address.country_code
  ].filter(Boolean);
  
  return parts.join(', ');
};

/**
 * Waliduje dane adresu
 */
export const validateAddress = (address: Partial<CreateAddressRequest>): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  if (!address.first_name?.trim()) {
    errors.first_name = 'Imię jest wymagane';
  }
  
  if (!address.last_name?.trim()) {
    errors.last_name = 'Nazwisko jest wymagane';
  }
  
  if (!address.address_1?.trim()) {
    errors.address_1 = 'Adres jest wymagany';
  }
  
  if (!address.city?.trim()) {
    errors.city = 'Miasto jest wymagane';
  }
  
  if (!address.postal_code?.trim()) {
    errors.postal_code = 'Kod pocztowy jest wymagany';
  }
  
  if (!address.country_code?.trim()) {
    errors.country_code = 'Kraj jest wymagany';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Pobiera listę adresów użytkownika (Medusa 2.0)
 */
export async function getCustomerAddresses(): Promise<ApiResponse<CustomerAddress[]>> {
  try {
    console.log('🔄 [JS SDK] getCustomerAddresses - Getting customer addresses');
    
    // Sprawdźmy czy SDK ma automatyczną autoryzację
    try {
      console.log('🔍 Testing SDK auto-authorization for addresses...');
      const response = await sdk.store.customer.listAddress();
      console.log('✅ [JS SDK] Customer addresses retrieved with auto-auth:', response);
      return { data: response.addresses || [] };
    } catch (authError) {
      console.log('❌ SDK auto-auth failed, trying manual token management...');
      console.log('Auth error:', authError);
      
      // Fallback: sprawdź ręczne zarządzanie tokenami
      const token = TokenManager.get();
      if (!token) {
        console.warn('❌ [JS SDK] getCustomerAddresses - No auth token found');
        return { 
          error: { 
            message: 'Brak tokena uwierzytelniającego',
            status: 401 
          } 
        };
      }

      // Ustawiamy token w SDK
      TokenManager.setInSDK(token);
      
      // Próbuj ponownie z tokenem
      const response = await sdk.store.customer.listAddress();
      console.log('✅ [JS SDK] Customer addresses retrieved with manual token');
      return { data: response.addresses || [] };
    }
  } catch (error: any) {
    console.error('❌ [JS SDK] getCustomerAddresses error:', error);
    return { 
      error: { 
        message: error.message || 'Błąd pobierania adresów',
        status: error.status || 400 
      } 
    };
  }
}

/**
 * Tworzy nowy adres użytkownika (Medusa 2.0)
 */
export async function createCustomerAddress(
  addressData: CustomerAddressData
): Promise<ApiResponse<CustomerAddress>> {
  try {
    console.log('🔄 [JS SDK] createCustomerAddress - Creating new address');
    console.log('📋 Address data:', addressData);
    
    // Najpierw sprawdźmy czy SDK ma automatyczną autoryzację
    console.log('🔍 Testing SDK authorization...');
    
    try {
      // Sprawdź czy można pobrać dane customer bez ręcznego ustawiania tokena
      const testCustomer = await sdk.store.customer.retrieve();
      console.log('✅ SDK has automatic authorization, customer data:', testCustomer);
      
      // Jeśli SDK ma automatyczną autoryzację, nie potrzebujemy ręcznego TokenManager
      console.log('🔄 Using SDK with automatic authorization...');
      const response = await sdk.store.customer.createAddress(addressData);
      
      console.log('✅ [JS SDK] Customer address created successfully:', response);
      const newAddress = response.customer.addresses[response.customer.addresses.length - 1];
      return { data: newAddress };
      
    } catch (authError) {
      console.log('❌ SDK does not have automatic authorization, trying manual token management...');
      console.log('Auth error:', authError);
      
      // Fallback: użyj ręcznego zarządzania tokenami
      return await createAddressWithManualToken(addressData);
    }
    
  } catch (error: any) {
    console.error('❌ [JS SDK] createCustomerAddress error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      response: error.response,
      stack: error.stack
    });
    return { 
      error: { 
        message: error.message || 'Błąd tworzenia adresu',
        status: error.status || 400 
      } 
    };
  }
}

/**
 * Fallback funkcja z ręcznym zarządzaniem tokenami
 */
async function createAddressWithManualToken(
  addressData: CustomerAddressData
): Promise<ApiResponse<CustomerAddress>> {
  // Sprawdźmy obecny stan autoryzacji
  console.log('🔍 Checking authentication state...');
  console.log('window.localStorage available:', typeof window !== 'undefined' && !!window.localStorage);
  console.log('window.sessionStorage available:', typeof window !== 'undefined' && !!window.sessionStorage);
  
  if (typeof window !== 'undefined') {
    console.log('localStorage token:', localStorage.getItem('medusa_auth_token'));
    console.log('sessionStorage token:', sessionStorage.getItem('medusa_auth_token'));
  }
  
  // Pobieramy token z TokenManager
  const token = TokenManager.get();
  console.log('TokenManager.get() result:', token ? `${token.substring(0, 20)}...` : 'null');
  
  if (!token) {
    console.error('❌ [JS SDK] createCustomerAddress - No auth token found');
    
    // Sprawdźmy czy użytkownik jest zalogowany w kontekście auth
    console.log('🔍 Checking if user should be authenticated...');
    
    return { 
      error: { 
        message: 'Brak tokena uwierzytelniającego - zaloguj się ponownie',
        status: 401 
      } 
    };
  }

  console.log('✅ Token found, setting in SDK...');
  // Ustawiamy token w SDK
  TokenManager.setInSDK(token);
  
  // Sprawdźmy czy SDK ma token
  console.log('🔍 SDK auth state after setting token');
  
  // Używamy JS SDK do tworzenia adresu
  console.log('🔄 Calling SDK createAddress...');
  const response = await sdk.store.customer.createAddress(addressData);

  console.log('✅ [JS SDK] Customer address created successfully:', response);
  const newAddress = response.customer.addresses[response.customer.addresses.length - 1];
  return { data: newAddress };
}

/**
 * Aktualizuje istniejący adres użytkownika (Medusa 2.0)
 */
export async function updateCustomerAddress(
  addressId: string,
  updates: UpdateAddressRequest
): Promise<ApiResponse<CustomerAddress>> {
  try {
    console.log('🔄 [JS SDK] updateCustomerAddress - Updating address with ID:', addressId);
    
    // Pobieramy token z TokenManager
    const token = TokenManager.get();
    if (!token) {
      console.warn('❌ [JS SDK] updateCustomerAddress - No auth token found');
      return { 
        error: { 
          message: 'Brak tokena uwierzytelniającego',
          status: 401 
        } 
      };
    }

    // Ustawiamy token w SDK
    TokenManager.setInSDK(token);
    
    // Używamy JS SDK do aktualizacji adresu
    const response = await sdk.store.customer.updateAddress(addressId, updates);

    console.log('✅ [JS SDK] Customer address updated successfully');
    // SDK zwraca { customer } - musimy znaleźć zaktualizowany adres
    const updatedAddress = response.customer.addresses.find(addr => addr.id === addressId);
    return { data: updatedAddress! };
  } catch (error: any) {
    console.error('❌ [JS SDK] updateCustomerAddress error:', error);
    return { 
      error: { 
        message: error.message || 'Błąd aktualizacji adresu',
        status: error.status || 400 
      } 
    };
  }
}

/**
 * Usuwa adres użytkownika (Medusa 2.0)
 */
export async function deleteCustomerAddress(addressId: string): Promise<ApiResponse<void>> {
  try {
    console.log('🔄 [JS SDK] deleteCustomerAddress - Deleting address with ID:', addressId);
    
    // Pobieramy token z TokenManager
    const token = TokenManager.get();
    if (!token) {
      console.warn('❌ [JS SDK] deleteCustomerAddress - No auth token found');
      return { 
        error: { 
          message: 'Brak tokena uwierzytelniającego',
          status: 401 
        } 
      };
    }

    // Ustawiamy token w SDK
    TokenManager.setInSDK(token);
    
    // Używamy JS SDK do usuwania adresu
    await sdk.store.customer.deleteAddress(addressId);

    console.log('✅ [JS SDK] Customer address deleted successfully');
    return { data: undefined };
  } catch (error: any) {
    console.error('❌ [JS SDK] deleteCustomerAddress error:', error);
    return { 
      error: { 
        message: error.message || 'Błąd usuwania adresu',
        status: error.status || 400 
      } 
    };
  }
}
