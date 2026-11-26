import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { requestCancellation } from "../../../lib/cancellations"

/** POST /store/cancellation-requests  { order_id, reason, payout } — cancel a paid order before it ships. */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const r = await requestCancellation(req.scope, req.auth_context.actor_id, req.body)
  if ("error" in r) return res.status(r.status as number).json({ type: "not_allowed", message: r.error })
  res.status(201).json(r)
}
