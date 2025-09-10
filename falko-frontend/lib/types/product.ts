/**
 * Typy danych zgodne z Medusa.js API
 * Bazują na rzeczywistych typach z @medusajs/medusa
 */

export interface MoneyAmount {
  id: string;
  currency_code: string;
  amount: number;
  min_quantity?: number;
  max_quantity?: number;
}

export interface ProductOption {
  id: string;
  title: string;
  product_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface ProductOptionValue {
  id: string;
  value: string;
  option_id: string;
  option?: ProductOption;
  created_at: Date;
  updated_at: Date;
}

export interface ProductVariant {
  id: string;
  title: string;
  product_id: string;
  sku?: string;
  barcode?: string;
  ean?: string;
  upc?: string;
  variant_rank?: number;
  allow_backorder: boolean;
  manage_inventory: boolean;
  hs_code?: string;
  origin_country?: string;
  mid_code?: string;
  material?: string;
  weight?: number;
  length?: number;
  height?: number;
  width?: number;
  prices: MoneyAmount[];
  options?: ProductOptionValue[];
  created_at: Date;
  updated_at: Date;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, any>;
}

export interface ProductCollection {
  id: string;
  title: string;
  handle: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Główny typ Product zgodny z Medusa.js
 */
export interface Product {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  handle: string;
  is_giftcard: boolean;
  status: 'draft' | 'proposed' | 'published' | 'rejected';
  thumbnail?: string;
  profile_id?: string;
  weight?: number;
  length?: number;
  height?: number;
  width?: number;
  hs_code?: string;
  origin_country?: string;
  mid_code?: string;
  material?: string;
  collection_id?: string;
  collection?: ProductCollection;
  type_id?: string;
  variants: ProductVariant[];
  images: ProductImage[];
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, any>;
}

/**
 * Simplified Product type dla UI komponentów
 * (zawiera tylko najważniejsze pola)
 */
export interface ProductPreview {
  id: string;
  title: string;
  handle: string;
  thumbnail?: string;
  price?: {
    amount: number;
    currency_code: string;
  };
  collection?: {
    id: string;
    title: string;
  };
  // Dodajemy pierwszy wariant do produktu preview
  firstVariant?: {
    id: string;
    title: string;
    prices?: MoneyAmount[];
  };
  // Dodajemy informację o ilości wariantów
  variantCount?: number;
}

/**
 * Detailed Product type dla stron szczegółów produktu
 * Zawiera wszystkie informacje potrzebne na stronie produktu
 */
export interface ProductDetail {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  handle: string;
  thumbnail?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  collection?: ProductCollection;
  weight?: number;
  length?: number;
  height?: number;
  width?: number;
  material?: string;
  origin_country?: string;
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, any>;
}
