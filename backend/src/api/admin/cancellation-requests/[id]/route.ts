import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { decideCancellation } from "../../../../lib/cancellations"

/** POST /admin/cancellation-requests/:id  { decision: approve | reject, note } */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const r = await decideCancellation(req.scope, req.params.id, req.body, req.auth_context.actor_id)
  if ("error" in r) return res.status(r.status as number).json({ type: "not_allowed", message: r.error })
  res.json(r)
}
