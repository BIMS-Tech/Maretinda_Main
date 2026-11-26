import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/** GET /admin/cancellation-requests?status=pending — buyers asking to cancel paid orders. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const status = ["pending", "approved", "rejected"].includes(String(req.query.status)) ? String(req.query.status) : "pending"
  const rows = await pg("cancellation_request as r")
    .leftJoin("order as o", "o.id", "r.order_id")
    .leftJoin("seller as s", "s.id", "r.seller_id")
    .leftJoin("customer as c", "c.id", "r.customer_id")
    .where("r.status", status)
    .orderBy("r.created_at", "desc")
    .limit(100)
    .select("r.id", "r.order_id", "o.display_id", "r.reason", "r.status", "r.payout_label", "r.decision_note", "r.created_at", "s.name as seller_name", "c.first_name", "c.last_name", "c.email")
  res.json({ cancellation_requests: rows })
}
