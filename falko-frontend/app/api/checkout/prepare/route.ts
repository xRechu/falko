import { NextRequest, NextResponse } from 'next/server'
import { API_CONFIG } from '@/lib/api-config'

export async function POST(req: NextRequest) {
  try {
    const { cartId, email, shipping_address, billing_address } = await req.json()
    if (!cartId) return NextResponse.json({ error: 'cartId required' }, { status: 400 })

    const base = API_CONFIG.MEDUSA_BACKEND_URL
    const pub = API_CONFIG.MEDUSA_PUBLISHABLE_KEY || ''
    const cookie = req.headers.get('cookie') || ''
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-publishable-api-key': pub,
      'cookie': cookie,
    } as const

    // 1) Ustaw email (best-effort)
    if (email) {
      try {
        await fetch(`${base}/store/carts/${encodeURIComponent(cartId)}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ email })
        })
      } catch (e) {
        console.warn('prepare: patch email failed', e)
      }
    }

    // 2) Ustaw adresy, jeśli podane
    if (shipping_address || billing_address) {
      try {
        await fetch(`${base}/store/carts/${encodeURIComponent(cartId)}/addresses`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ shipping_address, billing_address: billing_address || shipping_address })
        })
      } catch (e) {
        console.warn('prepare: set addresses failed', e)
      }
    }

    // 3) Dodaj metodę dostawy – wybierz pierwszą dostępną
    try {
      const so = await fetch(`${base}/store/shipping-options?cart_id=${encodeURIComponent(cartId)}`, { headers })
      const soText = await so.text()
      if (so.ok) {
        const soData = JSON.parse(soText)
        const option = soData?.shipping_options?.[0] || soData?.shipping_options?.[0]
        const optionId = option?.id
        if (optionId) {
          await fetch(`${base}/store/carts/${encodeURIComponent(cartId)}/shipping-methods`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ option_id: optionId })
          })
        } else {
          console.warn('prepare: no shipping option available')
        }
      } else {
        console.warn('prepare: shipping-options non-200', so.status, soText)
      }
    } catch (e) {
      console.warn('prepare: add shipping method failed', e)
    }

    // 4) Zwróć OK
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('prepare error', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
