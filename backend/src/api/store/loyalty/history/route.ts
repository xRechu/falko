import type { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import LoyaltyService from '../../../../modules/loyalty/service'
import { LOYALTY_ENABLED } from '../../../../lib/constants'

export const OPTIONS = async (_req: MedusaRequest, res: MedusaResponse) => {
  const origin = (_req.headers.origin as string) || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-publishable-api-key')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  return res.status(200).end()
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  if (!LOYALTY_ENABLED) {
    return res.status(200).json({ transactions: [] })
  }
  const customerId = (req.user as any)?.customer_id || (req.user as any)?.id
  if (!customerId) {
    return res.status(401).json({ message: 'Unauthenticated' })
  }
  const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 200)
  const loyalty: LoyaltyService = req.scope.resolve('loyaltyService')
  const cx = (loyalty as any).manager.getConnection()
  const rows = await cx.execute(
    `select id, customer_id, type, points, coalesce(order_id,'') as order_id, coalesce(note,'') as note, created_at
     from loyalty_transactions where customer_id = ? order by created_at desc limit ?`,
    [customerId, limit]
  )
  const transactions = rows.map((r: any) => ({
    id: r.id,
    type: r.type === 'earn' ? 'earned' : 'spent',
    points: Number(r.points) || 0,
    description: r.note || (r.type === 'earn' ? 'Punkty za zamówienie' : 'Wykorzystanie punktów'),
    order_id: r.order_id || undefined,
    created_at: new Date(r.created_at).toISOString(),
  }))
  return res.json({ transactions })
}
