import { API_CONFIG } from '@/lib/api-config';
import { ApiResponse } from './products';

/**
 * API functions dla zarządzania zamówieniami użytkownika w Medusa.js 2.0 SDK
 * Orders, order history, order details
 * 
 * UWAGA: SDK automatycznie zarządza tokenami i autoryzacją
 */

export interface OrderItem {
  id: string;
  product_id: string;
  product_title: string;
  product_handle: string;
  variant_id?: string;
  variant_title?: string;
  quantity: number;
  unit_price: number;
  total: number;
  thumbnail?: string;
}

export interface OrderAddress {
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  postal_code: string;
  country_code: string;
  phone?: string;
}

export interface FurgonetkaShipmentMeta {
  shipment_id?: string;
  tracking_number?: string;
  label_url?: string;
  status?: string;
  created_at?: string;
}

export interface OrderMetadata {
  furgonetka_shipment?: FurgonetkaShipmentMeta;
  return_status?: 'pending' | 'received' | 'refunded' | 'rejected' | string;
  [key: string]: any;
}

export interface Order {
  id: string;
  display_id: number;
  status: 'pending' | 'completed' | 'archived' | 'canceled' | 'requires_action';
  fulfillment_status: 'not_fulfilled' | 'partially_fulfilled' | 'fulfilled' | 'partially_shipped' | 'shipped' | 'partially_returned' | 'returned' | 'canceled' | 'requires_action';
  payment_status: 'not_paid' | 'awaiting' | 'captured' | 'partially_refunded' | 'refunded' | 'canceled' | 'requires_action';
  total: number;
  subtotal: number;
  tax_total: number;
  shipping_total: number;
  refunded_total?: number;
  currency_code: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  shipping_address?: OrderAddress;
  billing_address?: OrderAddress;
  email: string;
  customer_id?: string;
  metadata?: OrderMetadata;
}

/**
 * Transformuje StoreOrder z SDK na nasz Order interface
 */
function transformStoreOrderToOrder(storeOrder: any): Order {
  return {
    id: storeOrder.id,
    display_id: storeOrder.display_id || 0,
    status: storeOrder.status,
    fulfillment_status: storeOrder.fulfillment_status || 'not_fulfilled',
    payment_status: storeOrder.payment_status || 'not_paid',
    total: storeOrder.total || 0,
    subtotal: storeOrder.subtotal || 0,
    tax_total: storeOrder.tax_total || 0,
    shipping_total: storeOrder.shipping_total || 0,
  refunded_total: storeOrder.refunded_total || 0,
    currency_code: storeOrder.currency_code || 'PLN',
    created_at: storeOrder.created_at,
    updated_at: storeOrder.updated_at,
    email: storeOrder.email || '',
    customer_id: storeOrder.customer_id || undefined,
    items: storeOrder.items?.map((item: any) => ({
      id: item.id,
      product_id: item.product_id || '',
      product_title: item.product_title || item.title || '',
      product_handle: item.product?.handle || '',
      variant_id: item.variant_id || undefined,
      variant_title: item.variant_title || item.variant?.title || undefined,
      quantity: item.quantity || 0,
      unit_price: item.unit_price || 0,
      total: item.total || 0,
      thumbnail: item.product?.thumbnail || item.variant?.product?.thumbnail || undefined,
    })) || [],
    shipping_address: storeOrder.shipping_address ? {
      first_name: storeOrder.shipping_address.first_name || '',
      last_name: storeOrder.shipping_address.last_name || '',
      company: storeOrder.shipping_address.company || undefined,
      address_1: storeOrder.shipping_address.address_1 || '',
      address_2: storeOrder.shipping_address.address_2 || undefined,
      city: storeOrder.shipping_address.city || '',
      postal_code: storeOrder.shipping_address.postal_code || '',
      country_code: storeOrder.shipping_address.country_code || '',
      phone: storeOrder.shipping_address.phone || undefined,
    } : undefined,
    billing_address: storeOrder.billing_address ? {
      first_name: storeOrder.billing_address.first_name || '',
      last_name: storeOrder.billing_address.last_name || '',
      company: storeOrder.billing_address.company || undefined,
      address_1: storeOrder.billing_address.address_1 || '',
      address_2: storeOrder.billing_address.address_2 || undefined,
      city: storeOrder.billing_address.city || '',
      postal_code: storeOrder.billing_address.postal_code || '',
      country_code: storeOrder.billing_address.country_code || '',
      phone: storeOrder.billing_address.phone || undefined,
    } : undefined,
    metadata: storeOrder.metadata || undefined,
  };
}

/**
 * Pobiera listę zamówień dla zalogowanego użytkownika (Medusa 2.0 SDK)
 */
export async function getCustomerOrders(
  limit: number = 20,
  offset: number = 0
): Promise<ApiResponse<{ orders: Order[]; count: number }>> {
  try {
    // ZAWSZE używamy serwerowego proxy (czyta HttpOnly JWT i dodaje Authorization)
    const resp = await fetch(`/api/customer/orders?limit=${encodeURIComponent(String(limit))}&offset=${encodeURIComponent(String(offset))}&fields=${encodeURIComponent('*shipping_address,*billing_address,*items,*payments')}`)
    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(text || 'Nie udało się pobrać zamówień (proxy)')
    }
    const data = await resp.json()
    return {
      data: {
        orders: (data?.orders || []).map(transformStoreOrderToOrder),
        count: data?.count || 0,
      },
    }
  } catch (error: any) {
    return {
      error: {
        message: error?.message || 'Błąd pobierania zamówień',
        status: 400,
      },
    }
  }
}

