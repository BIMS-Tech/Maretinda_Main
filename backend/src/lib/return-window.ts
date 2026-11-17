import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/** Days after delivery a buyer may ask to return an order (help center, order page, terms). */
export const RETURN_WINDOW_DAYS = 7

const DAY = 24 * 60 * 60 * 1000

const fmt = (d: Date) =>
  d.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Manila" })

type OrderFacts = {
  canceled: boolean
  deliveredAt: Date | null
  /** Ordered quantity per line item id. */
  quantities: Record<string, number>
}

/**
 * Whether a buyer may ask to return these items now. Returns the message to
 * show them, or null when the request may go ahead. Mercur checks that the
 * order is theirs and the items belong to it, but not when, or how many.
 */
export function returnRefusal(
  order: OrderFacts,
  items: { line_item_id?: string; quantity?: unknown }[],
  now = new Date()
): string | null {
  if (order.canceled) return "This order was cancelled, so there is nothing to return."
  if (!order.deliveredAt) return "You can ask for a return once the order has been delivered."
  const closes = new Date(order.deliveredAt.getTime() + RETURN_WINDOW_DAYS * DAY)
  if (now > closes) return `The ${RETURN_WINDOW_DAYS}-day return period for this order ended on ${fmt(closes)}.`
  if (!Array.isArray(items) || items.length === 0) return "Choose at least one item to return."
  for (const item of items) {
    const ordered = order.quantities[String(item.line_item_id)]
    const qty = Number(item.quantity)
    if (ordered === undefined) return "One of the items is not part of this order."
    if (!Number.isInteger(qty) || qty < 1 || qty > ordered) {
      return `You can return between 1 and ${ordered} of that item.`
    }
  }
  return null
}

/** When the order's parcel was delivered: the earliest delivered fulfilment. */
export async function orderDeliveredAt(pg: any, orderId: string): Promise<Date | null> {
  const row = await pg("order_fulfillment as of")
    .join("fulfillment as f", "f.id", "of.fulfillment_id")
    .where("of.order_id", orderId)
    .whereNull("of.deleted_at")
    .whereNull("f.deleted_at")
    .whereNull("f.canceled_at")
    .min("f.delivered_at as delivered_at")
    .first()
  return row?.delivered_at ? new Date(row.delivered_at) : null
}

/** Refuses a return request that is too early, too late, or for more than was bought. */
export async function guardReturnRequest(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  try {
    const body = (req.body ?? {}) as { order_id?: string; line_items?: { line_item_id?: string; quantity?: unknown }[] }
    if (!body.order_id) return next()
    const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const order = await pg("order").where("id", body.order_id).whereNull("deleted_at").first("id", "status", "canceled_at")
    // Unknown orders and other buyers' orders are refused by Mercur's own check
    if (!order) return next()
    const items = await pg("order_item as oi")
      .join("order_line_item as li", "li.id", "oi.item_id")
      .where("oi.order_id", order.id)
      .whereNull("oi.deleted_at")
      .select("li.id", "oi.quantity", "oi.version")
      .orderBy("oi.version", "desc")
    const quantities: Record<string, number> = {}
    for (const i of items) if (quantities[i.id] === undefined) quantities[i.id] = Number(i.quantity)
    const refusal = returnRefusal(
      {
        canceled: order.status === "canceled" || !!order.canceled_at,
        deliveredAt: await orderDeliveredAt(pg, order.id),
        quantities,
      },
      body.line_items ?? []
    )
    if (refusal) return res.status(400).json({ type: "not_allowed", message: refusal })
    next()
  } catch (error) {
    next(error)
  }
}
