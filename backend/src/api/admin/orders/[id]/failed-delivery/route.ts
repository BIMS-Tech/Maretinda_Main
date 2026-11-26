import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { recordFailedDelivery } from "../../../../../lib/cancellations"

/**
 * POST /admin/orders/:id/failed-delivery  { rts_fee } — the courier returned it
 * because of the buyer (wrong address, unreachable, refused). Prepaid orders
 * are refunded less shipping and fees; COD repeat offenders lose COD.
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const r = await recordFailedDelivery(req.scope, req.params.id, req.body, req.auth_context.actor_id)
  if ("error" in r) return res.status(r.status as number).json({ type: "not_allowed", message: r.error })
  res.json(r)
}
