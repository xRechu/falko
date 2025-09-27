export const runtime = 'edge'
import { NextResponse } from 'next/server'
import { API_CONFIG } from '@/lib/api-config'
import { getAuthHeadersFromCookies } from '@/lib/server-auth'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const limit = url.searchParams.get('limit') ?? '20'
    const offset = url.searchParams.get('offset') ?? '0'
    const fields = url.searchParams.get('fields') ?? '*shipping_address,*billing_address,*items,*payments'

    const authHeaders = await getAuthHeadersFromCookies()
    if (!authHeaders.Authorization) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const resp = await fetch(`${API_CONFIG.MEDUSA_BACKEND_URL}/store/orders?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}&fields=${encodeURIComponent(fields)}`, {
      headers: {
        ...authHeaders,
        'Accept': 'application/json',
        'x-publishable-api-key': API_CONFIG.MEDUSA_PUBLISHABLE_KEY || ''
      },
      cache: 'no-store'
    })

    if (!resp.ok) return NextResponse.json({ message: await resp.text() }, { status: resp.status })
    const data = await resp.json()
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e: any) {
    console.error('orders proxy error', e)
    return NextResponse.json({ message: 'Failed to fetch orders' }, { status: 500 })
  }
}
