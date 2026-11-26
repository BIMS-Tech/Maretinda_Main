import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { refundForCanceledOrder } from "../lib/cancellations"

/** A paid-online order that gets cancelled, by anyone, gets a refund for accounting to send (lib/cancellations). */
export default async function orderCanceledRefund({ event, container }: SubscriberArgs<{ id: string }>) {
  if (!event.data?.id) return
  try {
    await refundForCanceledOrder(container, event.data.id)
  } catch (error) {
    console.error("[order-canceled-refund] failed:", error instanceof Error ? error.message : error)
  }
}

export const config: SubscriberConfig = { event: "order.canceled" }
