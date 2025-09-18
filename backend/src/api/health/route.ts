import { MedusaRequest, MedusaResponse } from '@medusajs/framework'

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const origin = (req.headers.origin as string) || ''
  const allowed = (process.env.STORE_CORS || '').split(',').map(o=>o.trim()).filter(Boolean)
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else if (allowed.length) {
    res.setHeader('Access-Control-Allow-Origin', allowed[0])
  }
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-publishable-api-key')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  return res.status(200).json({ ok: true, time: new Date().toISOString(), origin, allowed })
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  const origin = (req.headers.origin as string) || ''
  const allowed = (process.env.STORE_CORS || '').split(',').map(o=>o.trim()).filter(Boolean)
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else if (allowed.length) {
    res.setHeader('Access-Control-Allow-Origin', allowed[0])
  }
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-publishable-api-key')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  return res.status(200).end()
}
