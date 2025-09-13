import type { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import crypto from 'crypto'
import { calculateRequestSignatureV3, getPaynowBaseUrl } from 'modules/paynow/service'

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const API_KEY = process.env.PAYNOW_API_KEY
    const SIGNATURE_KEY = process.env.PAYNOW_SIGNATURE_KEY
    const ENV = (process.env.PAYNOW_ENV as 'sandbox' | 'production') || 'sandbox'
    if (!API_KEY || !SIGNATURE_KEY) return res.status(500).json({ error: 'Missing Paynow keys' })

    const paymentId = req.query?.paymentId as string
    if (!paymentId) return res.status(400).json({ error: 'paymentId required' })

    const idempotencyKey = crypto.randomUUID()
    const baseUrl = getPaynowBaseUrl(ENV)

    const signature = calculateRequestSignatureV3({ apiKey: API_KEY, idempotencyKey, bodyString: '', signatureKey: SIGNATURE_KEY, parameters: {} })

    const tryUrls = [
      `${baseUrl}/v3/payments/${encodeURIComponent(paymentId)}`,
      `${baseUrl}/v3/payments/${encodeURIComponent(paymentId)}/status`,
      `${baseUrl}/v3/transactions/${encodeURIComponent(paymentId)}`,
      `${baseUrl}/v3/transactions/${encodeURIComponent(paymentId)}/status`,
      `${baseUrl}/v3/payments/transactions/${encodeURIComponent(paymentId)}`,
    ]

    for (const url of tryUrls) {
      const r = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json', 'Api-Key': API_KEY, 'Signature': signature, 'Idempotency-Key': idempotencyKey } })
      const text = await r.text()
      if (r.ok) {
        try {
          const data = JSON.parse(text)
          const status = data?.status || data?.payment?.status || data?.state || data?.state?.status || data?.transaction?.status || data?.paymentStatus || data?.currentStatus || data?.order?.status || null
          res.setHeader('Cache-Control', 'no-store')
          return res.status(200).json({ status })
        } catch {
          res.setHeader('Cache-Control', 'no-store')
          return res.status(200).json({ status: null })
        }
      }
      if (r.status !== 404) return res.status(r.status).json({ error: 'Paynow error' })
    }

    return res.status(200).json({ status: null })
  } catch (e) {
    console.error('paynow status error:', e)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
