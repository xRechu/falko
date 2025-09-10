// Meta Pixel (Facebook Pixel) lightweight wrapper
// Safe no-op in SSR/without pixel id

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";

// Ensure fbq type on window
declare global {
  interface Window {
    fbq?: (
      command: string,
      eventNameOrPixelId?: string,
      paramsOrOptions?: Record<string, any>,
      eventId?: string
    ) => void;
  }
}

export function hasMarketingConsent(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const cookies = document.cookie.split(';').map(c => c.trim())
    const found = cookies.find(c => c.startsWith('consent_marketing='))
    if (!found) return false
    const value = found.split('=')[1]
    return value === '1' || value === 'true'
  } catch {
    return false
  }
}

export function isPixelEnabled() {
  return typeof window !== "undefined" && typeof window.fbq === "function" && !!META_PIXEL_ID && hasMarketingConsent();
}

export function trackPageView() {
  if (!isPixelEnabled()) return;
  try {
    window.fbq!("track", "PageView");
  } catch {}
}

export function trackViewContent(params: {
  content_ids?: (string | number)[];
  content_name?: string;
  value?: number; // in store currency units (e.g., PLN)
  currency?: string; // e.g., 'PLN'
  content_type?: string; // 'product'
}) {
  if (!isPixelEnabled()) return;
  try {
    window.fbq!("track", "ViewContent", {
      content_type: params.content_type || "product",
      currency: params.currency || "PLN",
      ...params,
    });
  } catch {}
}

export function trackAddToCart(params: {
  content_ids?: (string | number)[];
  content_name?: string;
  value?: number;
  currency?: string;
  contents?: Array<{ id: string | number; quantity?: number; item_price?: number }>;
}) {
  if (!isPixelEnabled()) return;
  try {
    window.fbq!("track", "AddToCart", {
      currency: params.currency || "PLN",
      ...params,
    });
  } catch {}
}

export function trackInitiateCheckout(params: {
  value?: number;
  currency?: string;
  num_items?: number;
  contents?: Array<{ id: string | number; quantity?: number; item_price?: number }>;
}) {
  if (!isPixelEnabled()) return;
  try {
    window.fbq!("track", "InitiateCheckout", {
      currency: params.currency || "PLN",
      ...params,
    });
  } catch {}
}

export function trackPurchase(params: {
  value: number; // required by Meta
  currency?: string;
  contents?: Array<{ id: string | number; quantity?: number; item_price?: number }>;
  order_id?: string | number;
}) {
  if (!isPixelEnabled()) return;
  try {
    window.fbq!("track", "Purchase", {
      currency: params.currency || "PLN",
      ...params,
    });
  } catch {}
}
