import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { mayOpenEvidence, sendEvidence } from "../../../../lib/return-evidence"
import { sellerIdOfMember } from "../../../../lib/seller-ownership"

/** GET /vendor/return-evidence/:id — proof on the shop's own returns. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const sellerId = await sellerIdOfMember(pg, req.auth_context?.actor_id)
  if (!sellerId || !(await mayOpenEvidence(pg, req.params.id, { type: "seller", id: sellerId }))) return res.status(404).json({ message: "Not found" })
  await sendEvidence(pg, req.params.id, req, res)
}
