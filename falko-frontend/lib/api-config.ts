/**
 * API Configuration zgodnie z "Local Dev, Cloud Services" workflow
 * 
 *
 */

export const API_CONFIG = {
  // Medusa.js Backend (lokalny serwer, zdalna baza)
  MEDUSA_BACKEND_URL: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000',
  MEDUSA_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
  
  // Strapi CMS (lokalny serwer, zdalna baza)
  STRAPI_API_URL: process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337',
  // Supabase Storage: usunięte (obrazy hostowane gdzie indziej)
} as const;

// Eksportuj bezpośrednio dla łatwego dostępu
export const MEDUSA_BASE_URL = API_CONFIG.MEDUSA_BACKEND_URL;
export const MEDUSA_PUBLISHABLE_KEY = API_CONFIG.MEDUSA_PUBLISHABLE_KEY;

/**
 * API Endpoints dla Medusa.js
 */
export const MEDUSA_ENDPOINTS = {
  PRODUCTS: `${API_CONFIG.MEDUSA_BACKEND_URL}/store/products`,
  PRODUCT_BY_ID: (id: string) => `${API_CONFIG.MEDUSA_BACKEND_URL}/store/products/${id}`,
  COLLECTIONS: `${API_CONFIG.MEDUSA_BACKEND_URL}/store/collections`,
  CART: `${API_CONFIG.MEDUSA_BACKEND_URL}/store/carts`,
  CUSTOMERS: `${API_CONFIG.MEDUSA_BACKEND_URL}/store/customers`,
} as const;

/**
 * API Endpoints dla Strapi CMS
 */
export const STRAPI_ENDPOINTS = {
  HERO_CONTENT: `${API_CONFIG.STRAPI_API_URL}/api/hero-sections`,
  BLOG_POSTS: `${API_CONFIG.STRAPI_API_URL}/api/blog-posts`,
  PAGES: `${API_CONFIG.STRAPI_API_URL}/api/pages`,
} as const;
