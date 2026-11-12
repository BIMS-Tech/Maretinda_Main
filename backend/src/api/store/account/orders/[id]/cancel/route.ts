import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { cancelOrderWorkflow } from "@medusajs/core-flows"

/**
 * POST /store/account/orders/:id/cancel
 *
 * A buyer cancels their own order while the seller hasn't started on it.
 * Orders already paid online are refused here: cancelling one means sending
 * money back, and that goes through support until refunds are handled in-app.
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const order = await pg("order")
    .where({ id: req.params.id, customer_id: req.auth_context.actor_id })
    .whereNull("deleted_at")
    .first("id", "status", "canceled_at")
  if (!order) return res.status(404).json({ type: "not_found", message: "Order not found" })
  if (order.canceled_at || order.status === "canceled") {
    return res.status(409).json({ type: "not_allowed", code: "already_canceled", message: "This order is already cancelled." })
  }

  const started = await pg("order_fulfillment as of")
    .join("fulfillment as f", "f.id", "of.fulfillment_id")
    .where("of.order_id", order.id)
    .whereNull("of.deleted_at")
    .whereNull("f.canceled_at")
    .first("f.id")
  if (started) {
    return res.status(409).json({
      type: "not_allowed",
      code: "already_preparing",
      message: "The seller has already started preparing this order, so it can't be cancelled. You can request a return once it arrives.",
    })
  }

  const paid = await pg("order_payment_collection as opc")
    .join("payment_collection as pc", "pc.id", "opc.payment_collection_id")
    .where("opc.order_id", order.id)
    .whereNull("opc.deleted_at")
    .where("pc.captured_amount", ">", 0)
    .first("pc.id")
  if (paid) {
    return res.status(409).json({
      type: "not_allowed",
      code: "paid_online",
      message: "This order is already paid. To cancel it and get your money back, message the seller or write to support@maretinda.com.",
    })
  }

  await cancelOrderWorkflow(req.scope).run({ input: { order_id: order.id, canceled_by: req.auth_context.actor_id } })
  res.json({ id: order.id, canceled: true })
}
