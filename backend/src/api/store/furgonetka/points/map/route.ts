import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { POST as basePost } from '../route'

// Ten endpoint może mieć inny kształt odpowiedzi wymagany przez widget mapy
export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) { return basePost(req, res) }
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // Reużywamy logiki z /points i mapujemy ewentualnie pola jeśli widget wymaga innego schematu
  return basePost(req, res)
}
