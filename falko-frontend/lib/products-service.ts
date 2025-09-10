import { ProductPreview, ProductDetail } from "@/lib/types/product";
import { fetchProductsFromAPI, fetchProductByHandleFromAPI, ApiResponse } from "./api/products";
import { mockProducts } from "./mock-data";

/**
 * Smart wrapper functions które próbują pobrać dane z API,
 * a w przypadku błędu wracają do mock data
 */

/**
 * Pobiera produkty - najpierw próbuje API, potem mock data
 */
export async function fetchProducts(): Promise<ProductPreview[]> {
  console.log('🔄 Attempting to fetch products...');
  
  try {
    const result = await fetchProductsFromAPI();
    
    if (result.data && result.data.length > 0) {
      console.log(`✅ Successfully fetched ${result.data.length} products from API:`, result.data);
      return result.data;
    } else if (result.error) {
      console.warn('⚠️  API error, falling back to mock data:', result.error.message);
      return mockProducts;
    } else {
      console.warn('⚠️  API returned empty data, falling back to mock data');
      return mockProducts;
    }
  } catch (error) {
    console.warn('⚠️  API connection failed, falling back to mock data:', error);
  }
  
  return mockProducts;
}

/**
 * Pobiera produkt po handle - najpierw próbuje API, potem mock data
 */
export async function fetchProductByHandle(handle: string): Promise<ProductDetail | null> {
  console.log(`🔄 Attempting to fetch product by handle: ${handle}`);
  
  try {
    const result = await fetchProductByHandleFromAPI(handle);
    
    if (result.data) {
      console.log('✅ Successfully fetched product from API');
      return result.data;
    } else if (result.error) {
      console.warn('⚠️  API error, falling back to mock data:', result.error.message);
      return getMockProductByHandle(handle);
    }
  } catch (error) {
    console.warn('⚠️  API connection failed, falling back to mock data:', error);
  }
  
  return getMockProductByHandle(handle);
}

/**
 * Helper function do pobrania mock produktu po handle
 */
function getMockProductByHandle(handle: string): ProductDetail | null {
  // Mock data produktu - ten sam co w stronie produktu
  const mockProductsDetail: Record<string, ProductDetail> = {
    "falko-hoodie-premium-black": {
      id: "prod_01HQZX5T2J9K8P3R4S6V7W8X9Y",
      title: "Falko Hoodie Premium Black",
      subtitle: "Limitowana edycja premium",
      description: `Odkryj nową jakość komfortu z naszą premium bluzą z kapturem. 

Wykonana z najwyższej jakości bawełny organicznej (350gsm), ta bluza łączy w sobie nowoczesny design z niezrównanym komfortem noszenia. Minimalistyczny krój podkreśla sylwetkę, a precyzyjne wykończenia świadczą o dbałości o każdy detal.

**Cechy produktu:**
• 100% bawełna organiczna, 350gsm
• Unisex krój – idealny dla każdego
• Wysoka gramatura zapewniająca trwałość i ciepło
• Miękkie, nie drażniące wnętrze
• Strengthened stitching w kluczowych miejscach
• Stonowane logo Falko Project

**Pielęgnacja:**
Pranie w 30°C, nie używać wybielacza, suszyć w pozycji leżącej.`,
      handle: "falko-hoodie-premium-black",
      thumbnail: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=600&fit=crop&crop=center",
      images: [
        {
          id: "img_01",
          product_id: "prod_01HQZX5T2J9K8P3R4S6V7W8X9Y",
          url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=600&fit=crop&crop=center",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: "img_02",
          product_id: "prod_01HQZX5T2J9K8P3R4S6V7W8X9Y",
          url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=600&fit=crop&crop=center",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: "img_03",
          product_id: "prod_01HQZX5T2J9K8P3R4S6V7W8X9Y",
          url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=600&fit=crop&crop=center",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      variants: [
        {
          id: "variant_01",
          title: "S / Black",
          product_id: "prod_01HQZX5T2J9K8P3R4S6V7W8X9Y",
          sku: "FLK-HOOD-BLK-S",
          inventory_quantity: 10,
          allow_backorder: false,
          manage_inventory: true,
          prices: [
            {
              id: "price_01",
              currency_code: "pln",
              amount: 25000,
            },
          ],
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: "variant_02",
          title: "M / Black",
          product_id: "prod_01HQZX5T2J9K8P3R4S6V7W8X9Y",
          sku: "FLK-HOOD-BLK-M",
          inventory_quantity: 15,
          allow_backorder: false,
          manage_inventory: true,
          prices: [
            {
              id: "price_02",
              currency_code: "pln",
              amount: 25000,
            },
          ],
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      collection: {
        id: "pcol_01HQZX5T2J9K8P3R4S6V7W8X9Y",
        title: "Hoodies",
        handle: "hoodies",
        created_at: new Date(),
        updated_at: new Date(),
      },
      material: "100% Bawełna organiczna",
      origin_country: "PL",
      weight: 600,
      created_at: new Date(),
      updated_at: new Date(),
    },
  };
  
  return mockProductsDetail[handle] || null;
}
