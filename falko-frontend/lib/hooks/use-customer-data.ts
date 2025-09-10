import { useState, useEffect } from 'react';
import { getCustomerOrders, Order } from '@/lib/api/orders';
import { getCustomerAddresses, CustomerAddress } from '@/lib/api/addresses';
import { getCustomerProfile, type CustomerProfile } from '@/lib/api/profile';

/**
 * Hook do zarządzania zamówieniami użytkownika
 */
export function useCustomerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getCustomerOrders();
      
      if (response.error) {
        setError(response.error.message);
      } else if (response.data) {
        setOrders(response.data.orders);
      }
    } catch (err: any) {
      setError('Błąd pobierania zamówień');
      console.error('useCustomerOrders error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders
  };
}

/**
 * Hook do zarządzania adresami użytkownika
 */
export function useCustomerAddresses() {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAddresses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getCustomerAddresses();
      
      if (response.error) {
        setError(response.error.message);
      } else if (response.data) {
        setAddresses(response.data);
      }
    } catch (err: any) {
      setError('Błąd pobierania adresów');
      console.error('useCustomerAddresses error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  return {
    addresses,
    loading,
    error,
    refetch: fetchAddresses
  };
}

/**
 * Hook do zarządzania profilem użytkownika
 */
export function useCustomerProfile() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getCustomerProfile();
      
      if (response.error) {
        setError(response.error.message);
      } else if (response.data) {
        setProfile(response.data);
      }
    } catch (err: any) {
      setError('Błąd pobierania profilu');
      console.error('useCustomerProfile error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile
  };
}
