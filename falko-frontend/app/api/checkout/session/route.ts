import { NextRequest, NextResponse } from 'next/server'
import { MEDUSA_BASE_URL, MEDUSA_PUBLISHABLE_KEY } from '@/lib/api-config'
import { getAuthHeadersFromCookies } from '@/lib/server-auth'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { cartId } = body || {}
    if (!cartId) return NextResponse.json({ error: 'Missing cartId' }, { status: 400 })

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY || '',
    }
    const auth = getAuthHeadersFromCookies()
    if (auth) Object.assign(headers, auth)

    // Ensure payment-collection exists (idempotent)
    let pcId: string | undefined
    try {
      const pcRes = await fetch(`${MEDUSA_BASE_URL}/store/payment-collections`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ cart_id: cartId }),
      })
      const pcJson = await pcRes.json().catch(() => ({}))
      pcId = pcJson?.payment_collection?.id || pcJson?.id
    } catch {}

    if (!pcId) return NextResponse.json({ error: 'payment_collection_not_found' }, { status: 404 })

    const getRes = await fetch(`${MEDUSA_BASE_URL}/store/payment-collections/${pcId}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })
    const text = await getRes.text()
    const data = (() => { try { return JSON.parse(text) } catch { return { raw: text } } })()

    const collection = data?.payment_collection || data
    const sessions = collection?.payment_sessions || collection?.sessions || []
    const paynow = Array.isArray(sessions) ? sessions.find((s: any) => (s?.provider_id === 'paynow' || s?.provider === 'paynow')) : null
    const redirectUrl = paynow?.data?.redirectUrl || paynow?.data?.redirect_url

    const resp = NextResponse.json({ payment_collection_id: pcId, sessions, redirectUrl }, { status: 200 })
    resp.headers.set('Cache-Control', 'no-store')
    return resp
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to retrieve session' }, { status: 500 })
  }
}
