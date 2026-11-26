import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sellerResponds } from "../../../../../lib/return-cases"
import { sellerIdOfMember } from "../../../../../lib/seller-ownership"

/** POST /vendor/return-cases/:id/respond  { action: accept_return | refund_only | dispute, note, evidence, instructions } */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const sellerId = await sellerIdOfMember(pg, req.auth_context?.actor_id)
  if (!sellerId) return res.status(401).json({ message: "Unauthorized" })
  const r = await sellerResponds(req.scope, sellerId, req.params.id, (req.body ?? {}) as any, req.auth_context.actor_id)
  if ("error" in r) return res.status(r.status).json({ type: "not_allowed", message: r.error })
  res.json(r)
}
