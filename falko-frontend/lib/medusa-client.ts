import Medusa from "@medusajs/js-sdk";
import { API_CONFIG } from "./api-config";

// Debug log - sprawdź czy plik jest w ogóle ładowany
console.log('🚀 medusa-client.ts loading...');
console.log('📋 API_CONFIG:', API_CONFIG);

// Force inicjalizacja na starcie aplikacji
if (typeof window !== 'undefined') {
  console.log('🌐 Browser environment detected, initializing SDK...');
}

/**
 * Medusa.js 2.0 JS SDK client dla komunikacji z backend API
 * Używa session authentication zgodnie z dokumentacją Medusa
 * 
 * UWAGA: Ten klient automatycznie zarządza sesjami przez cookies
 * Po zalogowaniu przez sdk.auth.login(), wszystkie kolejne requesty
 * będą automatycznie uwierzytelnianie przez session cookies.
 */
export const sdk = new Medusa({
  baseUrl: API_CONFIG.MEDUSA_BACKEND_URL,
  publishableKey: API_CONFIG.MEDUSA_PUBLISHABLE_KEY,
  debug: process.env.NODE_ENV === 'development',
  auth: {
    type: 'session'
  }
});

// Wymuś wysyłanie cookies (sesji) przy każdym request zgodnie z dokumentacją
try {
  // Sprawdź czy jesteśmy w browser environment i czy SDK ma client z request
  if (typeof window !== 'undefined' && (sdk as any).client?.request) {
    const originalFetch = (sdk as any).client.request.bind((sdk as any).client);
    
    (sdk as any).client.request = async (path: string, options: RequestInit = {}) => {
      const pubKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || API_CONFIG.MEDUSA_PUBLISHABLE_KEY || '';
      
      // Dla session auth używamy tylko cookies - bez dodawania tokenów JWT
      const enhancedOptions: RequestInit = {
        ...options,
        credentials: 'include', // Kluczowe dla session cookies
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': pubKey,
          ...(options.headers || {}),
        },
      };
      
      console.log(`🌐 SDK Request to: ${path}`, {
        ...enhancedOptions,
        headers: {
          ...enhancedOptions.headers,
          'x-publishable-api-key': pubKey ? `${pubKey.substring(0, 10)}...` : 'NOT SET'
        }
      });
      
      return originalFetch(path, enhancedOptions);
    };
    
    console.log('✅ SDK fetch credentials=include oraz x-publishable-api-key ustawione');
  } else {
    console.log('⚠️ SDK enhancements pomijane (server-side lub brak client.request)');
  }
} catch (e) {
  console.warn('⚠️ Nie udało się ustawić SDK enhancements', e);
}

console.log('🔧 Medusa JS SDK config:', {
  baseUrl: API_CONFIG.MEDUSA_BACKEND_URL,
  publishableKey: API_CONFIG.MEDUSA_PUBLISHABLE_KEY ? API_CONFIG.MEDUSA_PUBLISHABLE_KEY.substring(0, 10) + '...' : 'NOT SET',
  authType: 'session',
  debug: process.env.NODE_ENV === 'development'
});

// Export tylko SDK - session auth jest zarządzany automatycznie przez cookies
export default sdk;

// Eksportuj też stary alias dla kompatybilności
export const medusaClient = sdk;

/**
 * Helper do obsługi błędów API - kompatybilny z JS SDK
 */
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export const handleApiError = (error: any): ApiError => {
  console.error('Medusa JS SDK Error:', error);
  
  // JS SDK rzuca FetchError objects
  if (error?.status && error?.message) {
    return {
      message: error.message,
      status: error.status,
      code: error.statusText,
    };
  }
  
  if (error?.message) {
    return {
      message: error.message,
      status: error?.status,
    };
  }
  
  return {
    message: 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.',
    status: 500,
  };
};

/**
 * Helper do retry logic
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        continue;
      }
    }
  }
  
  throw lastError;
};
