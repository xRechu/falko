import type { MedusaRequest, MedusaResponse } from '@medusajs/medusa'
import crypto from 'crypto'
import { calculateRequestSignatureV3, getPaynowBaseUrl } from '../../../../../modules/paynow/service'

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  try {
    const API_KEY = process.env.PAYNOW_API_KEY
    const SIGNATURE_KEY = process.env.PAYNOW_SIGNATURE_KEY
    const ENV = (process.env.PAYNOW_ENV as 'sandbox' | 'production') || 'sandbox'
    if (!API_KEY || !SIGNATURE_KEY) return res.status(500).json({ error: 'Missing Paynow keys' })

    const idempotencyKey = crypto.randomUUID()
    const baseUrl = getPaynowBaseUrl(ENV)

    const signature = calculateRequestSignatureV3({ apiKey: API_KEY, idempotencyKey, bodyString: '', signatureKey: SIGNATURE_KEY, parameters: {} })

    const r = await fetch(`${baseUrl}/v3/data-processing-notices`, { method: 'GET', headers: { 'Accept': 'application/json', 'Api-Key': API_KEY, 'Signature': signature, 'Idempotency-Key': idempotencyKey } })
    const text = await r.text()
    if (!r.ok) return res.status(r.status).json({ error: 'Paynow error', details: process.env.NODE_ENV === 'production' ? undefined : text })
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).send(text)
  } catch (e) {
    console.error('paynow gdpr error (backend):', e)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
