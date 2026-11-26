import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { markRefundPaid, parsePaid } from "../../../../../lib/return-cases"

/** POST /admin/refunds/:id/paid  { reference, method, amount, paid_at, receipt_id } — log the transfer and its proof. */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const input = parsePaid(req.body)
  if (typeof input === "string") return res.status(400).json({ type: "invalid_data", message: input })
  const r = await markRefundPaid(req.scope, req.params.id, input, req.auth_context.actor_id)
  if ("error" in r) return res.status(r.status as number).json({ type: "not_allowed", message: r.error })
  res.json(r)
}
