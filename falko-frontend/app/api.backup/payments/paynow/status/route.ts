import { NextRequest, NextResponse } from 'next/server'
import { calculateRequestSignatureV3, getPaynowBaseUrl } from '@/lib/paynow'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const API_KEY = process.env.PAYNOW_API_KEY!
const SIGNATURE_KEY = process.env.PAYNOW_SIGNATURE_KEY!
const ENV = (process.env.PAYNOW_ENV as 'sandbox' | 'production') || 'sandbox'

export async function GET(req: NextRequest) {
  try {
    const paymentId = req.nextUrl.searchParams.get('paymentId')
    if (!paymentId) return NextResponse.json({ error: 'paymentId required' }, { status: 400 })
    if (!API_KEY || !SIGNATURE_KEY) return NextResponse.json({ error: 'Missing Paynow keys' }, { status: 500 })

    const idempotencyKey = crypto.randomUUID()
    const baseUrl = getPaynowBaseUrl(ENV)

    const signature = calculateRequestSignatureV3({
      apiKey: API_KEY,
      idempotencyKey,
      bodyString: '',
      signatureKey: SIGNATURE_KEY,
      parameters: {},
    })

    // Próbuj kilku znanych ścieżek API (różne konta zwracają różne kształty)
    const tryUrls = [
      `${baseUrl}/v3/payments/${encodeURIComponent(paymentId)}`,
      `${baseUrl}/v3/payments/${encodeURIComponent(paymentId)}/status`,
      `${baseUrl}/v3/transactions/${encodeURIComponent(paymentId)}`,
      `${baseUrl}/v3/transactions/${encodeURIComponent(paymentId)}/status`,
      `${baseUrl}/v3/payments/transactions/${encodeURIComponent(paymentId)}`,
    ]

    let lastNotFound = ''
    for (const url of tryUrls) {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Api-Key': API_KEY,
          'Signature': signature,
          'Idempotency-Key': idempotencyKey,
        },
        cache: 'no-store',
      })
      const text = await res.text()
      if (res.ok) {
        // Znormalizuj różne formaty do { status }
        try {
          const data = JSON.parse(text)
          const status =
            data?.status ||
            data?.payment?.status ||
            data?.state ||
            data?.state?.status ||
            data?.transaction?.status ||
            data?.paymentStatus ||
            data?.currentStatus ||
            data?.order?.status || null
          const res = NextResponse.json({ status: status || null })
          res.headers.set('Access-Control-Allow-Origin', '*')
          res.headers.set('Vary', 'Origin')
          return res
        } catch {
          const res = NextResponse.json({ status: null })
          res.headers.set('Access-Control-Allow-Origin', '*')
          res.headers.set('Vary', 'Origin')
          return res
        }
      }
      console.warn('paynow status non-200:', res.status, 'for', url, text)
      if (res.status === 404) lastNotFound = text
      // Inne błędy niż 404 traktujemy jako awarię
      if (res.status !== 404) {
    const errRes = NextResponse.json({ error: 'Paynow error', status: res.status }, { status: res.status })
    errRes.headers.set('Access-Control-Allow-Origin', '*')
    errRes.headers.set('Vary', 'Origin')
    return errRes
      }
    }

  // Nie znaleziono na żadnym endpoint – zwróć neutralnie z 200, aby UI mógł kontynuować polling
  const neutral = NextResponse.json({ status: null })
  neutral.headers.set('Access-Control-Allow-Origin', '*')
  neutral.headers.set('Vary', 'Origin')
  return neutral
  } catch (e) {
    console.error('paynow status error:', e)
  const errRes = NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  errRes.headers.set('Access-Control-Allow-Origin', '*')
  errRes.headers.set('Vary', 'Origin')
  return errRes
  }
}
