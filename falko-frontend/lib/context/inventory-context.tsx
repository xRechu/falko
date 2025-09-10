'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useInventory } from '@/lib/hooks/useInventory';
import { InventoryData } from '@/lib/api/inventory';

/**
 * Context dla inventory
 */
interface InventoryContextType {
  inventory: Record<string, InventoryData>;
  isLoading: boolean;
  error: string | null;
  loadInventory: () => Promise<void>;
  getInventoryForVariant: (variantId: string) => InventoryData | null;
  isVariantAvailable: (variantId: string) => boolean;
  getVariantQuantity: (variantId: string) => number;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

interface InventoryProviderProps {
  children: ReactNode;
}

export function InventoryProvider({ children }: InventoryProviderProps) {
  const inventoryHook = useInventory();

  return (
    <InventoryContext.Provider value={inventoryHook}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventoryContext() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventoryContext must be used within an InventoryProvider');
  }
  return context;
}
