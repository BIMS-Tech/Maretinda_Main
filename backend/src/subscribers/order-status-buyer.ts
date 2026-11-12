import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sendNotice, storefrontUrl } from "../lib/notify"

type Stage = "shipped" | "delivered" | "canceled"

const STAGE_OF: Record<string, Stage> = {
  "shipment.created": "shipped",
  "delivery.created": "delivered",
  "order.canceled": "canceled",
}

/**
 * Tells the buyer when their order ships, arrives or is cancelled. Shipment
 * and delivery events carry the fulfillment's id; cancellation the order's.
 */
export default async function orderStatusBuyer({ event, container }: SubscriberArgs<{ id: string; no_notification?: boolean }>) {
  const stage = STAGE_OF[event.name]
  if (!stage || !event.data?.id || event.data.no_notification) return
  try {
    const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    let orderId = event.data.id
    let tracking: string[] = []
    if (stage !== "canceled") {
      const link = await pg("order_fulfillment").where("fulfillment_id", event.data.id).whereNull("deleted_at").first("order_id")
      if (!link) return
      orderId = link.order_id
      tracking = (await pg("fulfillment_label").where("fulfillment_id", event.data.id).whereNull("deleted_at").select("tracking_number"))
        .map((l: any) => l.tracking_number)
        .filter(Boolean)
    }

    const order = await pg("order").where("id", orderId).first("id", "display_id", "email", "customer_id")
    if (!order) return
    const customer = order.customer_id ? await pg("customer").where("id", order.customer_id).first("email", "first_name") : null
    const number = `#${order.display_id ?? order.id}`
    const copy: Record<Stage, { subject: string; heading: string; paragraphs: string[] }> = {
      shipped: {
        subject: `Your order ${number} is on its way`,
        heading: "Your order has shipped",
        paragraphs: [
          `Good news: order ${number} has been handed to the courier.`,
          ...(tracking.length ? [`Tracking number: ${tracking.join(", ")}`] : []),
        ],
      },
      delivered: {
        subject: `Your order ${number} was delivered`,
        heading: "Your order was delivered",
        paragraphs: [
          `Order ${number} has been marked as delivered. We hope you love it.`,
          "If something isn't right, you can request a return from your order page within 7 days.",
        ],
      },
      canceled: {
        subject: `Your order ${number} was cancelled`,
        heading: "Your order was cancelled",
        paragraphs: [
          `Order ${number} has been cancelled.`,
          "If you already paid online, our team will be in touch about your refund. Questions? Write to support@maretinda.com.",
        ],
      },
    }

    await sendNotice(container, {
      to: order.email || customer?.email,
      eyebrow: "Order update",
      user_name: customer?.first_name,
      button: { label: "View my order", url: `${storefrontUrl()}/user/orders/${order.id}` },
      ...copy[stage],
    })
  } catch (error) {
    console.error(`[order-status] ${event.name} email failed:`, error instanceof Error ? error.message : error)
  }
}

export const config: SubscriberConfig = {
  event: ["shipment.created", "delivery.created", "order.canceled"],
}
