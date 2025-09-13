import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Zwraca paymentId z ciasteczka HttpOnly ustawionego w /api/payments/paynow/initiate
// GET /api/payments/paynow/payment-id?cart_id=...
export async function GET(req: NextRequest) {
  try {
    const cartId = req.nextUrl.searchParams.get('cart_id')
    if (!cartId) return NextResponse.json({ error: 'cart_id required' }, { status: 400 })

    const cookieName = `paynow_map_${encodeURIComponent(cartId)}`
    const cookieHeader = req.headers.get('cookie') || ''
    const cookies = cookieHeader.split(';').map((s) => s.trim())
    let val: string | null = null
    for (const c of cookies) {
      if (c.startsWith(cookieName + '=')) {
        val = c.substring(cookieName.length + 1)
        break
      }
    }
    if (!val) {
      const res = NextResponse.json({ paymentId: null })
      res.headers.set('Access-Control-Allow-Origin', '*')
      res.headers.set('Vary', 'Origin')
      return res
    }
    try { val = decodeURIComponent(val) } catch {}
    const ok = NextResponse.json({ paymentId: val })
    ok.headers.set('Access-Control-Allow-Origin', '*')
    ok.headers.set('Vary', 'Origin')
    return ok
  } catch (e) {
    const err = NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    err.headers.set('Access-Control-Allow-Origin', '*')
    err.headers.set('Vary', 'Origin')
    return err
  }
}
