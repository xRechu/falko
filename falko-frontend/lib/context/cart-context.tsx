'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { createCart, getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '@/lib/api/cart';

/**
 * Context dla zarządzania stanem koszyka zakupowego
 */

// Typy dla stanu koszyka
export interface CartItem {
  id: string;
  variant_id: string;
  product_id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  unit_price: number;
  quantity: number;
  total?: number; // Opcjonalne w Medusa 2.0
  // Dodane pola z Medusa 2.0 API
  product_title?: string;
  variant_title?: string;
  variant_sku?: string;
  variant?: {
    id: string;
    title: string;
    options?: Array<{
      value: string;
      option: { title: string };
    }>;
  };
  product?: {
    title: string;
    handle: string;
    thumbnail?: string;
  };
}

export interface CartState {
  cart: {
    id: string;
    items: CartItem[];
    total: number;
    subtotal: number;
    tax_total: number;
    shipping_total: number;
    item_count: number;
    region?: {
      id: string;
      name: string;
      currency_code: string;
    };
  } | null;
  isLoading: boolean;
  error: string | null;
}

// Actions dla reducer
type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CART'; payload: any }
  | { type: 'CLEAR_CART' }
  | { type: 'UPDATE_ITEM_COUNT' };

// Reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_CART':
      const cart = action.payload;
      return {
        ...state,
        cart: cart ? {
          id: cart.id,
          items: cart.items || [],
          total: cart.total || 0,
          subtotal: cart.subtotal || 0,
          tax_total: cart.tax_total || 0,
          shipping_total: cart.shipping_total || 0,
          item_count: (cart.items || []).reduce((sum: number, item: any) => sum + item.quantity, 0),
          region: cart.region
        } : null,
        error: null,
        isLoading: false
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        cart: null,
        error: null,
        isLoading: false
      };
    
    case 'UPDATE_ITEM_COUNT':
      if (!state.cart) return state;
      return {
        ...state,
        cart: {
          ...state.cart,
          item_count: state.cart.items.reduce((sum, item) => sum + item.quantity, 0)
        }
      };
    
    default:
      return state;
  }
}

// Initial state
const initialState: CartState = {
  cart: null,
  isLoading: false,
  error: null,
};

// Context
interface CartContextType {
  state: CartState;
  createNewCart: () => Promise<void>;
  addItemToCart: (variantId: string, quantity: number) => Promise<void>;
  updateItemQuantity: (lineItemId: string, quantity: number) => Promise<void>;
  removeItemFromCart: (lineItemId: string) => Promise<void>;
  clearCartItems: () => Promise<void>;
  refreshCart: () => Promise<void>;
  // Snapshot/Restore helpers
  snapshotCart: () => boolean;
  hasCartSnapshot: () => boolean;
  clearCartSnapshot: () => void;
  restoreCartFromSnapshot: () => Promise<boolean>;
  resetCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider
interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const SNAPSHOT_KEY = 'cart_snapshot_v1';
  const SNAPSHOT_TTL_HOURS = Number(process.env.NEXT_PUBLIC_CART_SNAPSHOT_TTL_HOURS || 24);

  const isSnapshotExpired = (createdAtISO: string | undefined) => {
    if (!createdAtISO) return true;
    try {
      const created = new Date(createdAtISO).getTime();
      const now = Date.now();
      const ttlMs = SNAPSHOT_TTL_HOURS * 60 * 60 * 1000;
      return now - created > ttlMs;
    } catch {
      return true;
    }
  };

  // Załaduj koszyk z localStorage przy inicjalizacji
  useEffect(() => {
    const cartId = localStorage.getItem('cart_id');
    if (cartId) {
      loadCart(cartId);
    }
  }, []);

  // Funkcje pomocnicze
  const saveCartId = (cartId: string) => {
    localStorage.setItem('cart_id', cartId);
  };

