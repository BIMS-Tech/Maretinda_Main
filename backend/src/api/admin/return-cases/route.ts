import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { STAGE_LABELS } from "../../../lib/return-cases"

/** GET /admin/return-cases?stage= — returns across the marketplace, escalated first. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const q = pg("return_case as c")
    .leftJoin("order as o", "o.id", "c.order_id")
    .leftJoin("seller as s", "s.id", "c.seller_id")
    .leftJoin("customer as cu", "cu.id", "c.customer_id")
    .select("c.request_id", "c.order_id", "o.display_id", "c.stage", "c.payment", "c.respond_by", "c.decide_by", "c.escalated_by", "c.created_at", "s.name as seller_name", "cu.first_name", "cu.last_name", "cu.email")
    .orderByRaw("CASE WHEN c.stage = 'escalated' THEN 0 WHEN c.stage = 'refund_due' THEN 1 ELSE 2 END, c.created_at DESC")
    .limit(Math.min(Number(req.query.limit) || 50, 200))
    .offset(Number(req.query.offset) || 0)
  if (typeof req.query.stage === "string" && req.query.stage in STAGE_LABELS) q.where("c.stage", req.query.stage)
  const rows = await q
  res.json({ return_cases: rows.map((r: any) => ({ ...r, stage_label: STAGE_LABELS[r.stage as keyof typeof STAGE_LABELS] })) })
}
