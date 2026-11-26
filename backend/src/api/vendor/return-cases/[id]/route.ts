import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { caseView } from "../../../../lib/return-case-view"
import { getCase } from "../../../../lib/return-cases"
import { sellerIdOfMember } from "../../../../lib/seller-ownership"

/** GET /vendor/return-cases/:id — one of the shop's returns, with the buyer's proof. No account details. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const sellerId = await sellerIdOfMember(pg, req.auth_context?.actor_id)
  const c = await getCase(pg, req.params.id)
  if (!c || !sellerId || c.seller_id !== sellerId) return res.status(404).json({ message: "Return request not found" })
  res.json({ return_case: await caseView(req.scope, c, "seller") })
}
