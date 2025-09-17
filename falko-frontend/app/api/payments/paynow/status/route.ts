import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const paymentId = searchParams.get('paymentId')
    if (!paymentId) {
      return new Response(JSON.stringify({ error: 'paymentId required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ''
    const pubKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''
    if (!backendUrl || !pubKey) {
      return new Response(JSON.stringify({ error: 'Missing backend URL or publishable key' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    const r = await fetch(`${backendUrl}/payments/paynow/status?paymentId=${encodeURIComponent(paymentId)}` , {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'x-publishable-api-key': pubKey,
      },
      cache: 'no-store',
    })

    const text = await r.text()
    return new Response(text, {
      status: r.status,
      headers: {
        'Content-Type': r.headers.get('content-type') || 'application/json',
        'Cache-Control': 'no-store',
      }
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: process.env.NODE_ENV === 'production' ? undefined : String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
