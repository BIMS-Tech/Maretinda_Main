import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sellerReceived } from "../../../../../lib/return-cases"
import { sellerIdOfMember } from "../../../../../lib/seller-ownership"

/** POST /vendor/return-cases/:id/received  { outcome?: ok | dispute, note, evidence } — the parcel came back. */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const sellerId = await sellerIdOfMember(pg, req.auth_context?.actor_id)
  if (!sellerId) return res.status(401).json({ message: "Unauthorized" })
  const r = await sellerReceived(req.scope, sellerId, req.params.id, (req.body ?? {}) as any)
  if ("error" in r) return res.status(r.status).json({ type: "not_allowed", message: r.error })
  res.json(r)
}
