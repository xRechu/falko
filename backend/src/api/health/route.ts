import { MedusaRequest, MedusaResponse } from '@medusajs/framework'

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  const origins = process.env.STORE_CORS?.split(',').map(o=>o.trim()).filter(Boolean)
  res.setHeader('Access-Control-Allow-Origin', origins?.[0] || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-publishable-api-key')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  return res.status(200).json({ ok: true, time: new Date().toISOString() })
}

export async function OPTIONS(_req: MedusaRequest, res: MedusaResponse) {
  const origins = process.env.STORE_CORS?.split(',').map(o=>o.trim()).filter(Boolean)
  res.setHeader('Access-Control-Allow-Origin', origins?.[0] || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-publishable-api-key')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  return res.status(200).end()
}
