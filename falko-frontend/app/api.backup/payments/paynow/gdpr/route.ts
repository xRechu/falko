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

    const res = await fetch(`${baseUrl}/v3/data-processing-notices`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Api-Key': API_KEY,
        'Signature': signature,
        'Idempotency-Key': idempotencyKey,
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: 'Paynow error', details: text }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    console.error('paynow gdpr error:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
