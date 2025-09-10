import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { calculateRequestSignatureV3, getPaynowBaseUrl } from '@/lib/paynow'

// UWAGA: klucze muszą być w środowisku serwerowym
const API_KEY = process.env.PAYNOW_API_KEY!
const SIGNATURE_KEY = process.env.PAYNOW_SIGNATURE_KEY!
const ENV = (process.env.PAYNOW_ENV as 'sandbox' | 'production') || 'sandbox'

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      const origin = req.headers.get('origin') || ''
      const base = process.env.NEXT_PUBLIC_BASE_URL || ''
      if (origin && base && !origin.startsWith(base)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
    if (!API_KEY || !SIGNATURE_KEY) {
      return NextResponse.json({ error: 'Missing Paynow keys' }, { status: 500 })
    }

  const { amount, currency = 'PLN', externalId, description, buyer, continueUrl, paymentMethodId, authorizationCode } = await req.json()

    if (!amount || !externalId || !description || !buyer?.email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const idempotencyKey = crypto.randomUUID()
  const baseUrl = getPaynowBaseUrl(ENV)

    // Body jako niezmieniony string (ważne dla Signature)
    const body: Record<string, any> = {
      amount: Number(amount),
      currency,
      externalId: String(externalId),
      description: String(description),
      continueUrl: continueUrl || `${process.env.NEXT_PUBLIC_BASE_URL || ''}/checkout/success?cart_id=${encodeURIComponent(String(externalId))}`,
      buyer: { email: String(buyer.email) },
    }
  // White Label BLIK: jeśli mamy paymentMethodId i authorizationCode, dodaj do body
  if (paymentMethodId) body.paymentMethodId = Number(paymentMethodId)
  if (authorizationCode) body.authorizationCode = String(authorizationCode)
    const bodyString = JSON.stringify(body)

    const signature = calculateRequestSignatureV3({
      apiKey: API_KEY,
      idempotencyKey,
      bodyString,
      signatureKey: SIGNATURE_KEY,
      parameters: {},
    })

    const response = await fetch(`${baseUrl}/v3/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Api-Key': API_KEY,
        'Signature': signature,
        'Idempotency-Key': idempotencyKey,
        // opcjonalnie: 'User-Agent': 'FalkoProject/1.0'
      },
      body: bodyString,
      // Next: do not cache, edge-safe
      cache: 'no-store',
    })

    if (!response.ok) {
      const text = await response.text()
      const payload = process.env.NODE_ENV === 'production' ? { error: 'Paynow error' } : { error: 'Paynow error', details: text }
      return NextResponse.json(payload, { status: response.status })
    }

    const data = await response.json()
    // data: { redirectUrl, paymentId, status }
    const res = NextResponse.json({
      redirectUrl: data.redirectUrl,
      paymentId: data.paymentId,
      status: data.status,
    })
    try {
      // Zapisz HttpOnly cookie z mapowaniem externalId -> paymentId (30 min)
      const cname = `paynow_map_${encodeURIComponent(String(externalId))}`
      const cval = encodeURIComponent(String(data.paymentId))
      const secure = (process.env.NODE_ENV === 'production' || (process.env.NEXT_PUBLIC_BASE_URL || '').startsWith('https://')) ? '; Secure' : ''
      res.headers.set('Set-Cookie', `${cname}=${cval}; Path=/; Max-Age=1800; SameSite=Lax; HttpOnly${secure}`)
    } catch {}
    return res
  } catch (err: any) {
    console.error('paynow initiate error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
