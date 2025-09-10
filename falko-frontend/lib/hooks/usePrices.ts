'use client';

import { useState, useEffect } from 'react';
import { fetchPricesData, PriceData } from '@/lib/api/prices';

/**
 * Hook do zarządzania danymi cen - UNIWERSALNY dla wszystkich produktów
 */
export function usePrices() {
  const [prices, setPrices] = useState<Record<string, PriceData[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPrices = async () => {
    setIsLoading(true);
    setError(null);
    
    console.log('🔄 Loading prices data...');
    
    try {
      const response = await fetchPricesData();
      
      if (response.data) {
        console.log('✅ Prices loaded:', response.data.prices);
        setPrices(response.data.prices);
      } else {
        console.error('❌ Prices error:', response.error);
        setError(response.error?.message || 'Failed to load prices');
      }
    } catch (err) {
      console.error('❌ Prices loading error:', err);
      setError('Failed to load prices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrices();
  }, []);

  /**
   * Pobiera ceny dla konkretnego wariantu
   */
  const getPricesForVariant = (variantId: string): PriceData[] => {
    return prices[variantId] || [];
  };

  /**
   * Pobiera cenę w konkretnej walucie dla wariantu
   */
  const getPriceInCurrency = (variantId: string, currency: string = 'pln'): PriceData | null => {
    const variantPrices = getPricesForVariant(variantId);
    return variantPrices.find(price => price.currency_code?.toLowerCase() === currency.toLowerCase()) || null;
  };

  /**
   * Sformatuj cenę do wyświetlenia
   */
  const formatPrice = (price: PriceData): string => {
    const formatter = new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: price.currency_code.toUpperCase(),
    });
    return formatter.format(price.amount / 100); // ceny w groszach
  };

  return {
    prices,
    isLoading,
    error,
    loadPrices,
    getPricesForVariant,
    getPriceInCurrency,
    formatPrice,
  };
}
