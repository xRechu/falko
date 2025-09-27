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

    const res = await fetch(`${MEDUSA_BASE_URL}/store/carts/${encodeURIComponent(cartId)}/complete`, {
      method: 'POST',
      headers,
    })

    const text = await res.text()
    const data = (() => { try { return JSON.parse(text) } catch { return { raw: text } } })()
    const resp = NextResponse.json(data, { status: res.status })
    resp.headers.set('Cache-Control', 'no-store')
    return resp
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to complete checkout' }, { status: 500 })
  }
}
