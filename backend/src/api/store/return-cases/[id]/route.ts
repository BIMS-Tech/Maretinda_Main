import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { caseView } from "../../../../lib/return-case-view"
import { getCase } from "../../../../lib/return-cases"

/** GET /store/return-cases/:id — the buyer's own return: where it stands, what to do next, the refund. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const c = await getCase(pg, req.params.id)
  if (!c || c.customer_id !== req.auth_context.actor_id) return res.status(404).json({ message: "Return request not found" })
  res.json({ return_case: await caseView(req.scope, c, "buyer") })
}
