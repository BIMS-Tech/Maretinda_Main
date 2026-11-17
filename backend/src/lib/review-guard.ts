import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { orderDeliveredAt } from "./return-window"

/**
 * Only a buyer who received the item reviews it. Mercur checks that the order
 * is the buyer's and that they haven't reviewed it twice, but not that the order
 * arrived, or that the product or shop reviewed was part of it: one ₱1
 * cancelled order could otherwise review every product and shop on the site.
 */
export async function guardReview(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  try {
    const body = (req.body ?? {}) as { order_id?: string; reference?: string; reference_id?: string }
    if (!body.order_id) return next()
    const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const order = await pg("order").where("id", body.order_id).whereNull("deleted_at").first("id", "status", "canceled_at")
    // Unknown orders and other buyers' orders are refused by Mercur's own check
    if (!order) return next()
    const refuse = (message: string) => res.status(400).json({ type: "not_allowed", message })

    if (order.status === "canceled" || order.canceled_at) return refuse("You can't review a cancelled order.")
    if (!(await orderDeliveredAt(pg, order.id))) return refuse("You can review your order once it has been delivered.")

    if (body.reference === "product") {
      const bought = await pg("order_item as oi")
        .join("order_line_item as li", "li.id", "oi.item_id")
        .where("oi.order_id", order.id)
        .where("li.product_id", body.reference_id ?? "")
        .first("li.id")
      if (!bought) return refuse("You can only review products from this order.")
    } else if (body.reference === "seller") {
      const sold = await pg("seller_seller_order_order")
        .where({ order_id: order.id, seller_id: body.reference_id ?? "" })
        .whereNull("deleted_at")
        .first("id")
      if (!sold) return refuse("You can only review the shop this order came from.")
    }
    next()
  } catch (error) {
    next(error)
  }
}
