import type { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { calculateRequestSignatureV3, getPaynowBaseUrl } from 'modules/paynow/service'

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const API_KEY = process.env.PAYNOW_API_KEY
    const SIGNATURE_KEY = process.env.PAYNOW_SIGNATURE_KEY
    const ENV = (process.env.PAYNOW_ENV as 'sandbox' | 'production') || 'sandbox'
    if (!API_KEY || !SIGNATURE_KEY) return res.status(500).json({ error: 'Missing Paynow keys' })

    const paymentId = req.query?.paymentId as string
    if (!paymentId) return res.status(400).json({ error: 'paymentId required' })

    const baseUrl = getPaynowBaseUrl(ENV)

    // Signature (GET with empty body)
    const signature = calculateRequestSignatureV3({ apiKey: API_KEY, idempotencyKey: '' as any, bodyString: '', signatureKey: SIGNATURE_KEY, parameters: {} })

    const tryUrls = [
      `${baseUrl}/v3/payments/${encodeURIComponent(paymentId)}/status`,
      `${baseUrl}/v3/payments/${encodeURIComponent(paymentId)}`,
      `${baseUrl}/v3/transactions/${encodeURIComponent(paymentId)}`,
      `${baseUrl}/v3/transactions/${encodeURIComponent(paymentId)}/status`,
      `${baseUrl}/v3/payments/transactions/${encodeURIComponent(paymentId)}`,
    ]

    let lastErrorStatus: number | null = null
    let lastErrorBody: string | null = null

    for (const url of tryUrls) {
      let r = await fetch(url, { method: 'GET', headers: { 'Accept': '*/*', 'Api-Key': API_KEY, 'Signature': signature, 'User-Agent': 'FalkoMedusa/1.0' } })
      let text = await r.text()
      if (r.status === 400 || r.status === 401) {
        // Sandbox sometimes rejects signed GET; retry with Api-Key only
        r = await fetch(url, { method: 'GET', headers: { 'Accept': '*/*', 'Api-Key': API_KEY, 'User-Agent': 'FalkoMedusa/1.0' } })
        text = await r.text()
      }
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
      lastErrorStatus = r.status
      lastErrorBody = text
      if (r.status === 404) continue
    }

    if (lastErrorStatus) {
      return res.status(lastErrorStatus).json({ error: 'Paynow error', details: process.env.NODE_ENV === 'production' ? undefined : lastErrorBody })
    }

    return res.status(200).json({ status: null })
  } catch (e) {
    console.error('paynow status error:', e)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
