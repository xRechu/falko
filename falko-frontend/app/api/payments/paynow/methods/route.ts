import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { calculateRequestSignatureV3, getPaynowBaseUrl } from '@/lib/paynow'

const API_KEY = process.env.PAYNOW_API_KEY!
const SIGNATURE_KEY = process.env.PAYNOW_SIGNATURE_KEY!
const ENV = (process.env.PAYNOW_ENV as 'sandbox' | 'production') || 'sandbox'

export async function GET(_req: NextRequest) {
  try {
    if (!API_KEY || !SIGNATURE_KEY) {
      return NextResponse.json({ error: 'Missing Paynow keys' }, { status: 500 })
    }

    const idempotencyKey = crypto.randomUUID()
    const baseUrl = getPaynowBaseUrl(ENV)

    const signature = calculateRequestSignatureV3({
      apiKey: API_KEY,
      idempotencyKey,
      bodyString: '',
      signatureKey: SIGNATURE_KEY,
      parameters: {},
    })

    // Pierwsza próba: /v3/payments/payment-methods
    let res = await fetch(`${baseUrl}/v3/payments/payment-methods`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Api-Key': API_KEY,
        'Signature': signature,
        'Idempotency-Key': idempotencyKey,
      },
      cache: 'no-store',
    })

    // Fallback gdy 404 (niektóre konta mogą mieć inną ścieżkę)
    if (res.status === 404) {
      res = await fetch(`${baseUrl}/v3/payment-methods`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Api-Key': API_KEY,
          'Signature': signature,
          'Idempotency-Key': idempotencyKey,
        },
        cache: 'no-store',
      })
    }

    const text = await res.text()
    if (!res.ok) {
      console.error('paynow methods non-200:', res.status, text)
      return NextResponse.json({ error: 'Paynow error', details: text, status: res.status }, { status: res.status })
    }

    return new NextResponse(text, { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('paynow methods error:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
