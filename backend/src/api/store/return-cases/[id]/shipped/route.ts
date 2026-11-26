import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { buyerShipped } from "../../../../../lib/return-cases"

/** POST /store/return-cases/:id/shipped  { courier, tracking_number, fee } */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const r = await buyerShipped(req.scope, req.auth_context.actor_id, req.params.id, (req.body ?? {}) as any)
  if ("error" in r) return res.status(r.status).json({ type: "not_allowed", message: r.error })
  res.json(r)
}