  const loadCart = async (cartId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await getCart(cartId);
      if (response.data) {
        dispatch({ type: 'SET_CART', payload: response.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error?.message || 'Failed to load cart' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load cart' });
    }
  };

  // API functions
  const createNewCart = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await createCart();
      if (response.data) {
        saveCartId(response.data.id);
        dispatch({ type: 'SET_CART', payload: response.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error?.message || 'Failed to create cart' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create cart' });
    }
  };

  const addItemToCart = async (variantId: string, quantity: number) => {
    console.log('🔄 Adding item to cart:', variantId, quantity);
    
    // Jeśli nie ma koszyka, utwórz nowy
    let cartId = state.cart?.id;
    if (!cartId) {
      console.log('🔄 No cart found, creating new cart...');
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        const createResponse = await createCart();
        if (createResponse.data) {
          cartId = createResponse.data.id;
          if (cartId) {
            saveCartId(cartId);
            dispatch({ type: 'SET_CART', payload: createResponse.data });
            console.log('✅ New cart created:', cartId);
          } else {
            dispatch({ type: 'SET_ERROR', payload: 'Cart created but no ID returned' });
            return;
          }
        } else {
          dispatch({ type: 'SET_ERROR', payload: createResponse.error?.message || 'Failed to create cart' });
          return;
        }
      } catch (error) {
        console.error('❌ Error creating cart:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to create cart' });
        return;
      }
    }

    if (!cartId) {
      dispatch({ type: 'SET_ERROR', payload: 'No cart ID available' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      console.log('🔄 Adding item to existing cart:', cartId);
      const response = await addToCart(cartId, { variant_id: variantId, quantity });
      if (response.data) {
        dispatch({ type: 'SET_CART', payload: response.data });
        console.log('✅ Item added successfully to cart');
      } else {
        console.error('❌ Failed to add item:', response.error);
        dispatch({ type: 'SET_ERROR', payload: response.error?.message || 'Failed to add item to cart' });
      }
    } catch (error) {
      console.error('❌ Error adding item to cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add item to cart' });
    }
  };

  const updateItemQuantity = async (lineItemId: string, quantity: number) => {
    if (!state.cart?.id) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await updateCartItem(state.cart.id, lineItemId, { quantity });
      if (response.data) {
        dispatch({ type: 'SET_CART', payload: response.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error?.message || 'Failed to update item' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update item' });
    }
  };

  const removeItemFromCart = async (lineItemId: string) => {
    if (!state.cart?.id) return;
    
    console.log('🔄 Removing item from cart:', lineItemId);
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await removeFromCart(state.cart.id, lineItemId);
      console.log('🔄 Remove item response:', response);
      
      if (response.data) {
        console.log('✅ Item removed, updating cart state');
        dispatch({ type: 'SET_CART', payload: response.data });
      } else {
        console.error('❌ No data in remove response:', response.error);
        dispatch({ type: 'SET_ERROR', payload: response.error?.message || 'Failed to remove item' });
      }
    } catch (error) {
      console.error('❌ Exception while removing item:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove item' });
    }
  };

  const clearCartItems = async () => {
    if (!state.cart?.id) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await clearCart(state.cart.id);
      if (response.data) {
        dispatch({ type: 'SET_CART', payload: response.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error?.message || 'Failed to clear cart' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear cart' });
    }
  };

  const refreshCart = async () => {
    if (!state.cart?.id) return;
    await loadCart(state.cart.id);
  };

  // ===== Snapshot / Restore helpers =====
  const snapshotCart = (): boolean => {
    try {
      const cart = state.cart;
      if (!cart || !cart.items?.length) return false;
      const snapshot = {
        created_at: new Date().toISOString(),
        region_id: cart.region?.id || null,
        currency_code: cart.region?.currency_code || 'PLN',
        items: cart.items.map(it => ({ variant_id: it.variant_id, quantity: it.quantity })),
      };
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
      return true;
    } catch {
      return false;
    }
  };

  const hasCartSnapshot = (): boolean => {
    try {
      const raw = localStorage.getItem(SNAPSHOT_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as { created_at?: string };
      if (isSnapshotExpired(parsed.created_at)) {
        localStorage.removeItem(SNAPSHOT_KEY);
        return false;
      }
      return true;
    } catch { return false; }
  };

  const clearCartSnapshot = () => {
    try { localStorage.removeItem(SNAPSHOT_KEY); } catch {}
  };

  const restoreCartFromSnapshot = async (): Promise<boolean> => {
    try {
      const raw = localStorage.getItem(SNAPSHOT_KEY);
      if (!raw) return false;
      const snapshot = JSON.parse(raw) as { items: { variant_id: string; quantity: number }[]; region_id?: string | null; created_at?: string };
      if (isSnapshotExpired(snapshot.created_at)) {
        localStorage.removeItem(SNAPSHOT_KEY);
        return false;
      }
      if (!snapshot.items?.length) return false;

      // Użyj istniejącego koszyka lub utwórz nowy
      let cartId = state.cart?.id;
      if (!cartId) {
        const res = await createCart({ region_id: snapshot.region_id || undefined });
        if (!res.data) return false;
  cartId = res.data.id as string;
  if (cartId) saveCartId(cartId);
        dispatch({ type: 'SET_CART', payload: res.data });
      }

      // Dodaj pozycje sekwencyjnie
      for (const item of snapshot.items) {
        const res = await addToCart(cartId!, { variant_id: item.variant_id, quantity: item.quantity });
        if (res.data) {
          dispatch({ type: 'SET_CART', payload: res.data });
        }
      }

      clearCartSnapshot();
      return true;
    } catch (e) {
      return false;
    }
  };

  const resetCart = () => {
    try { localStorage.removeItem('cart_id'); } catch {}
    dispatch({ type: 'CLEAR_CART' });
  };

  const value: CartContextType = {
    state,
    createNewCart,
    addItemToCart,
    updateItemQuantity,
    removeItemFromCart,
    clearCartItems,
    refreshCart,
  snapshotCart,
  hasCartSnapshot,
  clearCartSnapshot,
  restoreCartFromSnapshot,
  resetCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// Hook
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
