import { sdk, TokenManager, handleApiError, withRetry } from '@/lib/medusa-client';
import { API_CONFIG } from '@/lib/api-config';
import { ApiResponse } from './products';
import type { HttpTypes } from "@medusajs/types";

/**
 * API functions dla zarządzania koszykiem w Medusa.js 2.0 JS SDK
 * Używamy typów z @medusajs/types dla kompatybilności
 */

// Podstawowe typy requesta
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
  metadata?: Record<string, any>;
}

/**
 * API functions dla zarządzania koszykiem w Medusa.js
 */

/**
 * Tworzy nowy koszyk
 */
export async function createCart(data: CreateCartRequest = {}): Promise<ApiResponse<any>> {
  try {
    console.log('🔄 Creating new cart...');
    
    const response = await withRetry(async () => {
      return await sdk.store.cart.create({
        region_id: data.region_id || 'reg_01K4S17EFPZ0BFQWAA6J44VJQ4' // ID regionu Polski (Poland)
      });
    });

    console.log('✅ Cart created successfully:', response.cart.id);
    return { data: response.cart };
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('❌ createCart error:', apiError);
    return { error: apiError };
  }
}

/**
 * Pobiera koszyk po ID
 */
export async function getCart(cartId: string): Promise<ApiResponse<any>> {
  try {
    console.log(`🔄 Fetching cart ${cartId}...`);
    
    const response = await withRetry(async () => {
      return await sdk.store.cart.retrieve(cartId, {
        fields: '*items,*items.variant,*items.variant.options,*items.variant.options.option,*items.product'
      });
    });

    console.log(`✅ Cart ${cartId} fetched successfully`);
    return { data: response.cart };
  } catch (error) {
    const apiError = handleApiError(error);
    console.error(`❌ getCart error for ${cartId}:`, apiError);
    return { error: apiError };
  }
}

/**
 * Dodaje produkt do koszyka
 */
export async function addToCart(
  cartId: string, 
  item: AddToCartRequest
): Promise<ApiResponse<any>> {
  try {
    console.log(`🔄 Adding item to cart ${cartId}:`, item);
    
    const response = await withRetry(async () => {
      const addResponse = await sdk.store.cart.createLineItem(cartId, {
        variant_id: item.variant_id,
        quantity: item.quantity,
      });
      
      // Po dodaniu, pobierz koszyk ponownie z rozszerzonymi polami
      return await sdk.store.cart.retrieve(cartId, {
        fields: '*items,*items.variant,*items.variant.options,*items.variant.options.option,*items.product'
      });
    });

    console.log(`✅ Item added to cart ${cartId}`, response);
    return { data: response.cart };
  } catch (error) {
    const apiError = handleApiError(error);
    console.error(`❌ addToCart error for ${cartId}:`, apiError);
    console.error('Full error object:', error);
    return { error: apiError };
  }
}

/**
 * Aktualizuje ilość produktu w koszyku
 */
export async function updateCartItem(
  cartId: string,
  lineItemId: string,
  data: UpdateCartItemRequest
): Promise<ApiResponse<any>> {
  try {
    console.log(`🔄 Updating cart item ${lineItemId} in cart ${cartId}:`, data);
    
    const response = await withRetry(async () => {
      await sdk.store.cart.updateLineItem(cartId, lineItemId, {
        quantity: data.quantity,
      });
      
      // Po aktualizacji, pobierz koszyk ponownie z rozszerzonymi polami
      return await sdk.store.cart.retrieve(cartId, {
        fields: '*items,*items.variant,*items.variant.options,*items.variant.options.option,*items.product'
      });
    });

    console.log(`✅ Cart item ${lineItemId} updated`);
    return { data: response.cart };
  } catch (error) {
    const apiError = handleApiError(error);
    console.error(`❌ updateCartItem error for ${lineItemId}:`, apiError);
    return { error: apiError };
  }
}

/**
 * Usuwa produkt z koszyka
 */
