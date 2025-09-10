/**
 * Debug funkcje dla koszyka - sprawdzenie struktury danych
 */

import { sdk } from '@/lib/medusa-client';

export async function debugCart(cartId?: string) {
  try {
    console.log('🔍 DEBUG: Sprawdzanie struktury koszyka...');
    
    if (!cartId) {
      // Stwórz testowy koszyk
      console.log('🔄 Tworzenie testowego koszyka...');
      const createResponse = await sdk.store.cart.create({
        region_id: 'reg_01JZ0ACKJ42QHCZB0XFKBKNG8N'
      });
      console.log('📋 Struktura create response:', JSON.stringify(createResponse, null, 2));
      cartId = createResponse.cart.id;
    }
    
    // Pobierz koszyk
    console.log(`🔄 Pobieranie koszyka ${cartId}...`);
    const cartResponse = await sdk.store.cart.retrieve(cartId, {
      fields: '*items,*items.variant,*items.variant.options,*items.variant.options.option,*items.product'
    });
    console.log('📋 Struktura cart response:', JSON.stringify(cartResponse, null, 2));
    
    // Jeśli są items, sprawdź ich strukturę
    if (cartResponse.cart?.items && cartResponse.cart.items.length > 0) {
      console.log('📋 Struktura pierwszego item:', JSON.stringify(cartResponse.cart.items[0], null, 2));
    }
    
    return cartResponse.cart;
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    return null;
  }
}

export async function debugProduct() {
  try {
    console.log('🔍 DEBUG: Sprawdzanie struktury produktu...');
    
    const productsResponse = await sdk.store.product.list({ 
      limit: 1,
      fields: '*variants,*variants.options'
    });
    
    console.log('📋 Struktura products response:', JSON.stringify(productsResponse, null, 2));
    
    if (productsResponse.products?.[0]) {
      const product = productsResponse.products[0];
      console.log('📋 Struktura produktu:', JSON.stringify(product, null, 2));
      
      if (product.variants?.[0]) {
        console.log('📋 Struktura variant:', JSON.stringify(product.variants[0], null, 2));
      }
    }
    
    return productsResponse.products?.[0];
    
  } catch (error) {
    console.error('❌ Debug product error:', error);
    return null;
  }
}
