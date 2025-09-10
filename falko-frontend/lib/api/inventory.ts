import { medusaClient, handleApiError, withRetry } from '@/lib/medusa-client';
import { ApiResponse } from './products';

/**
 * Typy dla inventory API
 */
export interface InventoryData {
  inventory_quantity: number;
  manage_inventory: boolean;
  allow_backorder: boolean;
  is_available: boolean;
}

export interface InventoryResponse {
  inventory: Record<string, InventoryData>;
}

/**
 * Pobiera informacje o stanie magazynowym wszystkich wariantów
 */
export async function fetchInventoryData(): Promise<ApiResponse<InventoryResponse>> {
  try {
    console.log('🔄 Fetching inventory data from Medusa API...');
    
    const response = await withRetry(async () => {
      // Używamy custom endpointu, który stworzyliśmy w backendzie
      const url = `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/inventory`;
      
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
        },
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      return await res.json();
    });

    console.log('✅ Fetched inventory data successfully');
    return { data: response };
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('❌ fetchInventoryData error:', apiError);
    return { error: apiError };
  }
}
