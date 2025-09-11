import { MedusaRequest, MedusaResponse } from '@medusajs/framework'

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  return res.json({ status: 'ok', time: new Date().toISOString() })
}
