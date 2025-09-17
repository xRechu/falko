"use client"

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Shield, Truck, CreditCard as CreditCardIcon } from 'lucide-react'
import { toast } from 'sonner'
import CheckoutForm, { type CheckoutFormData } from './CheckoutForm'
import type { PaymentStatus } from '@/lib/api/payments'
import { createPayment, getPaynowMethods } from '@/lib/api/payments'
import { useCart } from '@/lib/context/cart-context'
import { OrderSummary } from './OrderSummary'
import { Alert, AlertDescription } from '@/components/ui/alert'

type CheckoutStep = 'details' | 'processing' | 'success'

interface CheckoutWithPaymentProps {
  onOrderComplete?: (order: any) => void
}

export default function CheckoutWithPayment(props: CheckoutWithPaymentProps = {}) {
  const { onOrderComplete } = props
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('details')
  // lokalne dane formularza nie są przechowywane, bo płatność inicjujemy od razu
  const [loading, setLoading] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<PaymentStatus | null>(null)
  
  const { state, clearCartItems, snapshotCart, hasCartSnapshot, restoreCartFromSnapshot, clearCartSnapshot, resetCart } = useCart()
  const cart = state.cart

  const showRestoreToast = (message: string) => {
    const canRestore = hasCartSnapshot()
    toast.error(message, {
      description: canRestore ? 'Możesz przywrócić koszyk i spróbować ponownie.' : undefined,
      action: canRestore
        ? {
            label: 'Przywróć koszyk',
            onClick: async () => {
              const ok = await restoreCartFromSnapshot()
              if (ok) toast.success('Przywrócono koszyk')
              else toast.error('Nie udało się przywrócić koszyka')
            },
          }
        : undefined,
    })
  }

  // Check if returning from payment gateway – obsługa powrotu będzie dodana po wyborze nowej bramki

  const handleCheckoutSubmit = async (formData: CheckoutFormData) => {
    try {
      setLoading(true)
  // brak potrzeby trzymania stanu formularza – używamy danych od razu

      if (!cart) {
        throw new Error('Brak koszyka')
      }
      const orderIdLocal = cart.id
  // nie trzymaj orderId w stanie – przekazuj lokalnie
      const totalAmount = Math.round(cart.total || 0)
      console.log('� Cart ID:', orderIdLocal, 'Total:', totalAmount)

      // Zrób snapshot koszyka przed próbą płatności/finalizacji
      try { snapshotCart() } catch {}

      // Przygotuj koszyk po stronie Medusy (email, adresy, dostawa)
      try {
        await fetch('/api/checkout/prepare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cartId: orderIdLocal,
            email: formData.email,
            shipping_address: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              address_1: formData.address,
              city: formData.city,
              postal_code: formData.postalCode,
              country_code: (formData.country || 'pl').toLowerCase(),
              phone: formData.phone,
            }
          })
        })
      } catch (e) {
        console.warn('prepare failed (non-blocking)', e)
      }

      // Jeśli wybrano płatność przy odbiorze – utwórz sesję manualną i finalizuj koszyk
  if (formData.paymentMethod === 'cod') {
        try {
          // Upewnij się, że jest sesja płatności dla providera systemowego (COD, bez autoryzacji)
          const ipRes = await fetch('/api/checkout/initiate-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartId: orderIdLocal, provider_id: 'pp_system_default', authorize: false })
          })
          try {
            const ipJson = await ipRes.json()
            if (!ipRes.ok) console.warn('initiate-payment non-200', ipRes.status, ipJson)
            if (!ipJson?.payment_session_id) {
              console.warn('No payment_session_id returned; complete may fail, but proceeding to try...')
            }
          } catch {}
          // Spróbuj od razu kompletu
          let r = await fetch('/api/checkout/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartId: orderIdLocal })
          })
          if (!r.ok) {
            // Fallback: przygotuj i ponów
            await fetch('/api/checkout/prepare', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cartId: orderIdLocal, email: formData.email })
            })
            r = await fetch('/api/checkout/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cartId: orderIdLocal })
            })
          }
          if (r.ok) {
            const data = await r.json()
            toast.success('Zamówienie złożone, zapłata przy odbiorze.')
            if (data?.order?.id) {
              try { clearCartSnapshot(); resetCart() } catch {}
              window.location.href = `/order/${data.order.id}`
              return
            }
            try { clearCartSnapshot(); resetCart() } catch {}
            window.location.href = '/konto'
            return
          } else {
            const text = await r.text()
            console.error('COD complete failed:', text)
            showRestoreToast('Nie udało się sfinalizować zamówienia (COD)')
            return
          }
        } catch (e: any) {
          console.error('COD finalize error', e)
          showRestoreToast('Błąd finalizacji zamówienia (COD)')
          return
        }
      }

  // Płatności online przez Paynow
      const returnUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/checkout/success?cart_id=${encodeURIComponent(orderIdLocal)}`
        : '/checkout/success'

      let payment_method_id: number | undefined
      let authorization_code: string | undefined

      if (formData.paymentMethod === 'blik') {
        try {
          const methods = await getPaynowMethods()
          const list = methods?.paymentMethods || methods?.methods || []
          const blik = list.find((m: any) => m?.type === 'BLIK' || m?.name?.toUpperCase?.().includes('BLIK'))
          if (blik) {
            payment_method_id = blik.id
            authorization_code = formData.blikCode
          } else {
            console.warn('BLIK WL niedostępny – użyję redirectu bramki po initiate')
          }
        } catch (e: any) {
          console.warn('Nie udało się pobrać metod Paynow – użyję redirectu', e)
        }
      }

      // Upewnij się, że w Medusie istnieje sesja płatności dla koszyka (ułatwia późniejsze complete)
      try {
        await fetch('/api/checkout/initiate-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartId: orderIdLocal, provider_id: 'pp_system_default', authorize: false })
        })
      } catch (e) {
        console.warn('initiate-payment (online pre-create) failed', e)
      }

      const paymentResp = await createPayment({
        order_id: orderIdLocal,
        return_url: returnUrl,
        // pola niestandardowe obsługiwane w createPayment()
        ...( { amount: totalAmount, email: formData.email } as any ),
        ...(payment_method_id ? { payment_method_id } : {}),
        ...(authorization_code ? { authorization_code } : {}),
      })

  if (!paymentResp) throw new Error('Błąd inicjalizacji płatności')

      // Redirect gdy dostępny (Apple Pay / Google Pay / Pay-by-link)
      if (paymentResp.redirectUrl) {
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('paynow_payment_id', paymentResp.transactionId)
            sessionStorage.setItem('cart_id', orderIdLocal)
            // Zapisz też w cookie (przetrwa nową kartę)
            const cname = `paynow_pid_${orderIdLocal}`
            document.cookie = `${encodeURIComponent(cname)}=${encodeURIComponent(paymentResp.transactionId)}; path=/; max-age=1800; samesite=lax`
          }
        } catch {}
        window.location.href = paymentResp.redirectUrl
        return
      }

      // Brak redirectu – np. BLIK WL: poll statusu i finalizacja
      const confirmed = await pollPaymentUntilConfirmed(paymentResp.transactionId)
      if (confirmed) {
        await finalizeOrder(orderIdLocal)
      } else {
        showRestoreToast('Płatność nie została potwierdzona')
      }
      
    } catch (error: any) {
      console.error('❌ Error creating order:', error)
      showRestoreToast(error?.message || 'Błąd podczas tworzenia zamówienia')
    } finally {
      setLoading(false)
    }
  }

  // Osobny proceed handler zbędny – płatność będzie inicjowana przy submit formularza (po wdrożeniu nowej bramki)

  // pomocnicze handlery sukcesu/błędu przeniesiono do finalize/flow

  // cart totals są już w groszach (cents) – nie mnożymy ponownie
  // total liczymy lokalnie przy submit

  return (
    <div className="space-y-6">
      {hasCartSnapshot() && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription className="flex items-center justify-between gap-4 text-blue-800">
            <span>Masz zapisaną zawartość koszyka z poprzedniej próby płatności.</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={async () => {
                const ok = await restoreCartFromSnapshot()
                if (ok) toast.success('Przywrócono koszyk')
                else toast.error('Nie udało się przywrócić koszyka')
              }}>Przywróć koszyk</Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left column: steps + content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Steps */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              {[
                { key: 'details', label: 'Dane zamówienia', icon: '1' },
                { key: 'processing', label: 'Przetwarzanie', icon: '2' },
                { key: 'success', label: 'Potwierdzenie', icon: '✓' }
              ].map((step, index, arr) => {
                const order = arr.map(s => s.key)
                const currentIndex = order.indexOf(currentStep)
                const isDone = currentIndex > index
                const isActive = currentStep === step.key
                return (
                  <div key={step.key} className="flex items-center">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}
                    `}>
                      {isDone ? <CheckCircle className="h-4 w-4" /> : step.icon}
                    </div>
                    <span className={`ml-2 text-sm ${isActive ? 'font-medium text-blue-600' : 'text-gray-600'}`}>
                      {step.label}
                    </span>
                    {index < arr.length - 1 && (
                      <div className={`w-16 h-1 mx-4 ${isDone ? 'bg-green-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Step Content */}
          {currentStep === 'details' && (
            <CheckoutForm
              onSubmit={handleCheckoutSubmit}
              isProcessing={loading}
            />
          )}

          {/* Osobny krok płatności pominięty – płatność będzie inicjowana po submit */}

          {/* Ekran przetwarzania płatności zostanie przywrócony wraz z nową bramką */}

          {currentStep === 'success' && completedOrder && (
            <Card className="p-8 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-green-600 mb-2">
                    Zamówienie opłacone!
                  </h2>
                  <p className="text-gray-600">
                    Dziękujemy za zakup. Szczegóły zamówienia zostały wysłane na email.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Numer zamówienia:</span>
                      <span className="font-medium">#{completedOrder.order_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kwota:</span>
                      <span className="font-medium">
                        {(completedOrder.total_amount / 100).toFixed(2)} {completedOrder.currency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-medium text-green-600">Opłacone</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  <Button onClick={() => window.location.href = '/konto'}>
                    Moje zamówienia
                  </Button>
                  <Button variant="outline" onClick={() => window.location.href = '/sklep'}>
                    Kontynuuj zakupy
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right column: order summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            {cart && cart.items && cart.items.length > 0 && (
              <OrderSummary cart={cart} />
            )}

            {/* Trust Badges */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4 text-center">Bezpieczne zakupy</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Shield className="h-6 w-6 text-blue-600" />
                  <span className="text-xs text-gray-600">Bezpieczne płatności</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Truck className="h-6 w-6 text-green-600" />
                  <span className="text-xs text-gray-600">Szybka dostawa</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <CreditCardIcon className="h-6 w-6 text-purple-600" />
                  <span className="text-xs text-gray-600">Różne metody płatności</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

async function pollPaymentUntilConfirmed(paymentId: string, timeoutMs = 90_000, intervalMs = 2_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ''}/store/payments/paynow/status?paymentId=${encodeURIComponent(paymentId)}`, { cache: 'no-store', headers: { 'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '' } })
      if (r.ok) {
        const data = await r.json()
        const status = data?.status
        if (status === 'CONFIRMED') return true
        if ([ 'REJECTED','CANCELLED','ERROR','EXPIRED' ].includes(status)) return false
      }
    } catch {}
    await new Promise(res => setTimeout(res, intervalMs))
  }
  return false
}

async function finalizeOrder(cartId: string) {
  const r = await fetch('/api/checkout/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cartId })
  })
  if (r.ok) {
    const data = await r.json()
    toast.success('Zamówienie utworzone')
    if (data?.order?.id) {
      try { if (typeof window !== 'undefined') { localStorage.removeItem('cart_snapshot_v1'); localStorage.removeItem('cart_id'); } } catch {}
      window.location.href = `/order/${data.order.id}`
      return
    }
    // fallback
    try { if (typeof window !== 'undefined') { localStorage.removeItem('cart_snapshot_v1'); localStorage.removeItem('cart_id'); } } catch {}
    window.location.href = '/konto'
  } else {
    toast.error('Nie udało się sfinalizować zamówienia')
  }
}