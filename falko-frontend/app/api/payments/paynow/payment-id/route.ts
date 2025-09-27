import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const cartId = searchParams.get('cart_id') || ''
    if (!cartId) return NextResponse.json({ error: 'Missing cart_id' }, { status: 400 })

    // Try to read from cookie set during initiate redirect
    const cookieName = `paynow_pid_${encodeURIComponent(cartId)}`
    const pid = req.cookies.get(cookieName)?.value || null

    return NextResponse.json({ paymentId: pid }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to read payment id' }, { status: 500 })
  }
}
