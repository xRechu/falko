import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/paynow'
import { API_CONFIG } from '@/lib/api-config'

const SIGNATURE_KEY = process.env.PAYNOW_SIGNATURE_KEY!

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    if (!SIGNATURE_KEY) {
      return new NextResponse('Missing signature key', { status: 500 })
    }

    const signatureHeader = req.headers.get('signature')

    // Pobierz surowe body jako tekst (ważne do HMAC)
    const rawBody = await req.text()

    const valid = verifyWebhookSignature(rawBody, signatureHeader, SIGNATURE_KEY)
    if (!valid) {
      console.warn('Invalid Paynow webhook signature')
      return new NextResponse('Invalid signature', { status: 400 })
    }

    const payload = JSON.parse(rawBody)
    // payload: { paymentId, externalId, status, modifiedAt }
    const { paymentId, externalId, status } = payload || {}

    console.log('🔔 Paynow webhook:', { paymentId, externalId, status })

    // Jeśli płatność potwierdzona – finalizuj koszyk (utwórz order)
    // NOTE: Notification URL is not sent in initiate request.
    // Configure Paynow webhooks in the provider dashboard to call this endpoint.
    if (status === 'CONFIRMED' && externalId) {
      try {
        const url = `${API_CONFIG.MEDUSA_BACKEND_URL}/store/carts/${encodeURIComponent(String(externalId))}/complete`
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-publishable-api-key': API_CONFIG.MEDUSA_PUBLISHABLE_KEY || '',
          },
          cache: 'no-store',
        })
        let text = await res.text()
        if (!res.ok) {
          // Jeśli brakuje payment sessions – spróbuj je utworzyć i powtórz
          if (res.status === 400 && /payment sessions/i.test(text)) {
            try {
              const initRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/checkout/initiate-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cartId: String(externalId), provider_id: 'pp_system_default', authorize: true })
              })
              if (!initRes.ok) console.warn('webhook: initiate-payment fallback non-200', await initRes.text())
            } catch (e) { console.warn('webhook: initiate-payment fallback failed', e) }

            const retry = await fetch(url, {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'x-publishable-api-key': API_CONFIG.MEDUSA_PUBLISHABLE_KEY || '',
              },
              cache: 'no-store',
            })
            text = await retry.text()
            if (!retry.ok) console.error('webhook complete retry non-200:', retry.status, text)
            else console.log('✅ Cart completed via webhook (retry):', text)
          } else {
            console.error('webhook complete non-200:', res.status, text)
          }
        } else {
          console.log('✅ Cart completed via webhook:', text)
        }
      } catch (e) {
        console.error('webhook complete error:', e)
      }
    }

    // TODO: mapowanie statusów i aktualizacja Medusy (payment collection / order):
    // - NEW/PENDING -> awaiting
    // - CONFIRMED -> captured (complete cart -> create order)
    // - REJECTED/CANCELLED/ERROR/EXPIRED -> canceled

    // Zwróć 200/202 aby zatrzymać retry
    return new NextResponse(null, { status: 200 })
  } catch (err) {
    console.error('Paynow webhook error:', err)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
