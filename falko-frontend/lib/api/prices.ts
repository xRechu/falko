import { medusaClient, handleApiError, withRetry } from '@/lib/medusa-client';
import { ApiResponse } from './products';

/**
 * Typy dla prices API - zgodne z Medusa v2
 */
export interface PriceData {
  id: string;
  currency_code: string;
  amount: number;
  min_quantity?: number;
  max_quantity?: number;
}

export interface PricesResponse {
  prices: Record<string, PriceData[]>; // variant_id -> array of prices
}

/**
 * Pobiera informacje o cenach wszystkich wariantów produktów
 * UWAGA: Ten endpoint jest DYNAMICZNY - automatycznie pobiera ceny dla wszystkich produktów w bazie
 */
export async function fetchPricesData(): Promise<ApiResponse<PricesResponse>> {
  try {
    console.log('🔄 Fetching prices data from Medusa API...');
    
    const response = await withRetry(async () => {
      // Używamy custom endpointu, który stworzyliśmy w backendzie
      const url = `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/prices`;
      
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

    console.log('✅ Fetched prices data successfully');
    return { data: response };
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('❌ fetchPricesData error:', apiError);
    return { error: apiError };
  }
}
