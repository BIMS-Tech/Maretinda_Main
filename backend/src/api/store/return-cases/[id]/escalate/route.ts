import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { buyerEscalates } from "../../../../../lib/return-cases"

/** POST /store/return-cases/:id/escalate  { note } — after the seller disputed it, ask Maretinda to decide. */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const r = await buyerEscalates(req.scope, req.auth_context.actor_id, req.params.id, (req.body ?? {}) as any)
  if ("error" in r) return res.status(r.status as number).json({ type: "not_allowed", message: r.error })
  res.json(r)
}
