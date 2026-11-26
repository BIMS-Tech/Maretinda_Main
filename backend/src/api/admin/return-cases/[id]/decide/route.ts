import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { adminDecides } from "../../../../../lib/return-cases"

/** POST /admin/return-cases/:id/decide  { decision: refund | reject, fault, resolution, note } — the binding decision. */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const r = await adminDecides(req.scope, req.params.id, (req.body ?? {}) as any, req.auth_context.actor_id)
  if ("error" in r) return res.status(r.status).json({ type: "not_allowed", message: r.error })
  res.json(r)
}
