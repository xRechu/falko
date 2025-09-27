export const runtime = 'edge'
import { NextResponse } from 'next/server'
import { API_CONFIG } from '@/lib/api-config'
import { getAuthHeadersFromCookies } from '@/lib/server-auth'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const url = new URL(req.url)
    const fields = url.searchParams.get('fields') ?? '*items,*shipping_address,*billing_address,*payments,*items.variant'

    const authHeaders = await getAuthHeadersFromCookies()
    if (!authHeaders.Authorization) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const resp = await fetch(`${API_CONFIG.MEDUSA_BACKEND_URL}/store/orders/${encodeURIComponent(params.id)}?fields=${encodeURIComponent(fields)}`, {
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
    console.error('order details proxy error', e)
    return NextResponse.json({ message: 'Failed to fetch order details' }, { status: 500 })
  }
}
