'use client';

import { useState, useEffect } from 'react';
import { fetchInventoryData, InventoryData } from '@/lib/api/inventory';

/**
 * Hook do zarządzania danymi inventory
 */
export function useInventory() {
  const [inventory, setInventory] = useState<Record<string, InventoryData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInventory = async () => {
    setIsLoading(true);
    setError(null);
    
    console.log('🔄 Loading inventory data...');
    
    try {
      const response = await fetchInventoryData();
      
      if (response.data) {
        console.log('✅ Inventory loaded:', response.data.inventory);
        setInventory(response.data.inventory);
      } else {
        console.error('❌ Inventory error:', response.error);
        setError(response.error?.message || 'Failed to load inventory');
      }
    } catch (err) {
      console.error('❌ Inventory loading error:', err);
      setError('Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const getInventoryForVariant = (variantId: string): InventoryData | null => {
    return inventory[variantId] || null;
  };

  const isVariantAvailable = (variantId: string): boolean => {
    const inv = getInventoryForVariant(variantId);
    console.log(`🔍 Checking availability for ${variantId}:`, inv);
    if (!inv) return false;
    
    return inv.is_available;
  };

  const getVariantQuantity = (variantId: string): number => {
    const inv = getInventoryForVariant(variantId);
    return inv?.inventory_quantity || 0;
  };

  return {
    inventory,
    isLoading,
    error,
    loadInventory,
    getInventoryForVariant,
    isVariantAvailable,
    getVariantQuantity,
  };
}
