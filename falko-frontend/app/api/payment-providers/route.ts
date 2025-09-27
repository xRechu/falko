import { NextRequest, NextResponse } from 'next/server'
import { MEDUSA_BASE_URL, MEDUSA_PUBLISHABLE_KEY } from '@/lib/api-config'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${MEDUSA_BASE_URL}/store/payment-providers`, {
      headers: {
        'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY || '',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })
    const text = await res.text()
    const data = (() => { try { return JSON.parse(text) } catch { return { raw: text } } })()
    const resp = NextResponse.json(data, { status: res.ok ? 200 : res.status })
    resp.headers.set('Cache-Control', 'no-store')
    return resp
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to list payment providers' }, { status: 500 })
  }
}
