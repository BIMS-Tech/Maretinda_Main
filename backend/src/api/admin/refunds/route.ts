import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { refundView } from "../../../lib/return-case-view"

/** GET /admin/refunds?status=due|paid — what accounting has to send, soonest first, and what was sent. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const status = req.query.status === "paid" ? "paid" : "due"
  const rows = await pg("buyer_refund as r")
    .leftJoin("order as o", "o.id", "r.order_id")
    .leftJoin("seller as s", "s.id", "r.seller_id")
    .leftJoin("customer as c", "c.id", "r.customer_id")
    .where("r.status", status)
    .orderBy(status === "due" ? "r.due_by" : "r.paid_at", status === "due" ? "asc" : "desc")
    .limit(Math.min(Number(req.query.limit) || 100, 200))
    .select("r.*", "o.display_id", "s.name as seller_name", "c.first_name", "c.last_name", "c.email")
  res.json({
    refunds: rows.map((r: any) => ({
      ...refundView(r, "admin"),
      order_id: r.order_id,
      request_id: r.request_id,
      display_id: r.display_id,
      seller_name: r.seller_name,
      buyer: [r.first_name, r.last_name].filter(Boolean).join(" ") || r.email,
      payment: r.payment,
    })),
  })
}
