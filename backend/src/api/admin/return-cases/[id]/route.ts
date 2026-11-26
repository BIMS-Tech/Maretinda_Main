import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { caseView } from "../../../../lib/return-case-view"
import { getCase } from "../../../../lib/return-cases"

/** GET /admin/return-cases/:id — everything, including where the buyer wants the refund sent. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const c = await getCase(pg, req.params.id)
  if (!c) return res.status(404).json({ message: "Return request not found" })
  const seller = await pg("seller").where("id", c.seller_id).first("name", "email")
  res.json({ return_case: { ...(await caseView(req.scope, c, "admin")), seller } })
}
