import { NextRequest, NextResponse } from 'next/server'
import { API_CONFIG } from '@/lib/api-config'

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      const origin = req.headers.get('origin') || ''
      const base = process.env.NEXT_PUBLIC_BASE_URL || ''
      if (origin && base && !origin.startsWith(base)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
    const { cartId } = await req.json()
    if (!cartId) return NextResponse.json({ error: 'cartId required' }, { status: 400 })

    const url = `${API_CONFIG.MEDUSA_BACKEND_URL}/store/carts/${encodeURIComponent(cartId)}/complete?expand=order,payment_collection,payment_sessions`
    let res = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-publishable-api-key': API_CONFIG.MEDUSA_PUBLISHABLE_KEY || '',
        'cookie': req.headers.get('cookie') || '',
      },
      cache: 'no-store',
    })
    let text = await res.text()
    if (!res.ok) {
    // Jeżeli brakuje payment sessions – spróbuj utworzyć i powtórz
      const missingSessions = text.includes('Payment sessions are required') || text.includes('payment sessions')
      if (res.status === 400 && missingSessions) {
        try {
      // W środowisku serwerowym musimy użyć bezwzględnego URL
      const proto = req.headers.get('x-forwarded-proto') || 'http'
      const host = req.headers.get('host') || 'localhost:3000'
      const baseUrl = `${proto}://${host}`
          // Tworzymy sesję pp_system_default (bez autoryzacji) — wystarczy do complete
          await fetch(`${baseUrl}/api/checkout/initiate-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartId, provider_id: 'pp_system_default', authorize: false })
          })
          // ignorujemy wynik, próbujemy dokończyć koszyk ponownie
        } catch (e) {
          console.warn('complete: initiate-payment fallback failed', e)
        }
        res = await fetch(url, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-publishable-api-key': API_CONFIG.MEDUSA_PUBLISHABLE_KEY || '',
            'cookie': req.headers.get('cookie') || '',
          },
          cache: 'no-store',
        })
        text = await res.text()
      }
      if (!res.ok) {
        console.error('medusa complete non-200:', res.status, text)
        const payload = process.env.NODE_ENV === 'production' ? { error: 'Medusa complete error' } : { error: 'Medusa complete error', details: text }
        return NextResponse.json(payload, { status: res.status })
      }
    }
    const data = JSON.parse(text)
    if (data?.type === 'order' && data?.order) {
      return NextResponse.json({ order: data.order })
    }
    return NextResponse.json({ error: 'Cart not completed', data }, { status: 400 })
  } catch (e) {
    console.error('complete checkout error:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