export async function removeFromCart(
  cartId: string,
  lineItemId: string
): Promise<ApiResponse<any>> {
  try {
    console.log(`🔄 Removing item ${lineItemId} from cart ${cartId}...`);
    
    const response = await withRetry(async () => {
      return await sdk.store.cart.deleteLineItem(cartId, lineItemId);
    });

    console.log(`✅ Item ${lineItemId} removed from cart`);
    console.log('Full response:', response);
    console.log('Response keys:', Object.keys(response));
    
    // DeleteLineItem zwraca pustą odpowiedź, pobierz koszyk ponownie
    console.log('🔄 Fetching cart after removal...');
    const cartResponse = await getCart(cartId);
    if (cartResponse.data) {
      return { data: cartResponse.data };
    } else {
      return { error: { message: 'Failed to fetch cart after removal' } };
    }
  } catch (error) {
    const apiError = handleApiError(error);
    console.error(`❌ removeFromCart error for ${lineItemId}:`, apiError);
    return { error: apiError };
  }
}

/**
 * Usuwa wszystkie produkty z koszyka
 */
export async function clearCart(cartId: string): Promise<ApiResponse<any>> {
  try {
    console.log(`🔄 Clearing cart ${cartId}...`);
    
    // Pobierz koszyk żeby zobaczyć wszystkie items
    const cartResponse = await getCart(cartId);
    if (!cartResponse.data) {
      return { error: { message: 'Cart not found' } };
    }

    // Usuń wszystkie items jeden po drugim
    let updatedCart = cartResponse.data;
    for (const item of updatedCart.items) {
      const removeResponse = await removeFromCart(cartId, item.id);
      if (removeResponse.data) {
        updatedCart = removeResponse.data;
      }
    }

    console.log(`✅ Cart ${cartId} cleared`);
    return { data: updatedCart };
  } catch (error) {
    const apiError = handleApiError(error);
    console.error(`❌ clearCart error for ${cartId}:`, apiError);
    return { error: apiError };
  }
}

/**
 * Dodaje email do koszyka (dla gości)
 */
export async function setCartEmail(
  cartId: string, 
  email: string
): Promise<ApiResponse<any>> {
  try {
    console.log(`🔄 Setting email for cart ${cartId}: ${email}`);
    
    const response = await withRetry(async () => {
      return await sdk.store.cart.update(cartId, {
        email,
      });
    });

    console.log(`✅ Email set for cart ${cartId}`);
    return { data: response.cart };
  } catch (error) {
    const apiError = handleApiError(error);
    console.error(`❌ setCartEmail error for ${cartId}:`, apiError);
    return { error: apiError };
  }
}

/**
 * Dodaje region do koszyka
 */
export async function setCartRegion(
  cartId: string, 
  regionId: string
): Promise<ApiResponse<any>> {
  try {
    console.log(`🔄 Setting region for cart ${cartId}: ${regionId}`);
    
    const response = await withRetry(async () => {
      return await sdk.store.cart.update(cartId, {
        region_id: regionId,
      });
    });

    console.log(`✅ Region set for cart ${cartId}`);
    return { data: response.cart };
  } catch (error) {
    const apiError = handleApiError(error);
    console.error(`❌ setCartRegion error for ${cartId}:`, apiError);
    return { error: apiError };
  }
}

/**
 * Pobiera dostępne regiony
 */
export async function getRegions(): Promise<ApiResponse<any[]>> {
  try {
    console.log('🔄 Fetching regions...');
    
    const response = await withRetry(async () => {
      return await sdk.store.region.list();
    });

    console.log(`✅ Fetched ${response.regions.length} regions`);
    return { data: response.regions };
  } catch (error) {
    const apiError = handleApiError(error);
    console.error('❌ getRegions error:', apiError);
    return { error: apiError };
  }
}

/**
 * Typy dla complete checkout
 */
export interface CheckoutCompleteRequest {
  email: string;
  shipping_address: {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    postal_code: string;
    country_code: string;
    phone?: string;
  };
  billing_address?: {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    postal_code: string;
    country_code: string;
    phone?: string;
  };
  payment_method?: string; // Dodane: 'cod', 'card', 'transfer'
  furgonetka_data?: {
    pickup_point?: {
      id: string;
      name: string;
      address: string;
      provider: string;
      distance?: string;
      hours?: string;
      coordinates?: [number, number];
    };
    delivery_option?: {
      id: string;
      provider: string;
      service: string;
      type: 'courier' | 'pickup_point';
      price?: number;
      delivery_time?: string;
    };
  };
}

