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

    const bodyInput = (req as any).body as Partial<PaynowInitiateBody> || {}
  const { amount, currency = 'PLN', externalId, description, buyer, continueUrl, paymentMethodId, authorizationCode } = bodyInput
    if (!amount || !externalId || !description || !buyer?.email) return res.status(400).json({ error: 'Missing required fields' })

    const idempotencyKey = crypto.randomUUID()
    const baseUrl = getPaynowBaseUrl(ENV)

    // Zadbaj o absolutny continueUrl (Paynow wymaga pełnego URL)
    const FRONTEND_URL = process.env.FRONTEND_PUBLIC_URL || ''
    const BACKEND_URL = process.env.BACKEND_PUBLIC_URL || ''
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

    const resolvedContinueUrl = makeAbsolute(continueUrl) || `${BACKEND_URL}/store/carts/${encodeURIComponent(String(externalId))}/complete`

    const body: Record<string, any> = {
      amount: Number(amount),
      currency,
      externalId: String(externalId),
      description: String(description),
      continueUrl: resolvedContinueUrl,
      buyer: { email: String(buyer.email) },
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
