import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { addRefundPayout } from "../../../../../lib/cancellations"

/** POST /store/refunds/:id/payout  { payout } — where to send a refund the buyer didn't ask for (a shop's cancellation). */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const r = await addRefundPayout(req.scope, req.auth_context.actor_id, req.params.id, req.body)
  if ("error" in r) return res.status(r.status as number).json({ type: "not_allowed", message: r.error })
  res.json(r)
}