/**
 * Dodaje shipping method do koszyka
 */
export async function addShippingMethodToCart(
  cartId: string,
  shippingOptionId: string
): Promise<ApiResponse<any>> {
  try {
    console.log(`🚚 Adding shipping method ${shippingOptionId} to cart ${cartId}`);
    
    const response = await withRetry(async () => {
      return await sdk.store.cart.addShippingMethod(cartId, {
        option_id: shippingOptionId,
        data: {
          // Można dodać dodatkowe dane dla fulfillment provider
        }
      });
    });

    console.log('✅ Shipping method added to cart');
    return { data: response.cart };
  } catch (error) {
    const apiError = handleApiError(error);
    console.error(`❌ addShippingMethodToCart error for ${cartId}:`, apiError);
    return { error: apiError };
  }
}

/**
 * Pobiera dostępne shipping options dla koszyka
 */
export async function getShippingOptions(cartId: string): Promise<ApiResponse<any>> {
  try {
    console.log(`🔍 Getting shipping options for cart ${cartId}`);
    
    const response = await withRetry(async () => {
      return await sdk.store.fulfillment.listCartOptions({
        cart_id: cartId,
      });
    });

    console.log('✅ Shipping options retrieved:', response.shipping_options.length);
    return { data: response.shipping_options };
  } catch (error) {
    const apiError = handleApiError(error);
    console.error(`❌ getShippingOptions error for ${cartId}:`, apiError);
    return { error: apiError };
  }
}

/**
 * Inicjalizuje payment session dla koszyka - tworzy payment collection i session
 */
export async function initiatePaymentSession(
  cartId: string,
  paymentProviderId: string = 'pp_system_default'
): Promise<ApiResponse<any>> {
  try {
    console.log(`💳 Creating payment collection for cart ${cartId} with provider ${paymentProviderId}`);
    
    // Krok 1: Utwórz payment collection
    console.log('📝 Step 1: Creating payment collection...');
    const collectionResponse = await withRetry(async () => {
      const response = await fetch(`${API_CONFIG.MEDUSA_BACKEND_URL}/store/payment-collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': API_CONFIG.MEDUSA_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          cart_id: cartId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to create payment collection: ${response.status} ${errorData}`);
      }
      
      return await response.json();
    });

    const paymentCollectionId = collectionResponse.payment_collection.id;
    console.log(`✅ Payment collection created: ${paymentCollectionId}`);

    // Krok 2: Utwórz payment session w collection
    console.log('📝 Step 2: Creating payment session...');
    const sessionResponse = await withRetry(async () => {
      const response = await fetch(`${API_CONFIG.MEDUSA_BACKEND_URL}/store/payment-collections/${paymentCollectionId}/payment-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': API_CONFIG.MEDUSA_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          provider_id: paymentProviderId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to create payment session: ${response.status} ${errorData}`);
      }
      
      return await response.json();
    });

    console.log('✅ Payment session created successfully');
    return { 
      data: {
        payment_collection: collectionResponse.payment_collection,
        payment_session: sessionResponse.payment_collection,
        success: true
      }
    };
  } catch (error) {
    const apiError = handleApiError(error);
    console.error(`❌ initiatePaymentSession error for ${cartId}:`, apiError);
    return { error: apiError };
  }
}

/**
 * Finalizuje zamówienie (complete checkout) - zgodnie z Medusa.js 2.0 workflow
 * Implementuje pełny 5-step checkout flow
 */
