import type { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { Modules } from '@medusajs/framework/utils'
import { processPaymentWorkflow } from '@medusajs/medusa/core-flows'

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Delegate to Payment Module: it will call our provider's getWebhookActionAndData
    const paymentModuleService = req.scope.resolve(Modules.PAYMENT)

    const dataAndAction = await paymentModuleService.getWebhookActionAndData({
      provider: 'paynow',
      payload: {
        data: (req.body || {}) as Record<string, unknown>,
        rawData: (req as any).rawBody,
        headers: req.headers as any,
      },
    })

    // Then run the core workflow that handles complete/capture/authorize
    const result = await processPaymentWorkflow(req.scope).run({
      input: {
        action: dataAndAction.action,
        data: dataAndAction.data,
      },
    })

    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ ok: true, action: dataAndAction.action, result })
  } catch (e) {
    console.error('Paynow webhook error (backend):', e)
    return res.status(500).send('Internal Server Error')
  }
}
