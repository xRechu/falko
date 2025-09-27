import { NextRequest, NextResponse } from 'next/server'
import { MEDUSA_BASE_URL, MEDUSA_PUBLISHABLE_KEY } from '@/lib/api-config'
import { getAuthHeadersFromCookies } from '@/lib/server-auth'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { cartId, email, shipping_address } = body || {}

    if (!cartId) {
      return NextResponse.json({ error: 'Missing cartId' }, { status: 400 })
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY || '',
    }

    // If logged-in customer, attach Authorization
    const auth = getAuthHeadersFromCookies()
    if (auth) Object.assign(headers, auth)

  const backendUrl = `${MEDUSA_BASE_URL}/store/carts/${encodeURIComponent(cartId)}`

    const payload: Record<string, any> = {}
    if (email) payload.email = email
    if (shipping_address) payload.shipping_address = shipping_address

    const res = await fetch(backendUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    const dataText = await res.text()
    const data = (() => {
      try {
        return JSON.parse(dataText)
      } catch {
        return { raw: dataText }
      }
    })()

    const resp = NextResponse.json(data, { status: res.status })
    resp.headers.set('Cache-Control', 'no-store')
    return resp
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Failed to prepare checkout' },
      { status: 500 }
    )
  }
}
