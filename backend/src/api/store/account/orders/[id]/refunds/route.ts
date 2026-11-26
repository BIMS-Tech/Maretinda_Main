import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { refundView } from "../../../../../../lib/return-case-view"

/** GET /store/account/orders/:id/refunds — refunds, returns and a cancellation request on the buyer's order. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const order = await pg("order").where({ id: req.params.id, customer_id: req.auth_context.actor_id }).first("id")
  if (!order) return res.status(404).json({ message: "Order not found" })
  const refunds = await pg("buyer_refund").where("order_id", order.id).whereNot("status", "void").orderBy("created_at", "desc")
  const returns = await pg("return_case").where("order_id", order.id).orderBy("created_at", "desc").select("request_id", "stage")
  const cancellation = await pg("cancellation_request").where("order_id", order.id).orderBy("created_at", "desc").first("id", "status", "decision_note", "created_at")
  res.json({ refunds: refunds.map((r: any) => refundView(r, "buyer")), returns, cancellation: cancellation ?? null })
}
