import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { alertLowStock } from "../lib/low-stock"
import { placedOrderIds, type OrderPlacedData } from "../lib/order-placed"

/** A placed order uses up stock: tell the shop when an item runs low or out. */
export default async function lowStockAlert({ event: { data }, container }: SubscriberArgs<OrderPlacedData>) {
  try {
    const sent = await alertLowStock(container, placedOrderIds(data))
    if (sent.length) console.log(`[low-stock] warned about ${sent.length} variant(s)`)
  } catch (error) {
    console.error("[low-stock] failed:", error instanceof Error ? error.message : error)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
