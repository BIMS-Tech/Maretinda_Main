import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createOrderFulfillmentWorkflow,
  createOrderShipmentWorkflow,
  markOrderFulfillmentAsDeliveredWorkflow,
} from "@medusajs/core-flows"

/**
 * Booking a courier and the order's own status used to be separate: a seller
 * could book Flying Tigers and the order still read "not fulfilled", so the
 * buyer never saw it shipped or delivered, could not ask for a return, and the
 * payout clock (which starts at delivery) never started. These keep the order
 * in step with the courier. Neither throws: the courier booking or update has
 * already happened and must not be undone by a status that could not be set.
 */

type Label = { tracking_number: string; tracking_url?: string | null; label_url?: string | null }

async function readOrder(container: any, orderId: string) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "status",
      "items.id",
      "items.quantity",
      "items.detail.fulfilled_quantity",
      "fulfillments.id",
      "fulfillments.shipped_at",
      "fulfillments.delivered_at",
      "fulfillments.canceled_at",
      "fulfillments.items.line_item_id",
      "fulfillments.items.quantity",
    ],
    filters: { id: orderId },
  })
  return data[0] as any
}

/** Packs whatever is still unpacked and marks the order shipped with the courier's tracking number. */
export async function markOrderShipped(container: any, orderId: string | null | undefined, label: Label): Promise<void> {
  if (!orderId) return
  try {
    let order = await readOrder(container, orderId)
    if (!order || order.status === "canceled") return

    const unpacked = (order.items ?? [])
      .map((i: any) => ({ id: i.id, quantity: Number(i.quantity) - Number(i.detail?.fulfilled_quantity ?? 0) }))
      .filter((i: any) => i.quantity > 0)
    if (unpacked.length) {
      await createOrderFulfillmentWorkflow(container).run({
        input: { order_id: orderId, items: unpacked, no_notification: true } as any,
      })
      order = await readOrder(container, orderId)
    }

    const labels = [{ tracking_number: label.tracking_number, tracking_url: label.tracking_url ?? "", label_url: label.label_url ?? label.tracking_url ?? "" }]
    for (const f of order.fulfillments ?? []) {
      if (f.canceled_at || f.shipped_at) continue
      const items = (f.items ?? []).map((i: any) => ({ id: i.line_item_id, quantity: Number(i.quantity) }))
      if (!items.length) continue
      await createOrderShipmentWorkflow(container).run({
        input: { order_id: orderId, fulfillment_id: f.id, items, labels } as any,
      })
    }
  } catch (error) {
    console.error(`[order-status] could not mark ${orderId} shipped:`, error instanceof Error ? error.message : error)
  }
}

/** Marks every shipped, undelivered parcel of the order delivered (the buyer is emailed). */
export async function markOrderDelivered(container: any, orderId: string | null | undefined): Promise<void> {
  if (!orderId) return
  try {
    const order = await readOrder(container, orderId)
    if (!order || order.status === "canceled") return
    for (const f of order.fulfillments ?? []) {
      if (f.canceled_at || f.delivered_at) continue
      await markOrderFulfillmentAsDeliveredWorkflow(container).run({
        input: { orderId, fulfillmentId: f.id },
      })
    }
  } catch (error) {
    console.error(`[order-status] could not mark ${orderId} delivered:`, error instanceof Error ? error.message : error)
  }
}
