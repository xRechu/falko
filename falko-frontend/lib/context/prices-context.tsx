'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { usePrices } from '@/lib/hooks/usePrices';
import { PriceData } from '@/lib/api/prices';

/**
 * Context dla prices - UNIWERSALNY dla wszystkich produktów
 */
interface PricesContextType {
  prices: Record<string, PriceData[]>;
  isLoading: boolean;
  error: string | null;
  loadPrices: () => Promise<void>;
  getPricesForVariant: (variantId: string) => PriceData[];
  getPriceInCurrency: (variantId: string, currency?: string) => PriceData | null;
  formatPrice: (price: PriceData) => string;
}

const PricesContext = createContext<PricesContextType | undefined>(undefined);

interface PricesProviderProps {
  children: ReactNode;
}

export function PricesProvider({ children }: PricesProviderProps) {
  const pricesHook = usePrices();

  return (
    <PricesContext.Provider value={pricesHook}>
      {children}
    </PricesContext.Provider>
  );
}

export function usePricesContext() {
  const context = useContext(PricesContext);
  if (context === undefined) {
    throw new Error('usePricesContext must be used within a PricesProvider');
  }
  return context;
}
