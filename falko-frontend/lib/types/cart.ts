/**
 * Typy TypeScript dla koszyka zakupowego w Medusa.js
 */

// Podstawowe typy dla koszyka
export interface CartItem {
  id: string;
  cart_id: string;
  variant_id: string;
  product_id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  unit_price: number;
  quantity: number;
  total: number;
  original_total: number;
  created_at: Date;
  updated_at: Date;
  variant?: ProductVariant;
  product?: {
    id: string;
    title: string;
    handle: string;
    thumbnail?: string;
  };
}

// Wariant produktu
export interface ProductVariant {
  id: string;
  title: string;
  product_id: string;
  sku?: string;
  barcode?: string;
  prices: VariantPrice[];
  options: VariantOption[];
  inventory_quantity?: number;
  allow_backorder: boolean;
  manage_inventory: boolean;
  created_at: Date;
  updated_at: Date;
}

// Cena wariantu
export interface VariantPrice {
  id: string;
  currency_code: string;
  amount: number;
  variant_id: string;
  region_id?: string;
  price_set_id?: string;
}

// Opcja wariantu (rozmiar, kolor)
export interface VariantOption {
  id: string;
  value: string;
  option_id: string;
  variant_id: string;
  option: {
    id: string;
    title: string;
    product_id: string;
  };
}

// Główny obiekt koszyka
export interface Cart {
  id: string;
  email?: string;
  billing_address_id?: string;
  shipping_address_id?: string;
  region_id: string;
  customer_id?: string;
  payment_session?: any;
  payment_sessions: any[];
  discounts: any[];
  gift_cards: any[];
  completed_at?: Date;
  payment_authorized_at?: Date;
  idempotency_key?: string;
  context?: any;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  
  // Powiązane obiekty
  items: CartItem[];
  region: Region;
  discounts_total: number;
  gift_cards_total: number;
  tax_total: number;
  shipping_total: number;
  subtotal: number;
  total: number;
  refunded_total: number;
  paid_total: number;
  refundable_amount: number;
  shipping_address?: Address;
  billing_address?: Address;
  shipping_methods: ShippingMethod[];
}

// Region
export interface Region {
  id: string;
  name: string;
  currency_code: string;
  tax_rate: number;
  tax_code?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  metadata?: Record<string, any>;
}

// Adres
export interface Address {
  id: string;
  customer_id?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  country_code?: string;
  province?: string;
  postal_code?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

// Metoda dostawy
export interface ShippingMethod {
  id: string;
  cart_id: string;
  name: string;
  description?: string;
  amount: number;
  is_return: boolean;
  data: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// Request typy dla API
export interface AddToCartRequest {
  variant_id: string;
  quantity: number;
  metadata?: Record<string, any>;
}

export interface UpdateCartItemRequest {
  quantity: number;
  metadata?: Record<string, any>;
}

export interface CreateCartRequest {
  region_id?: string;
  sales_channel_id?: string;
  country_code?: string;
  email?: string;
  metadata?: Record<string, any>;
}

// Response typy
export interface CartResponse {
  cart: Cart;
}

export interface LineItemResponse {
  cart: Cart;
}

// Utility types
export type CartStatus = 'active' | 'completed' | 'requires_action';
export type PaymentStatus = 'not_paid' | 'awaiting' | 'captured' | 'partially_refunded' | 'refunded' | 'canceled';
export type FulfillmentStatus = 'not_fulfilled' | 'partially_fulfilled' | 'fulfilled' | 'partially_shipped' | 'shipped' | 'partially_returned' | 'returned' | 'canceled' | 'requires_action';
