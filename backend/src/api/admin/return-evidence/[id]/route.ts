import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { mayOpenEvidence, sendEvidence } from "../../../../lib/return-evidence"

/** GET /admin/return-evidence/:id */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  if (!(await mayOpenEvidence(pg, req.params.id, { type: "admin", id: req.auth_context.actor_id }))) return res.status(404).json({ message: "Not found" })
  await sendEvidence(pg, req.params.id, req, res)
}
