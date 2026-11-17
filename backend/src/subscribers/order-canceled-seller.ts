import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sellerPanelUrl, sendNotice } from "../lib/notify"

/**
 * Tells the shop an order was cancelled, so it isn't packed and shipped
 * anyway. A courier already booked for it has to be cancelled by the seller.
 */
export default async function orderCanceledSeller({ event, container }: SubscriberArgs<{ id: string }>) {
  const orderId = event.data?.id
  if (!orderId) return
  try {
    const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const order = await pg("order").where("id", orderId).first("id", "display_id")
    const link = await pg("seller_seller_order_order").where("order_id", orderId).whereNull("deleted_at").first("seller_id")
    if (!order || !link) return
    const seller = await pg("seller").where("id", link.seller_id).first("name", "email")
    const booking = await pg("seller_shipping_order")
      .where("medusa_order_id", orderId)
      .whereNotIn("status", ["cancelled", "delivered"])
      .whereNull("deleted_at")
      .first("tracking_number")
    const number = `#${order.display_id ?? order.id}`
    await sendNotice(container, {
      to: seller?.email,
      subject: `Order ${number} was cancelled`,
      eyebrow: "Order update",
      heading: "An order was cancelled",
      user_name: seller?.name,
      paragraphs: [
        `Order ${number} has been cancelled. Please don't ship it.`,
        ...(booking
          ? [`A courier is booked for it (${booking.tracking_number}). Cancel the booking from the order page in your seller panel so it isn't picked up.`]
          : []),
      ],
      button: { label: "Open the order", url: `${sellerPanelUrl()}/orders/${order.id}` },
    })
  } catch (error) {
    console.error("[order-canceled-seller] email failed:", error instanceof Error ? error.message : error)
  }
}

export const config: SubscriberConfig = {
  event: "order.canceled",
}
