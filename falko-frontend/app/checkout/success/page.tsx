'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  Package, 
  Mail, 
  ArrowRight, 
  Home,
  ShoppingBag,
  Clock,
  Loader2
} from 'lucide-react'
import { formatPaymentAmount, type PaymentStatus } from '@/lib/api/payments'
import { toast } from 'sonner'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id') || searchParams.get('cart_id') || (typeof window !== 'undefined' ? sessionStorage.getItem('cart_id') : null)
  const paymentIdFromQuery = searchParams.get('payment_id') || (typeof window !== 'undefined' ? (sessionStorage.getItem('paynow_payment_id') || getPaymentIdFromCookie(orderId)) : null)
  
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) {
      setError('Brak numeru zamówienia')
      setLoading(false)
      return
    }
    // Spróbuj dograć paymentId z HttpOnly cookie przez endpoint serwerowy
    const hydrate = async () => {
      try {
        if (!paymentIdFromQuery) {
          const r = await fetch(`/api/payments/paynow/payment-id?cart_id=${encodeURIComponent(orderId)}`, { cache: 'no-store' })
          if (r.ok) {
            const j = await r.json()
            if (j?.paymentId && typeof window !== 'undefined') {
              try { sessionStorage.setItem('paynow_payment_id', j.paymentId) } catch {}
            }
          }
        }
      } catch {}
      await checkOrderStatus()
    }
    hydrate()
  }, [orderId])

  // auto-poll co 5s, jeśli pending i mamy paymentId
  useEffect(() => {
    if (!orderId) return
    if (paymentStatus?.payment_status === 'captured') return
    const t = setInterval(() => {
      checkOrderStatus()
    }, 5000)
    return () => clearInterval(t)
  }, [orderId, paymentStatus?.payment_status])

  const isCheckingRef = useRef(false)
  const notifiedRef = useRef({ pending: false, success: false, error: false })

  const checkOrderStatus = async () => {
    if (!orderId) return
    if (isCheckingRef.current) return

    try {
      isCheckingRef.current = true
      setLoading(true)
      // Poll statusu Paynow jeśli mamy paymentId; w przeciwnym razie pokaż pending
      let confirmed = false
      // Pobierz bieżące paymentId z sessionStorage (po ew. hydracji)
      let pid = paymentIdFromQuery || (typeof window !== 'undefined' ? sessionStorage.getItem('paynow_payment_id') : null)
      if (!pid) {
        try {
          const r = await fetch(`/api/payments/paynow/payment-id?cart_id=${encodeURIComponent(orderId)}`, { cache: 'no-store' })
          if (r.ok) {
            const j = await r.json()
            pid = j?.paymentId || null
            if (pid && typeof window !== 'undefined') sessionStorage.setItem('paynow_payment_id', pid)
          }
        } catch {}
      }
      if (pid) {
        confirmed = await pollPaymentUntilConfirmed(pid, 30_000, 2_000)
      }
      if (confirmed) {
        // Finalizuj zamówienie w Medusie
        let r = await fetch('/api/checkout/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartId: orderId })
        })
        if (!r.ok) {
          // Fallback: przygotuj koszyk i spróbuj ponownie
          await fetch('/api/checkout/prepare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartId: orderId })
          })
          r = await fetch('/api/checkout/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartId: orderId })
          })
        }
        if (r.ok) {
          const data = await r.json()
          setPaymentStatus({
            order_id: data?.order?.id || orderId,
            payment_status: 'captured',
            order_status: 'created',
            total_amount: data?.order?.total ?? 0,
            currency: data?.order?.currency_code || 'PLN',
            transaction_id: pid || undefined,
          } as PaymentStatus)
              if (!notifiedRef.current.success) {
            toast.success('Płatność potwierdzona!')
            notifiedRef.current.success = true
          }
          // wyczyść sesję
          try { sessionStorage.removeItem('paynow_payment_id'); sessionStorage.removeItem('cart_id') } catch {}
          setLoading(false)
          return
        }
      }
      // fallback: pending
      setPaymentStatus({
        order_id: orderId,
        payment_status: 'pending',
        order_status: 'pending',
        total_amount: 0,
        currency: 'PLN',
        transaction_id: pid || undefined,
      } as PaymentStatus)
      if (!notifiedRef.current.pending) {
        toast.info('Płatność w trakcie przetwarzania')
        notifiedRef.current.pending = true
      }
    } catch (err: any) {
      setError(err.message)
      if (!notifiedRef.current.error) {
        toast.error('Błąd sprawdzania statusu zamówienia')
        notifiedRef.current.error = true
      }
    } finally {
      setLoading(false)
  isCheckingRef.current = false
    }
  }

function getPaymentIdFromCookie(orderId: string | null): string | null {
  if (!orderId || typeof document === 'undefined') return null
  const cname = `paynow_pid_${orderId}`
  const cookies = document.cookie.split(';').map(s => s.trim())
  for (const c of cookies) {
    if (c.startsWith(`${encodeURIComponent(cname)}=`)) {
      try { return decodeURIComponent(c.split('=').slice(1).join('=')) } catch { return null }
    }
  }
  return null
}

