import type { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { verifyWebhookSignature } from 'modules/paynow/service'
import type { PaynowWebhookPayload } from 'modules/paynow/types'

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const SIGNATURE_KEY = process.env.PAYNOW_SIGNATURE_KEY
    if (!SIGNATURE_KEY) return res.status(500).send('Missing signature key')

    const signatureHeader = req.headers['signature'] as string | undefined || null
    const rawBody = (req as any).rawBody || JSON.stringify(req.body || {})

    const valid = verifyWebhookSignature(rawBody, signatureHeader, SIGNATURE_KEY)
    if (!valid) return res.status(400).send('Invalid signature')

  const payload: PaynowWebhookPayload = JSON.parse(rawBody)
  const { paymentId, externalId, status } = payload || {}
  console.log('🔔 Paynow webhook (backend):', { paymentId, externalId, status })

  // Minimal status handling (extend later):
  // if (status === 'CONFIRMED' && externalId) { /* TODO: finalize cart */ }

    // TODO: map status to Medusa payment / order state.
    // If CONFIRMED and externalId => finalize cart: POST /store/carts/:id/complete

    return res.status(200).end()
  } catch (e) {
    console.error('Paynow webhook error (backend):', e)
    return res.status(500).send('Internal Server Error')
  }
}
