import { NextRequest, NextResponse } from 'next/server'
import { MEDUSA_BASE_URL, MEDUSA_PUBLISHABLE_KEY } from '@/lib/api-config'
import { getAuthHeadersFromCookies } from '@/lib/server-auth'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { cartId, provider_id, authorize } = body || {}

    if (!cartId) return NextResponse.json({ error: 'Missing cartId' }, { status: 400 })

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY || '',
    }
    const auth = getAuthHeadersFromCookies()
    if (auth) Object.assign(headers, auth)

    // Guard: nie inicjalizuj sesji płatności, gdy total koszyka <= 0
    try {
      const cartRes = await fetch(`${MEDUSA_BASE_URL}/store/carts/${encodeURIComponent(cartId)}`, {
        headers,
        cache: 'no-store',
      })
      if (cartRes.ok) {
        const cartJson = await cartRes.json().catch(() => ({}))
        const c = cartJson?.cart || cartJson
        const total = Number(c?.total ?? 0)
        if (!Number.isFinite(total) || total <= 0) {
          const resp = NextResponse.json({ ok: true, skipped: true, reason: 'cart_total_is_zero' }, { status: 200 })
          resp.headers.set('Cache-Control', 'no-store')
          return resp
        }
      }
    } catch {}

    // 1) Ensure payment-collection exists for cart (Medusa v2 will auto-create if not provided)
    let pcId: string | undefined
    try {
      const pcRes = await fetch(`${MEDUSA_BASE_URL}/store/payment-collections`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ cart_id: cartId }),
      })
      const pcJson = await pcRes.json().catch(() => ({}))
      pcId = pcJson?.payment_collection?.id || pcJson?.id
    } catch (e) {
      // best-effort: brak kolekcji nie powinien blokować reszty flow
      console.warn('initiate-payment: payment-collection create failed (ignored)', e)
    }

    // 2) Initiate payment session for that collection
    const initUrl = pcId
      ? `${MEDUSA_BASE_URL}/store/payment-collections/${pcId}/payment-sessions`
      : `${MEDUSA_BASE_URL}/store/payment-collections/payment-sessions` // fallback
    try {
      const psRes = await fetch(initUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ provider_id: provider_id || 'pp_system_default', authorize: !!authorize }),
      })

      const psText = await psRes.text()
      const psData = (() => { try { return JSON.parse(psText) } catch { return { raw: psText } } })()
      const resp = NextResponse.json(psData, { status: 200 }) // nawet gdy 4xx, nie blokuj UI
      resp.headers.set('Cache-Control', 'no-store')
      return resp
    } catch (e) {
      // total best-effort: zwróć 200, UI i tak kontynuuje płatność Paynow
      const resp = NextResponse.json({ ok: true, skipped: true, note: 'initiate payment session skipped' }, { status: 200 })
      resp.headers.set('Cache-Control', 'no-store')
      return resp
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to initiate payment session' }, { status: 500 })
  }
}
