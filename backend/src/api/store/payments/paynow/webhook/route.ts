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

    // Auto-finalizacja koszyka po potwierdzeniu płatności (z idempotencją)
    if (status === 'CONFIRMED' && externalId) {
      try {
        const backendUrl = process.env.BACKEND_PUBLIC_URL || ''
        const cartUrl = `${backendUrl}/store/carts/${encodeURIComponent(String(externalId))}`
        // 1) Sprawdź stan koszyka – jeśli już ukończony, nie powtarzaj
        let alreadyCompleted = false
        try {
          const check = await fetch(cartUrl, { headers: { Accept: 'application/json' } })
          if (check.ok) {
            const cj = await check.json().catch(() => ({}))
            const c = cj?.cart || cj
            alreadyCompleted = Boolean(c?.completed_at || c?.completed || c?.state === 'completed' || c?.order_id)
          }
        } catch {}

        if (alreadyCompleted) {
          console.log('ℹ️ Cart already completed, skipping complete:', externalId)
        } else {
          const completeUrl = `${cartUrl}/complete`
          const resp = await fetch(completeUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
          const txt = await resp.text()
          console.log('🧾 Cart complete via webhook:', resp.status, txt)
        }
      } catch (e) {
        console.error('⚠️ Failed to complete cart on webhook:', e)
      }
    }

    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).end()
  } catch (e) {
    console.error('Paynow webhook error (backend):', e)
    return res.status(500).send('Internal Server Error')
  }
}
