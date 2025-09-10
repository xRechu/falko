'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/auth-context';
import { getCustomerAddresses, CustomerAddress } from '@/lib/api/addresses';
import { CheckoutFormData } from '@/components/checkout/CheckoutForm';

/**
 * Hook do zarządzania danymi profilu użytkownika w checkout
 * Automatycznie wypełnia formularz danymi z profilu i adresami
 */

export interface CheckoutProfile {
  // Dane osobowe z profilu
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Adresy użytkownika
  addresses: CustomerAddress[];
  defaultAddress: CustomerAddress | null;
  
  // Stan
  isLoading: boolean;
  hasProfile: boolean;
}

export interface CheckoutProfileHook extends CheckoutProfile {
  // Funkcje pomocnicze
  getInitialFormData: () => Partial<CheckoutFormData>;
  selectAddress: (address: CustomerAddress) => Partial<CheckoutFormData>;
  hasValidProfile: () => boolean;
  refreshAddresses: () => Promise<void>;
}

/**
 * Hook do pobierania i zarządzania danymi profilu dla checkout
 */
export function useCheckoutProfile(): CheckoutProfileHook {
  const { state } = useAuth();
  const { user, isAuthenticated, isLoading: authLoading } = state;
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  // Pobierz adresy gdy użytkownik jest zalogowany
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshAddresses();
    } else {
      // Wyczyść dane gdy użytkownik nie jest zalogowany
      setAddresses([]);
    }
  }, [isAuthenticated, user]);

  const refreshAddresses = async () => {
    if (!isAuthenticated || !user) {
      setAddresses([]);
      return;
    }

    setIsLoadingAddresses(true);
    try {
      const response = await getCustomerAddresses();
      if (response.data) {
        setAddresses(response.data);
        console.log('📋 Loaded user addresses for checkout:', response.data.length);
      }
    } catch (error) {
      console.error('❌ Error loading addresses for checkout:', error);
      setAddresses([]);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  // Znajdź domyślny adres (pierwszy lub oznaczony jako domyślny) - tylko dla zalogowanych
  const defaultAddress = isAuthenticated && addresses.length > 0 ? (
    addresses.find(addr => 
      // Sprawdź czy adres ma flagę is_default lub weź pierwszy
      (addr as any).is_default === true
    ) || addresses[0]
  ) : null;

  // Sprawdź czy użytkownik ma kompletny profil
  const hasValidProfile = (): boolean => {
    return !!(
      isAuthenticated &&
      user?.first_name && 
      user?.last_name && 
      user?.email &&
      user?.phone
    );
  };

  // Generuj początkowe dane formularza z profilu
  const getInitialFormData = (): Partial<CheckoutFormData> => {
    const initialData: Partial<CheckoutFormData> = {};

    // Dane osobowe z profilu - tylko dla zalogowanych
    if (isAuthenticated && user) {
      initialData.email = user.email || '';
      initialData.firstName = user.first_name || '';
      initialData.lastName = user.last_name || '';
      initialData.phone = user.phone || '';
    } else {
      // Puste dane dla niezalogowanych
      initialData.email = '';
      initialData.firstName = '';
      initialData.lastName = '';
      initialData.phone = '';
    }

    // Dane adresowe z domyślnego adresu
    if (defaultAddress) {
      initialData.address = defaultAddress.address_1 || '';
      initialData.city = defaultAddress.city || '';
      initialData.postalCode = defaultAddress.postal_code || '';
      initialData.country = defaultAddress.country_code || 'PL';
    } else {
      // Domyślne wartości
      initialData.country = 'PL';
    }

    // Domyślne opcje
    initialData.shippingMethod = 'standard';
    initialData.paymentMethod = 'card';
    initialData.newsletter = false;
    initialData.terms = false;
    initialData.notes = '';

    return initialData;
  };

  // Konwertuj wybrany adres na dane formularza
  const selectAddress = (address: CustomerAddress): Partial<CheckoutFormData> => {
    return {
      // Zachowaj obecne dane osobowe
      firstName: address.first_name || user?.first_name || '',
      lastName: address.last_name || user?.last_name || '',
      phone: address.phone || user?.phone || '',
      
      // Nadpisz dane adresowe
      address: address.address_1 || '',
      city: address.city || '',
      postalCode: address.postal_code || '',
      country: address.country_code || 'PL',
    };
  };

  const profile: CheckoutProfile = {
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    addresses,
    defaultAddress,
    isLoading: authLoading || isLoadingAddresses,
    hasProfile: isAuthenticated && !!user,
  };

  return {
    ...profile,
    getInitialFormData,
    selectAddress,
    hasValidProfile,
    refreshAddresses,
  };
}
