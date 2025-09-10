import { ProductPreview, ProductDetail } from "@/lib/types/product";
import { sdk } from "@/lib/medusa-client";
import { serverSdk } from "@/lib/medusa-server-client";
import type { HttpTypes } from "@medusajs/types";

/**
 * Wybiera odpowiedni SDK w zależności od środowiska
 */
function getSDK() {
  // Jeśli jesteśmy na serwerze (podczas wykonywania API route), użyj serverSdk
  if (typeof window === 'undefined') {
    return serverSdk;
  }
  // W przeglądarce użyj normalnego SDK
  return sdk;
}

/**
 * API Response wrapper dla lepszego error handling
 */
export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    status?: number;
    code?: string;
  };
  loading?: boolean;
}

/**
 * Pobiera listę produktów z Medusa.js API v2
 * @param options - opcje zapytania (limit, offset, collection_id, etc.)
 * @returns Promise z listą produktów lub błędem
 */
export async function fetchProductsFromAPI(options: {
  limit?: number;
  offset?: number;
  collection_id?: string;
  handle?: string;
} = {}): Promise<ApiResponse<ProductPreview[]>> {
  try {
    console.log('🔄 Fetching products from Medusa API v2...');
    
    const medusaSDK = getSDK();
    const response = await medusaSDK.store.product.list({
      limit: options.limit || 20,
      offset: options.offset || 0,
      collection_id: options.collection_id ? [options.collection_id] : undefined,
      handle: options.handle,
      region_id: 'reg_01JZ0ACKJ42QHCZB0XFKBKNG8N', // Region Polski
      fields: '+variants.calculated_price',
    });

    // Przekształć dane Medusa v2 na nasze typy
    const products: ProductPreview[] = response.products.map((product: HttpTypes.StoreProduct) => {
      // Pierwszy wariant dla ceny i ID
      const firstVariant = product.variants?.[0];
      
      // W Medusa v2 ceny są w calculated_price
      let priceAmount = 0;
      let currencyCode = 'PLN';
      
      // Sprawdź czy wariant ma cenę w calculated_price
      if (firstVariant?.calculated_price) {
        priceAmount = firstVariant.calculated_price.calculated_amount || 0;
        currencyCode = firstVariant.calculated_price.currency_code || 'PLN';
      }

      return {
        id: product.id || '',
        title: product.title || '',
        handle: product.handle || '',
        thumbnail: product.thumbnail || product.images?.[0]?.url || undefined,
        price: priceAmount > 0 ? {
          amount: priceAmount,
          currency_code: currencyCode
        } : undefined,
        collection: product.collection ? {
          id: product.collection.id,
          title: product.collection.title
        } : undefined,
        firstVariant: firstVariant && firstVariant.id ? {
          id: firstVariant.id,
          title: firstVariant.title || '',
          prices: firstVariant.calculated_price ? [{
            id: firstVariant.calculated_price.id || '',
            currency_code: firstVariant.calculated_price.currency_code || 'PLN',
            amount: firstVariant.calculated_price.calculated_amount || 0,
          }] : []
        } : undefined,
        // Dodaj informację o ilości wariantów
        variantCount: product.variants?.length || 0
      };
    });

    console.log(`✅ Fetched ${products.length} products from Medusa API v2`);
    return { data: products };
  } catch (error) {
    console.error('❌ fetchProductsFromAPI error:', error);
    return { 
      error: { 
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 500 
      } 
    };
  }
}

/**
 * Pobiera pojedynczy produkt po ID z Medusa.js API v2
 * @param productId - ID produktu
 * @returns Promise z ProductDetail lub błędem
 */
export async function fetchProductByIdFromAPI(productId: string): Promise<ApiResponse<ProductDetail>> {
  try {
    console.log(`🔄 Fetching product ${productId} from Medusa API v2...`);
    
    const medusaSDK = getSDK();
    const response = await medusaSDK.store.product.retrieve(productId, {
      region_id: 'reg_01JZ0ACKJ42QHCZB0XFKBKNG8N', // Region Polski
      fields: '+variants.calculated_price',
    });

    const productDetail = transformMedusaProductToDetail(response.product);
    
    console.log(`✅ Fetched product ${productId} from Medusa API v2`);
    return { data: productDetail };
  } catch (error) {
    console.error(`❌ fetchProductByIdFromAPI error for ${productId}:`, error);
    return { 
      error: { 
        message: error instanceof Error ? error.message : 'Product not found',
        status: 404 
      } 
    };
  }
}

/**
 * Pobiera szczegółowy produkt po handle z Medusa.js API v2
 * @param handle - handle produktu (SEO-friendly identifier)
 * @returns Promise z ProductDetail lub błędem
 */