export async function completeCart(
  cartId: string, 
  data: CheckoutCompleteRequest
): Promise<ApiResponse<any>> {
  try {
    console.log('🔄 Starting Medusa checkout flow for cart:', cartId);
    console.log('📦 Checkout data:', data);
    
    // Krok 1: Ustaw email w koszyku
    console.log('📧 Step 1: Setting email...');
    await setCartEmail(cartId, data.email);
    
    // Krok 2: Ustaw adresy dostawy i rozliczeniowe
    console.log('📍 Step 2: Setting addresses...');
    
    // CRITICAL FIX: Use pickup point address for pickup deliveries
    let finalShippingAddress = data.shipping_address;
    
    if (data.furgonetka_data?.delivery_option?.type === 'pickup_point' && data.furgonetka_data?.pickup_point) {
      console.log('📦 Using pickup point address for shipping address');
      const pickupPoint = data.furgonetka_data.pickup_point;
      
      // FIXED: Clean address parsing to avoid duplication
      console.log('🔍 Original pickup point data:', pickupPoint);
      
      // Check if address already contains the pickup point name
      const addressContainsName = pickupPoint.address.includes(pickupPoint.name);
      
      let cleanAddress = pickupPoint.address;
      let cleanCity = data.shipping_address.city;
      let cleanPostalCode = data.shipping_address.postal_code;
      
      // Parse address if it contains commas (format: "Street, City, Postal Code")
      if (pickupPoint.address.includes(',')) {
        const addressParts = pickupPoint.address.split(',').map(part => part.trim());
        
        if (addressContainsName) {
          // Address already contains name, use as-is
          cleanAddress = addressParts[0] || pickupPoint.address;
        } else {
          // Address doesn't contain name, add it
          cleanAddress = `${pickupPoint.name} - ${addressParts[0]}`;
        }
        
        cleanCity = addressParts[1] || data.shipping_address.city;
        cleanPostalCode = addressParts[2] || data.shipping_address.postal_code;
      } else {
        // Simple address format
        if (addressContainsName) {
          cleanAddress = pickupPoint.address;
        } else {
          cleanAddress = `${pickupPoint.name} - ${pickupPoint.address}`;
        }
      }
      
      finalShippingAddress = {
        first_name: data.shipping_address.first_name,
        last_name: data.shipping_address.last_name,
        address_1: cleanAddress, // Clean address without duplication
        city: cleanCity,
        postal_code: cleanPostalCode,
        country_code: data.shipping_address.country_code,
        phone: data.shipping_address.phone,
        company: pickupPoint.provider.toUpperCase(), // e.g., "INPOST", "DHL"
      };
      
      console.log('✅ Pickup point shipping address:', finalShippingAddress);
    } else {
      console.log('🏠 Using customer home address for courier delivery');
    }
    
    const updateResponse = await withRetry(async () => {
      return await sdk.store.cart.update(cartId, {
        shipping_address: finalShippingAddress,
        billing_address: data.billing_address || data.shipping_address, // Billing always customer address
        metadata: {
          furgonetka_data: data.furgonetka_data || null,
          payment_method: data.payment_method || 'cod',
          checkout_started_at: new Date().toISOString(),
        }
      });
    });

    // Krok 3: Dodaj shipping method
    console.log('🚚 Step 3: Adding shipping method...');
    let shippingOptionId: string | undefined;
    
    // Pobierz dostępne shipping options dla koszyka
    const shippingOptionsResponse = await getShippingOptions(cartId);
    if (shippingOptionsResponse.error || !shippingOptionsResponse.data) {
      throw new Error('Failed to retrieve shipping options');
    }
    
    const availableOptions = shippingOptionsResponse.data;
    console.log('📦 Available shipping options:', availableOptions.map((opt: any) => ({ id: opt.id, name: opt.name })));
    
    // Inteligentne mapowanie shipping option na podstawie wybranego providera Furgonetki
    if (data.furgonetka_data?.delivery_option) {
      const deliveryOption = data.furgonetka_data.delivery_option;
      const pickupPoint = data.furgonetka_data.pickup_point;
      
      console.log('📦 Mapping Furgonetka option:', { 
        type: deliveryOption.type, 
        provider: deliveryOption.provider,
        pickup_provider: pickupPoint?.provider 
      });
      
      if (deliveryOption.type === 'pickup_point') {
        // Mapowanie punkt odbioru na podstawie providera
        const provider = pickupPoint?.provider?.toLowerCase() || deliveryOption.provider?.toLowerCase() || '';
        
        if (provider.includes('inpost') || provider.includes('paczkomat')) {
          // InPost Paczkomaty -> użyj "Paczkomat"
          shippingOptionId = availableOptions.find((opt: any) => 
            opt.name?.includes('Paczkomat') || opt.type?.code?.includes('paczkomat')
          )?.id;
        } else if (provider.includes('dhl') || provider.includes('ups') || provider.includes('gls')) {
          // DHL/UPS/GLS -> użyj "Punkt Odbioru"
          shippingOptionId = availableOptions.find((opt: any) => 
            opt.name?.includes('Punkt Odbioru') || opt.type?.code?.includes('pickup_point')
          )?.id;
        } else {
          // Fallback dla nieznanych providerów punktów odbioru
          shippingOptionId = availableOptions.find((opt: any) => 
            opt.name?.includes('Punkt Odbioru') || opt.name?.includes('Paczkomat')
          )?.id;
        }
        
        console.log(`📦 Mapped pickup point provider "${provider}" to shipping option: ${shippingOptionId}`);
        
      } else if (deliveryOption.type === 'courier') {
        // Kurier - użyj opcji kurierskiej
        shippingOptionId = availableOptions.find((opt: any) => 
          opt.name?.includes('Kurier') || opt.type?.code?.includes('courier')
        )?.id;
        
        console.log(`📦 Mapped courier delivery to shipping option: ${shippingOptionId}`);
      }
    }
    
    // Fallback jeśli brak danych Furgonetki - użyj odbioru osobistego
    if (!shippingOptionId) {
      shippingOptionId = availableOptions.find((opt: any) => 
        opt.name?.includes('Odbiór Osobisty') || opt.type?.code?.includes('pickup') || opt.amount === 0
      )?.id;
      
      console.log(`📦 Using fallback shipping option (personal pickup): ${shippingOptionId}`);
    }
    
    // Ostateczny fallback - pierwsza dostępna opcja
    if (!shippingOptionId && availableOptions.length > 0) {
      shippingOptionId = availableOptions[0].id;
      console.log('⚠️ Using first available shipping option as final fallback:', availableOptions[0].name);
    }
    
    if (!shippingOptionId) {
      throw new Error('No shipping options available for this cart');
    }
    
    const selectedOption = availableOptions.find((opt: any) => opt.id === shippingOptionId);
    console.log('✅ Selected shipping option:', {
      id: shippingOptionId,
      name: selectedOption?.name,
      amount: selectedOption?.amount,
      provider_mapped: data.furgonetka_data?.delivery_option?.provider || 'none',
      type_mapped: data.furgonetka_data?.delivery_option?.type || 'fallback'
    });
    
    await addShippingMethodToCart(cartId, shippingOptionId);

    // Krok 4: Inicjalizuj payment session (ZAWSZE - Medusa 2.0 wymaga tego nawet dla COD)
    console.log('💳 Step 4: Initiating payment session...');
    
    const paymentProviderId = data.payment_method === 'card' 
      ? 'pp_stripe_stripe' 
      : 'pp_system_default';
    
    const paymentResult = await initiatePaymentSession(cartId, paymentProviderId);
    if (paymentResult.error) {
      console.error('❌ Payment session error:', paymentResult.error);
      return { error: paymentResult.error };
    }
    console.log('✅ Payment session initialized');

    // Krok 5: Finalizuj koszyk (przekształć w zamówienie)
    console.log('🎯 Step 5: Completing cart...');
    const completionResponse = await withRetry(async () => {
      return await sdk.store.cart.complete(cartId);
    });

    // Sprawdź typ odpowiedzi - 'order' oznacza sukces
    if (completionResponse.type === 'order') {
      console.log('✅ Order created successfully! Order ID:', completionResponse.order.id);
      
      // Usuń cart_id z localStorage po sukcesie (zgodnie z dokumentacją)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cart_id');
        console.log('🗑️ Removed cart_id from localStorage');
      }

      return { 
        data: {
          order: completionResponse.order,
          type: 'order'
        }
      };
    } else {
      // Typ 'cart' oznacza błąd
      console.error('❌ Cart completion failed. Response type:', completionResponse.type);
      console.error('Cart response:', completionResponse.cart);
      
      return { 
        error: {
          message: 'Failed to complete checkout. Please check your cart and try again.',
          code: 'CHECKOUT_FAILED'
        }
      };
    }
  } catch (error) {
    const apiError = handleApiError(error);
    console.error(`❌ completeCart error for ${cartId}:`, apiError);
    return { error: apiError };
  }
}
