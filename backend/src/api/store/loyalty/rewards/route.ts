import type { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { LOYALTY_ENABLED } from '../../../../lib/constants'

export const OPTIONS = async (_req: MedusaRequest, res: MedusaResponse) => {
  const origin = (_req.headers.origin as string) || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-publishable-api-key')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  return res.status(200).end()
}

export const GET = async (_req: MedusaRequest, res: MedusaResponse) => {
  if (!LOYALTY_ENABLED) {
    return res.status(200).json({ rewards: [] })
  }
  // Static rewards for now, can be fetched from DB later
  const rewards = [
    { id: 'discount-50', title: '50 PLN Zniżka', description: 'Zniżka 50 PLN na następne zakupy', points_cost: 500, category: 'discount', discount_amount: 50, is_active: true },
    { id: 'free-shipping', title: 'Darmowa dostawa', description: 'Bezpłatna dostawa na następne zamówienie', points_cost: 300, category: 'shipping', is_active: true },
    { id: 'discount-15', title: '15% Zniżka Premium', description: '15% zniżki na produkty premium', points_cost: 1000, category: 'discount', discount_percentage: 15, is_active: true },
  ]
  return res.json({ rewards })
}