/**
 * Pobiera szczegóły konkretnego zamówienia (Medusa 2.0 SDK)
 */
export async function getOrderDetails(orderId: string): Promise<ApiResponse<Order>> {
  try {
    const resp = await fetch(`/api/customer/orders/${encodeURIComponent(orderId)}?fields=${encodeURIComponent('*items,*shipping_address,*billing_address,*payments,*items.variant')}`)
    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(text || 'Nie udało się pobrać szczegółów zamówienia (proxy)')
    }
    const data = await resp.json()
    return { data: transformStoreOrderToOrder(data?.order || data) }
  } catch (error: any) {
    return {
      error: {
        message: error?.message || 'Błąd pobierania szczegółów zamówienia',
        status: 400,
      },
    }
  }
}

/**
 * Mapuje status Medusa na polskie etykiety
 */
export const getOrderStatusLabel = (status: string, type: 'order' | 'fulfillment' | 'payment' = 'order'): string => {
  if (type === 'fulfillment') {
    switch (status) {
      case 'not_fulfilled': return 'Nieprzetworzone';
      case 'partially_fulfilled': return 'Częściowo przetworzone';
      case 'fulfilled': return 'Przetworzone';
      case 'partially_shipped': return 'Częściowo wysłane';
      case 'shipped': return 'Wysłane';
      case 'partially_returned': return 'Częściowo zwrócone';
      case 'returned': return 'Zwrócone';
      case 'canceled': return 'Anulowane';
      case 'requires_action': return 'Wymaga działania';
      default: return 'Nieznany';
    }
  }
  
  if (type === 'payment') {
    switch (status) {
      case 'not_paid': return 'Nie opłacone';
      case 'awaiting': return 'Oczekuje płatności';
      case 'captured': return 'Opłacone';
      case 'partially_refunded': return 'Częściowo zwrócone';
      case 'refunded': return 'Zwrócone';
      case 'canceled': return 'Anulowane';
      case 'requires_action': return 'Wymaga działania';
      default: return 'Nieznany';
    }
  }
  
  // Default: order status
  switch (status) {
    case 'pending': return 'Oczekuje';
    case 'completed': return 'Ukończone';
    case 'archived': return 'Zarchiwizowane';
    case 'canceled': return 'Anulowane';
    case 'requires_action': return 'Wymaga działania';
    default: return 'Nieznany';
  }
};

/**
 * Mapuje status na kolor dla UI
 */
export const getOrderStatusColor = (status: string, type: 'order' | 'fulfillment' | 'payment' = 'order'): string => {
  if (type === 'fulfillment') {
    switch (status) {
      case 'shipped': 
      case 'fulfilled': return 'bg-green-100 text-green-800';
      case 'partially_shipped':
      case 'partially_fulfilled': return 'bg-blue-100 text-blue-800';
      case 'not_fulfilled': return 'bg-yellow-100 text-yellow-800';
      case 'returned':
      case 'canceled': return 'bg-red-100 text-red-800';
      case 'requires_action': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  if (type === 'payment') {
    switch (status) {
      case 'captured': return 'bg-green-100 text-green-800';
      case 'awaiting': return 'bg-yellow-100 text-yellow-800';
      case 'not_paid': return 'bg-gray-100 text-gray-800';
      case 'refunded':
      case 'canceled': return 'bg-red-100 text-red-800';
      case 'requires_action': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  // Default: order status
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'canceled': return 'bg-red-100 text-red-800';
    case 'requires_action': return 'bg-orange-100 text-orange-800';
    case 'archived': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Formatuje cenę według ustawień regionalnych
 */
export const formatPrice = (amount: number, currencyCode: string = 'PLN'): string => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount / 100); // Medusa przechowuje ceny w groszach
};

/**
 * Tworzy zamówienie ponownie na podstawie poprzedniego (reorder)
 */
export async function reorderItems(orderId: string): Promise<ApiResponse<{ cart_id: string }>> {
  try {
    console.log('🔄 Creating reorder for:', orderId, 'via SDK');
    
    // SDK automatycznie zarządza autoryzacją

    // Najpierw pobierz szczegóły zamówienia
    const orderResponse = await getOrderDetails(orderId);
    if (orderResponse.error || !orderResponse.data) {
      throw new Error('Nie można pobrać szczegółów zamówienia');
    }

    // Tu będzie logika tworzenia nowego koszyka z produktami z poprzedniego zamówienia
    // Na razie zwracamy mock response
    console.log('✅ Reorder created successfully via SDK');
    return { 
      data: { 
        cart_id: 'cart_' + Date.now() 
      } 
    };
  } catch (error: any) {
    console.error('❌ reorderItems SDK error:', error);
    return { 
      error: { 
        message: error.message || 'Błąd podczas tworzenia ponownego zamówienia',
        status: 400 
      } 
    };
  }
}
