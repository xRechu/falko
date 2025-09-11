import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { furgonetkaOAuth } from 'modules/furgonetka/services/oauth'

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const ok = await furgonetkaOAuth.testConnection()
  return res.json({ ok, timestamp: new Date().toISOString() })
}
