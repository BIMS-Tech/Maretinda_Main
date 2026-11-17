import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sellerPanelUrl, sendNotice } from "../lib/notify"
import { REMINDER_DAYS, unshippedOrders } from "../lib/unshipped-orders"

export const config = {
  name: "unshipped-order-reminder",
  schedule: "0 1 * * *", // daily, 09:00 Manila
}

/** Reminds shops about orders they haven't shipped, on day 2 and day 5. */
export default async function unshippedOrderReminder(container: MedusaContainer): Promise<void> {
  try {
    const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    for (const days of REMINDER_DAYS) {
      for (const [, shop] of await unshippedOrders(pg, days)) {
        const numbers = shop.orders.map((o) => `#${o.display_id}`).join(", ")
        await sendNotice(container, {
          to: shop.email,
          subject: shop.orders.length === 1 ? `Order ${numbers} is waiting to ship` : `${shop.orders.length} orders are waiting to ship`,
          eyebrow: "Orders to ship",
          heading: days >= 5 ? "Your buyers are still waiting" : "Orders waiting to ship",
          user_name: shop.name,
          paragraphs: [
            `${shop.orders.length === 1 ? "This order was" : "These orders were"} placed ${days} days ago and ${shop.orders.length === 1 ? "hasn't" : "haven't"} shipped yet: ${numbers}.`,
            "Book the courier from the order page, or mark the order shipped with your own courier's tracking number. If you can't fulfil an order, cancel it and message the buyer.",
          ],
          button: { label: "Open your orders", url: `${sellerPanelUrl()}/orders` },
        })
      }
    }
  } catch (error) {
    console.error("[unshipped-order-reminder] Error:", error)
  }
}
