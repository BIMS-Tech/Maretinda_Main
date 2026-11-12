import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { listCodRemittances } from "../../../lib/cod-remittance"
import { sellerIdOfMember } from "../../../lib/seller-ownership"

/** GET /vendor/cod-remittances — the shop's COD cash: still with the courier, due from Maretinda, or paid. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const sellerId = await sellerIdOfMember(pg, req.auth_context?.actor_id)
  if (!sellerId) return res.status(401).json({ message: "Unauthorized" })
  const q = req.query as Record<string, string>
  const limit = Number(q.limit) || 50
  const offset = Number(q.offset) || 0
  res.json({ ...(await listCodRemittances(pg, { seller_id: sellerId, state: q.state || undefined }, limit, offset)), limit, offset })
}
