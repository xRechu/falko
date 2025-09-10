import Medusa from "@medusajs/js-sdk";
import { API_CONFIG } from "./api-config";

/**
 * Server-side Medusa SDK client - bez localStorage/sessionStorage
 * Używa tylko publicznych endpointów (store.*) 
 */
export const serverSdk = new Medusa({
  baseUrl: API_CONFIG.MEDUSA_BACKEND_URL,
  publishableKey: API_CONFIG.MEDUSA_PUBLISHABLE_KEY,
  // Wyłącz storage dla serwera
  auth: {
    type: "session"
  }
});

console.log('🖥️ Server-side Medusa SDK initialized:', {
  baseUrl: API_CONFIG.MEDUSA_BACKEND_URL,
  publishableKey: API_CONFIG.MEDUSA_PUBLISHABLE_KEY ? 'SET' : 'MISSING'
});
