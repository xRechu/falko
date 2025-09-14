import type { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { LOYALTY_ENABLED } from '../../../../lib/constants'
import LoyaltyService from '../../../../modules/loyalty/service'

export const OPTIONS = async (_req: MedusaRequest, res: MedusaResponse) => {
  const origins = process.env.STORE_CORS?.split(',').map(o=>o.trim()).filter(Boolean)
  const origin = origins?.[0] || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-publishable-api-key')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  return res.status(200).end()
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  if (!LOYALTY_ENABLED) {
    return res.status(404).json({ message: 'Not found' })
  }
  // Medusa 2.0 request user object może zawierać customer_id
  const customerId = (req.user as any)?.customer_id || (req.user as any)?.id || req.headers['customer-id']
  if (!customerId) {
    return res.status(401).json({ message: 'Unauthenticated' })
  }
  const loyalty: LoyaltyService = req.scope.resolve('loyaltyService')
  const account = await loyalty.getAccount(customerId)
  return res.json({ points: account.balance || 0 })
}
