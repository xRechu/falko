import { ProductPreview, ProductDetail } from "@/lib/types/product";
import { medusaClient, handleApiError, withRetry } from "@/lib/medusa-client";

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
 * Pobiera listę produktów z Medusa.js API
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
    const response = await withRetry(async () => {
      return await medusaClient.products.list({
        limit: options.limit || 20,
        offset: options.offset || 0,
        collection_id: options.collection_id ? [options.collection_id] : undefined,
        handle: options.handle,
      });
    });

    // Przekształć dane Medusa na nasze typy z bezpiecznym typowaniem
    const products: ProductPreview[] = response.products.map(product => ({
      id: product.id || '',
      title: product.title || 'Brak tytułu',
      subtitle: product.subtitle || undefined,
      handle: product.handle || '',
      thumbnail: product.thumbnail || undefined,
      created_at: product.created_at ? new Date(product.created_at) : new Date(),
      updated_at: product.updated_at ? new Date(product.updated_at) : new Date(),
    }));

    return { data: products };
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('fetchProductsFromAPI error:', apiError);
    return { error: apiError };
  }
}

/**
 * Pobiera szczegóły pojedynczego produktu po ID
 * @param productId - ID produktu
 * @returns Promise ze szczegółami produktu lub błędem
 */
export async function fetchProductByIdFromAPI(productId: string): Promise<ApiResponse<ProductDetail>> {
  try {
    const response = await withRetry(async () => {
      return await medusaClient.products.retrieve(productId, {
        expand: "variants,variants.prices,images,collection,variants.options"
      });
    });

    const product = response.product;
    
    // Przekształć dane na nasz typ ProductDetail
    const productDetail: ProductDetail = {
      id: product.id || '',
      title: product.title || 'Brak tytułu',
      subtitle: product.subtitle || undefined,
      description: product.description || undefined,
      handle: product.handle || '',
      thumbnail: product.thumbnail || undefined,
      images: product.images?.map(img => ({
        id: img.id || '',
        product_id: product.id || '',
        url: img.url || '',
        created_at: img.created_at ? new Date(img.created_at) : new Date(),
        updated_at: img.updated_at ? new Date(img.updated_at) : new Date(),
      })) || [],
      variants: product.variants?.map(variant => ({
        id: variant.id || '',
        title: variant.title || 'Brak tytułu',
        product_id: product.id || '',
        sku: variant.sku || undefined,
        inventory_quantity: variant.inventory_quantity || 0,
        allow_backorder: variant.allow_backorder || false,
        manage_inventory: variant.manage_inventory || true,
        prices: variant.prices?.map(price => ({
          id: price.id || '',
          currency_code: price.currency_code || 'pln',
          amount: price.amount || 0,
        })) || [],
        created_at: variant.created_at ? new Date(variant.created_at) : new Date(),
        updated_at: variant.updated_at ? new Date(variant.updated_at) : new Date(),
      })) || [],
      collection: product.collection ? {
        id: product.collection.id || '',
        title: product.collection.title || 'Brak tytułu',
        handle: product.collection.handle || '',
        created_at: product.collection.created_at ? new Date(product.collection.created_at) : new Date(),
        updated_at: product.collection.updated_at ? new Date(product.collection.updated_at) : new Date(),
      } : undefined,
      material: product.material || undefined,
      origin_country: product.origin_country || undefined,
      weight: product.weight || undefined,
      created_at: product.created_at ? new Date(product.created_at) : new Date(),
      updated_at: product.updated_at ? new Date(product.updated_at) : new Date(),
    };

    return { data: productDetail };
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('fetchProductByIdFromAPI error:', apiError);
    return { error: apiError };
  }
}

/**
 * Pobiera szczegóły produktu po handle (slug)
 * @param handle - handle produktu (slug)
 * @returns Promise ze szczegółami produktu lub błędem
 */
export async function fetchProductByHandleFromAPI(handle: string): Promise<ApiResponse<ProductDetail>> {
  try {
    // Medusa nie ma bezpośredniego endpointu dla handle, więc szukamy przez listę
    const response = await withRetry(async () => {
      return await medusaClient.products.list({
        handle: handle,
        expand: "variants,variants.prices,images,collection,variants.options"
      });
    });

    if (!response.products || response.products.length === 0) {
      return { error: { message: 'Produkt nie został znaleziony', status: 404 } };
    }

    const product = response.products[0];
    
    // Przekształć dane (identyczny kod jak w fetchProductByIdFromAPI)
    const productDetail: ProductDetail = {
      id: product.id || '',
      title: product.title || 'Brak tytułu',
      subtitle: product.subtitle || undefined,
      description: product.description || undefined,
      handle: product.handle || '',
      thumbnail: product.thumbnail || undefined,
      images: product.images?.map(img => ({
        id: img.id || '',
        product_id: product.id || '',
        url: img.url || '',
        created_at: img.created_at ? new Date(img.created_at) : new Date(),
        updated_at: img.updated_at ? new Date(img.updated_at) : new Date(),
      })) || [],
      variants: product.variants?.map(variant => ({
        id: variant.id || '',
        title: variant.title || 'Brak tytułu',
        product_id: product.id || '',
        sku: variant.sku || undefined,
        inventory_quantity: variant.inventory_quantity || 0,
        allow_backorder: variant.allow_backorder || false,
        manage_inventory: variant.manage_inventory || true,
        prices: variant.prices?.map(price => ({
          id: price.id || '',
          currency_code: price.currency_code || 'pln',
          amount: price.amount || 0,
        })) || [],
        created_at: variant.created_at ? new Date(variant.created_at) : new Date(),
        updated_at: variant.updated_at ? new Date(variant.updated_at) : new Date(),
      })) || [],
      collection: product.collection ? {
        id: product.collection.id || '',
        title: product.collection.title || 'Brak tytułu',
        handle: product.collection.handle || '',
        created_at: product.collection.created_at ? new Date(product.collection.created_at) : new Date(),
        updated_at: product.collection.updated_at ? new Date(product.collection.updated_at) : new Date(),
      } : undefined,
      material: product.material || undefined,
      origin_country: product.origin_country || undefined,
      weight: product.weight || undefined,
      created_at: product.created_at ? new Date(product.created_at) : new Date(),
      updated_at: product.updated_at ? new Date(product.updated_at) : new Date(),
    };

    return { data: productDetail };
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('fetchProductByHandleFromAPI error:', apiError);
    return { error: apiError };
  }
}

/**
 * Pobiera kolekcje produktów
 * @returns Promise z listą kolekcji lub błędem
 */
export async function fetchCollectionsFromAPI(): Promise<ApiResponse<any[]>> {
  try {
    const response = await withRetry(async () => {
      return await medusaClient.collections.list();
    });

    return { data: response.collections || [] };
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('fetchCollectionsFromAPI error:', apiError);
    return { error: apiError };
  }
}