export async function fetchProductByHandleFromAPI(handle: string): Promise<ApiResponse<ProductDetail>> {
  try {
    console.log(`🔄 Fetching product by handle ${handle} from Medusa API v2...`);
    
    const medusaSDK = getSDK();
    const response = await medusaSDK.store.product.list({ 
      handle,
      region_id: 'reg_01JZ0ACKJ42QHCZB0XFKBKNG8N', // Region Polski
      fields: '+variants.calculated_price',
    });

    // W Medusa.js produkty są zwracane jako tablica, nawet dla pojedynczego handle
    const product = response.products?.find((p: HttpTypes.StoreProduct) => p.handle === handle);
    
    if (!product) {
      return { error: { message: 'Produkt nie znaleziony', status: 404 } };
    }

    const productDetail = transformMedusaProductToDetail(product);
    
    console.log(`✅ Fetched product by handle ${handle} from Medusa API v2`);
    return { data: productDetail };
  } catch (error) {
    console.error(`❌ fetchProductByHandleFromAPI error for ${handle}:`, error);
    return { 
      error: { 
        message: error instanceof Error ? error.message : 'Product not found',
        status: 404 
      } 
    };
  }
}

/**
 * Transformuje pełny obiekt produktu z Medusa.js v2 na ProductDetail dla UI
 * @param medusaProduct - pełny produkt z Medusa API v2
 * @returns ProductDetail
 */
function transformMedusaProductToDetail(medusaProduct: HttpTypes.StoreProduct): ProductDetail {
  return {
    id: medusaProduct.id || '',
    title: medusaProduct.title || '',
    subtitle: medusaProduct.subtitle || undefined,
    description: medusaProduct.description || undefined,
    handle: medusaProduct.handle || '',
    thumbnail: medusaProduct.thumbnail || undefined,
    images: medusaProduct.images?.map((img: any) => ({
      id: img.id || '',
      product_id: medusaProduct.id || '',
      url: img.url || '',
      created_at: img.created_at ? new Date(img.created_at) : new Date(),
      updated_at: img.updated_at ? new Date(img.updated_at) : new Date(),
    })) || [],
    variants: medusaProduct.variants?.map((variant: any) => ({
      id: variant.id || '',
      title: variant.title || '',
      product_id: medusaProduct.id || '',
      sku: variant.sku || undefined,
      allow_backorder: variant.allow_backorder || false,
      manage_inventory: variant.manage_inventory || true,
      prices: variant.calculated_price ? [{
        id: variant.calculated_price.id || '',
        currency_code: variant.calculated_price.currency_code || 'pln',
        amount: variant.calculated_price.calculated_amount || 0,
      }] : [],
      options: variant.options?.map((optionValue: any) => ({
        id: optionValue.id || '',
        value: optionValue.value || '',
        option_id: optionValue.option_id || '',
        option: optionValue.option ? {
          id: optionValue.option.id || '',
          title: optionValue.option.title || '',
          product_id: optionValue.option.product_id || medusaProduct.id || '',
          created_at: optionValue.option.created_at ? new Date(optionValue.option.created_at) : new Date(),
          updated_at: optionValue.option.updated_at ? new Date(optionValue.option.updated_at) : new Date(),
        } : undefined,
        created_at: optionValue.created_at ? new Date(optionValue.created_at) : new Date(),
        updated_at: optionValue.updated_at ? new Date(optionValue.updated_at) : new Date(),
      })) || [],
      created_at: variant.created_at ? new Date(variant.created_at) : new Date(),
      updated_at: variant.updated_at ? new Date(variant.updated_at) : new Date(),
    })) || [],
    collection: medusaProduct.collection ? {
      id: medusaProduct.collection.id || '',
      title: medusaProduct.collection.title || '',
      handle: medusaProduct.collection.handle || '',
      created_at: medusaProduct.collection.created_at ? new Date(medusaProduct.collection.created_at) : new Date(),
      updated_at: medusaProduct.collection.updated_at ? new Date(medusaProduct.collection.updated_at) : new Date(),
    } : undefined,
    material: medusaProduct.material || undefined,
    origin_country: medusaProduct.origin_country || undefined,
    weight: medusaProduct.weight || undefined,
    created_at: medusaProduct.created_at ? new Date(medusaProduct.created_at) : new Date(),
    updated_at: medusaProduct.updated_at ? new Date(medusaProduct.updated_at) : new Date(),
  };
}

/**
 * Cache utility dla produktów
 * Next.js 15 ma built-in caching, ale ta funkcja pozwala na większą kontrolę
 */
export const revalidateProducts = () => {
  // W przyszłości można dodać revalidation logic
  // np. revalidateTag('products') jeśli używamy tagged cache
};