function getPaymentIdFromServerCookie(orderId: string | null): string | null {
  if (!orderId || typeof document === 'undefined') return null
  const cname = `paynow_map_${encodeURIComponent(orderId)}`
  const cookies = document.cookie.split(';').map(s => s.trim())
  for (const c of cookies) {
    if (c.startsWith(`${cname}=`)) {
      try { return decodeURIComponent(c.split('=').slice(1).join('=')) } catch { return null }
    }
  }
  return null
}

async function pollPaymentUntilConfirmed(paymentId: string, timeoutMs = 30_000, intervalMs = 2_000) {
  const start = Date.now()
  let nullCount = 0
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`/api/payments/paynow/status?paymentId=${encodeURIComponent(paymentId)}`, { cache: 'no-store' })
      if (r.ok) {
        const data = await r.json()
        const raw = (data?.status || '').toString().toUpperCase()
        const status = raw || null
        if (status === 'CONFIRMED' || status === 'COMPLETED' || status === 'PAID' || status === 'SUCCESS') return true
        if ([ 'REJECTED','CANCELLED','ERROR','EXPIRED','FAILED' ].includes(status || '')) return false
        if (!status) {
          nullCount++
          if (nullCount >= 3) return false // brak wiedzy od Paynow – nie blokuj UX
        }
      }
    } catch {}
    await new Promise(res => setTimeout(res, intervalMs))
  }
  return false
}

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-lg font-semibold mb-2">Sprawdzanie zamówienia...</h2>
          <p className="text-gray-600">Proszę czekać, weryfikujemy status Twojej płatności.</p>
        </Card>
      </div>
    )
  }

  if (error || !paymentStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold mb-2 text-red-600">Błąd</h2>
          <p className="text-gray-600 mb-4">{error || 'Nie można znaleźć zamówienia'}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.href = '/sklep'}>
              Powrót do sklepu
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/konto'}>
              Moje konto
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const isPaymentSuccessful = paymentStatus.payment_status === 'captured'
  const isPaymentPending = paymentStatus.payment_status === 'pending'

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        
        {/* Success Header */}
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
              isPaymentSuccessful ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              {isPaymentSuccessful ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <Clock className="h-8 w-8 text-blue-600" />
              )}
            </div>
            
            <div>
              <h1 className={`text-2xl font-bold mb-2 ${
                isPaymentSuccessful ? 'text-green-600' : 'text-blue-600'
              }`}>
                {isPaymentSuccessful ? 'Zamówienie opłacone!' : 'Zamówienie w trakcie przetwarzania'}
              </h1>
              <p className="text-gray-600">
                {isPaymentSuccessful 
                  ? 'Dziękujemy za zakup w Falko Project. Twoje zamówienie zostało pomyślnie opłacone.'
                  : 'Twoje zamówienie zostało złożone i oczekuje na potwierdzenie płatności.'
                }
              </p>
            </div>

            <Badge className={
              isPaymentSuccessful 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }>
              {isPaymentSuccessful ? 'Płatność potwierdzona' : 'Płatność w trakcie'}
            </Badge>
          </div>
        </Card>

        {/* Order Details */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Szczegóły zamówienia</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Numer zamówienia:</span>
              <span className="font-medium">#{paymentStatus.order_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Kwota:</span>
              <span className="font-medium">
                {formatPaymentAmount(paymentStatus.total_amount, paymentStatus.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status płatności:</span>
              <Badge className={
                isPaymentSuccessful 
                  ? 'bg-green-100 text-green-800'
                  : isPaymentPending
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-red-100 text-red-800'
              }>
                {isPaymentSuccessful && 'Opłacone'}
                {isPaymentPending && 'Oczekuje'}
                {paymentStatus.payment_status === 'failed' && 'Nieudane'}
              </Badge>
            </div>
      {paymentStatus.transaction_id && (
              <div className="flex justify-between">
                <span className="text-gray-600">ID transakcji:</span>
        <span className="font-mono text-sm">{paymentStatus.transaction_id}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Next Steps */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Co dalej?</h2>
          <div className="space-y-4">
            {isPaymentSuccessful ? (
              <>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Potwierdzenie email</h3>
                    <p className="text-sm text-gray-600">
                      Wysłaliśmy potwierdzenie zamówienia na Twój adres email.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Przygotowanie zamówienia</h3>
                    <p className="text-sm text-gray-600">
                      Rozpoczynamy przygotowanie Twojego zamówienia do wysyłki.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ArrowRight className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Śledzenie przesyłki</h3>
                    <p className="text-sm text-gray-600">
                      Otrzymasz numer do śledzenia, gdy zamówienie zostanie wysłane.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium">Oczekiwanie na płatność</h3>
                  <p className="text-sm text-gray-600">
                    Płatność może potrwać do 5 minut. Otrzymasz email z potwierdzeniem.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => window.location.href = '/konto'}
            className="flex-1"
          >
            <Package className="h-4 w-4 mr-2" />
            Moje zamówienia
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/sklep'}
            className="flex-1"
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Kontynuuj zakupy
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="flex-1"
          >
            <Home className="h-4 w-4 mr-2" />
            Strona główna
          </Button>
        </div>

        {/* Support Info */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="text-center">
            <h3 className="font-medium text-blue-900 mb-2">Potrzebujesz pomocy?</h3>
            <p className="text-sm text-blue-800 mb-3">
              Jeśli masz pytania dotyczące zamówienia, skontaktuj się z nami.
            </p>
            <Button variant="outline" size="sm">
              Kontakt z obsługą
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}