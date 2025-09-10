import { API_CONFIG } from '../api-config'

export interface PaymentRequest {
  order_id: string
  return_url?: string
  // White Label additions
  payment_method_id?: number
  authorization_code?: string
}

export interface PaymentResponse {
  redirectUrl: string
  transactionId: string
  status: 'pending' | 'success' | 'failed'
}

export interface PaymentStatus {
  order_id: string
  payment_status: string
  order_status: string
  transaction_id?: string
  total_amount: number
  currency: string
}

// Placeholder: docelowo tutaj pojawi się nowa bramka (endpoint i typy)
export async function createPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
  // Zbuduj body zgodne z naszym route initiate (Paynow)
  const body: any = {
    externalId: paymentData.order_id,
    amount: undefined as any,
    currency: 'PLN',
    description: `Zamówienie ${paymentData.order_id}`,
    buyer: { email: '' },
    continueUrl: paymentData.return_url,
  }
  // amount/buyer muszą być podane wyżej przez wywołującego – tutaj zostawiamy elastyczność
  // Ale jeśli trafi amount_email w paymentData jako metadata, przenieś:
  const anyData = paymentData as any
  if (anyData.amount) body.amount = anyData.amount
  if (anyData.email) body.buyer.email = anyData.email
  if (paymentData.payment_method_id) body.paymentMethodId = paymentData.payment_method_id
  if (paymentData.authorization_code) body.authorizationCode = paymentData.authorization_code

  // Wywołujemy nasz route do Paynow initiate
  const res = await fetch('/api/payments/paynow/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Błąd inicjalizacji płatności: ${text}`)
  }
  const data = await res.json()
  return {
    redirectUrl: data.redirectUrl,
    transactionId: data.paymentId,
    status: data.status || 'pending'
  }
}

/**
 * Check payment status for order
 */
export async function checkPaymentStatus(orderId: string): Promise<PaymentStatus> {
  // To narzędzie zwraca stub; w UI używaj /api/payments/paynow/status po paymentId
  throw new Error('Użyj /api/payments/paynow/status?paymentId=... aby sprawdzić status w Paynow')
}

export async function getPaynowMethods() {
  const res = await fetch('/api/payments/paynow/methods', { cache: 'no-store' })
  if (!res.ok) throw new Error('Nie udało się pobrać metod płatności')
  return res.json()
}

export async function getPaynowGdpr() {
  const res = await fetch('/api/payments/paynow/gdpr', { cache: 'no-store' })
  if (!res.ok) throw new Error('Nie udało się pobrać klauzul RODO')
  return res.json()
}

/**
 * Get supported payment methods
 */
export function getSupportedPaymentMethods() {
  return [
    {
  id: 'online',
  name: 'Płatność online',
  description: 'Bezpieczne płatności online (wkrótce nowa bramka)',
  logo: '/logos/payment-gateway.svg',
      methods: [
        'Karta płatnicza',
        'BLIK',
        'Przelew bankowy',
        'PayPal',
        'Apple Pay',
        'Google Pay'
      ]
    }
  ]
}

/**
 * Redirect to payment gateway
 */
export function redirectToPayment(paymentUrl: string): void {
  // Store current URL for potential return
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('checkout_return_url', window.location.href)
    window.location.href = paymentUrl
  }
}

/**
 * Handle payment return from gateway
 */
export function handlePaymentReturn(): { orderId?: string; status?: string } {
  if (typeof window === 'undefined') return {}

  const urlParams = new URLSearchParams(window.location.search)
  const orderId = urlParams.get('order_id')
  const status = urlParams.get('status')

  return { orderId: orderId || undefined, status: status || undefined }
}

/**
 * Format payment amount for display
 */
export function formatPaymentAmount(amount: number, currency: string = 'PLN'): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount / 100) // Convert from cents
}

/**
 * Get payment method icon
 */
export function getPaymentMethodIcon(method: string): string {
  const icons: Record<string, string> = {
  'online': '💳',
    'card': '💳',
    'blik': '📱',
    'bank_transfer': '🏦',
    'paypal': '🅿️',
    'apple_pay': '🍎',
    'google_pay': '🔍'
  }
  
  return icons[method] || '💳'
}

/**
 * Validate payment data
 */
export function validatePaymentData(data: PaymentRequest): string[] {
  const errors: string[] = []

  if (!data.order_id) {
    errors.push('Order ID is required')
  }

  if (data.return_url && !isValidUrl(data.return_url)) {
    errors.push('Invalid return URL')
  }

  return errors
}

/**
 * Check if URL is valid
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}