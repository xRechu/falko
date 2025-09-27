import type { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import crypto from 'crypto'
import { calculateRequestSignatureV3, getPaynowBaseUrl } from 'modules/paynow/service'
import type { PaynowInitiateBody } from 'modules/paynow/types'

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const API_KEY = process.env.PAYNOW_API_KEY
    const SIGNATURE_KEY = process.env.PAYNOW_SIGNATURE_KEY
    const ENV = (process.env.PAYNOW_ENV as 'sandbox' | 'production') || 'sandbox'
    if (!API_KEY || !SIGNATURE_KEY) return res.status(500).json({ error: 'Missing Paynow keys' })

    const bodyInput = ((req as any).body as Partial<PaynowInitiateBody>) || {}
    let { amount, currency = 'PLN', externalId, description, buyer, continueUrl, paymentMethodId, authorizationCode } = bodyInput

    // Fallback: jeśli brakuje krytycznych pól, spróbujmy je uzupełnić na podstawie koszyka
    const BACKEND_URL = process.env.BACKEND_PUBLIC_URL || ''
    const FRONTEND_URL = process.env.FRONTEND_PUBLIC_URL || ''
    if (!externalId) {
      return res.status(400).json({ error: 'Missing required field: externalId' })
    }

    // Jeśli brak amount lub amount <= 0, pobierz total z koszyka
    if (!amount || Number(amount) <= 0 || Number.isNaN(Number(amount))) {
      try {
        const cartRes = await fetch(`${BACKEND_URL}/store/carts/${encodeURIComponent(String(externalId))}`, {
          headers: { Accept: 'application/json' },
        })
        if (cartRes.ok) {
          const cartJson = await cartRes.json().catch(() => ({}))
          const cartTotal = cartJson?.cart?.total ?? cartJson?.total
          if (typeof cartTotal === 'number' && cartTotal > 0) {
            amount = cartTotal
          }
          // E-mail z koszyka, jeśli nie podano w buyer
          const cartEmail = cartJson?.cart?.email ?? cartJson?.email
          if (!buyer?.email && cartEmail) {
            buyer = { email: String(cartEmail) }
          }
        } else {
          // optionally log non-ok, ale nie blokuj
        }
      } catch (e) {
        // ignore fallback errors – walidacja niżej zadziała
      }
    }

    // Domyślny opis zamówienia, jeśli nie podano
    if (!description) description = `Zamówienie ${externalId}`
    // Buyer e-mail wymagany przez Paynow – jeżeli nadal brak, błąd
    const buyerEmail = buyer?.email
    // Upewnij się, że amount jest liczbą > 0
    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount <= 0 || !buyerEmail) {
      const missing: string[] = []
      if (!numericAmount || numericAmount <= 0) missing.push('amount')
      if (!buyerEmail) missing.push('buyer.email')
      return res.status(400).json({ error: 'Missing required fields', missing })
    }

    const idempotencyKey = crypto.randomUUID()
    const baseUrl = getPaynowBaseUrl(ENV)

    // Zadbaj o absolutny continueUrl (Paynow wymaga pełnego URL)
    const makeAbsolute = (u?: string) => {
      if (!u) return undefined
      if (/^https?:\/\//i.test(u)) return u
      if (FRONTEND_URL) {
        try { return new URL(u, FRONTEND_URL).toString() } catch {}
      }
      if (BACKEND_URL) {
        try { return new URL(u, BACKEND_URL).toString() } catch {}
      }
      return u
    }

    const resolvedContinueUrl = makeAbsolute(continueUrl) || (FRONTEND_URL
      ? new URL(`/checkout/success?cart_id=${encodeURIComponent(String(externalId))}`, FRONTEND_URL).toString()
      : `${BACKEND_URL}/store/carts/${encodeURIComponent(String(externalId))}/complete`)

    // Safe debug to help diagnose ProjectId/domain mismatches – no secrets
    try {
      const host = (() => { try { return new URL(resolvedContinueUrl).host } catch { return 'invalid-url' } })()
      console.log(`[paynow:initiate] ENV=${ENV} base=${baseUrl} continueHost=${host} externalId=${externalId} amount=${numericAmount}`)
    } catch {}

    const body: Record<string, any> = {
      amount: numericAmount,
      currency,
      externalId: String(externalId),
      description: String(description),
      continueUrl: resolvedContinueUrl,
      buyer: { email: String(buyerEmail) },
    }
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
      },
      body: bodyString,
    })

    if (!response.ok) {
      const text = await response.text()
      // Log details even in production (server logs only) to speed up diagnosis; do not expose in response
      try { console.error(`[paynow:initiate] Paynow error ${response.status}: ${text}`) } catch {}
      return res.status(response.status).json({ error: 'Paynow error', details: process.env.NODE_ENV === 'production' ? undefined : text })
    }

    const data = await response.json()
    return res.status(200).json({
      redirectUrl: data.redirectUrl,
      paymentId: data.paymentId,
      status: data.status,
    })
  } catch (e) {
    console.error('paynow initiate error:', e)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
