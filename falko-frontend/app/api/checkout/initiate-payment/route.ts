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

    // 1) Ensure payment-collection exists for cart (Medusa v2 will auto-create if not provided)
    const pcRes = await fetch(`${MEDUSA_BASE_URL}/store/payment-collections`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ cart_id: cartId }),
    })

    // ok if 200/201; if 4xx because exists, that's fine
    const pcJson = await pcRes.json().catch(() => ({}))
    const paymentCollectionId = pcJson?.payment_collection?.id || pcJson?.id

    // 2) Initiate payment session for that collection
    const initUrl = paymentCollectionId
      ? `${MEDUSA_BASE_URL}/store/payment-collections/${paymentCollectionId}/payment-sessions`
      : `${MEDUSA_BASE_URL}/store/payment-collections/payment-sessions` // fallback

    const psRes = await fetch(initUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ provider_id: provider_id || 'pp_system_default', authorize: !!authorize }),
    })

    const psText = await psRes.text()
    const psData = (() => { try { return JSON.parse(psText) } catch { return { raw: psText } } })()
    const resp = NextResponse.json(psData, { status: psRes.status })
    resp.headers.set('Cache-Control', 'no-store')
    return resp
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to initiate payment session' }, { status: 500 })
  }
}
