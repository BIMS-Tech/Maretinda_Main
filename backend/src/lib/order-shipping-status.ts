import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  cancelOrderFulfillmentWorkflow,
  createOrderFulfillmentWorkflow,
  createOrderShipmentWorkflow,
  markOrderFulfillmentAsDeliveredWorkflow,
} from "@medusajs/core-flows"

/**
 * Keeps the order's own status in step with the courier booked through
 * Maretinda. Before this, booking a courier left the order "not fulfilled", so
 * the buyer never saw it ship or arrive, could not ask for a return, and the
 * payout clock (which starts at delivery) never started.
 *
 *   booked          -> packed (a fulfilment), no email yet
 *   picked up       -> shipped, with the tracking number; the buyer is emailed
 *   delivered       -> delivered; the buyer is emailed, return and payout clocks start
 *   booking cancelled before pickup -> unpacked again
 *
 * None of these throw: the courier has already acted, and a status that could
 * not be set must not undo it. Failures are logged.
 */

/** Courier statuses that mean the parcel has left the seller. */
export const SHIPPED_STATUSES = ["picked_up", "in_transit", "out_for_delivery", "delivered"]

type Label = { tracking_number: string; tracking_url?: string | null }

async function readOrder(container: any, orderId: string) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "status",
      "items.id",
      // An order line's quantity is on its detail; items.quantity comes back empty
      "items.detail.quantity",
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

/** Workflow failures are not always Error instances; get a readable reason either way. */
const reason = (error: any): string =>
  error?.message ??
  (Array.isArray(error) ? error.map((e) => e?.error?.message ?? e?.message).filter(Boolean).join("; ") : "") ??
  String(error)

const log = (what: string, orderId: string, error: unknown) =>
  console.error(`[order-status] could not mark ${orderId} ${what}:`, reason(error) || error)

/** Packs whatever part of the order is not packed yet. */
async function pack(container: any, orderId: string) {
  const order = await readOrder(container, orderId)
  if (!order || order.status === "canceled") return null
  const unpacked = (order.items ?? [])
    .map((i: any) => ({ id: i.id, quantity: Number(i.detail?.quantity ?? i.quantity ?? 0) - Number(i.detail?.fulfilled_quantity ?? 0) }))
    .filter((i: any) => i.quantity > 0)
  if (!unpacked.length) return order
  await createOrderFulfillmentWorkflow(container).run({
    input: { order_id: orderId, items: unpacked, no_notification: true } as any,
  })
  return readOrder(container, orderId)
}

/**
 * The courier is booked: the order is packed and waiting for pickup. Returns
 * why it could not be packed, for the seller to fix (e.g. no stock recorded
 * at the warehouse), or null.
 */
export async function markOrderPacked(container: any, orderId: string | null | undefined): Promise<string | null> {
  if (!orderId) return null
  try {
    await pack(container, orderId)
    return null
  } catch (error) {
    log("packed", orderId, error)
    return reason(error) || "unknown error"
  }
}

/** The courier has the parcel: the order is shipped, with its tracking number. */
export async function markOrderShipped(container: any, orderId: string | null | undefined, label: Label): Promise<void> {
  if (!orderId) return
  try {
    const order = await pack(container, orderId)
    if (!order) return
    const labels = [{ tracking_number: label.tracking_number, tracking_url: label.tracking_url ?? "", label_url: label.tracking_url ?? "" }]
    for (const f of order.fulfillments ?? []) {
      if (f.canceled_at || f.shipped_at) continue
      const items = (f.items ?? []).map((i: any) => ({ id: i.line_item_id, quantity: Number(i.quantity) }))
      if (!items.length) continue
      await createOrderShipmentWorkflow(container).run({
        input: { order_id: orderId, fulfillment_id: f.id, items, labels } as any,
      })
    }
  } catch (error) {
    log("shipped", orderId, error)
  }
}

/** The courier delivered the parcel. */
export async function markOrderDelivered(container: any, orderId: string | null | undefined, label: Label): Promise<void> {
  if (!orderId) return
  // A parcel can be delivered without a pickup update ever arriving
  await markOrderShipped(container, orderId, label)
  try {
    const order = await readOrder(container, orderId)
    if (!order || order.status === "canceled") return
    for (const f of order.fulfillments ?? []) {
      if (f.canceled_at || f.delivered_at) continue
      await markOrderFulfillmentAsDeliveredWorkflow(container).run({ input: { orderId, fulfillmentId: f.id } })
    }
  } catch (error) {
    log("delivered", orderId, error)
  }
}

/** The booking was cancelled before pickup: the order goes back to waiting to ship. */
export async function markOrderUnpacked(container: any, orderId: string | null | undefined): Promise<void> {
  if (!orderId) return
  try {
    const order = await readOrder(container, orderId)
    if (!order) return
    for (const f of order.fulfillments ?? []) {
      if (f.canceled_at || f.shipped_at) continue
      await cancelOrderFulfillmentWorkflow(container).run({
        input: { order_id: orderId, fulfillment_id: f.id, no_notification: true } as any,
      })
    }
  } catch (error) {
    log("unpacked", orderId, error)
  }
}

/** Applies a courier status change to the order. */
export async function followCourier(
  container: any,
  booking: { medusa_order_id?: string | null; tracking_number?: string | null; tracking_url?: string | null },
  previous: string | null | undefined,
  next: string | null | undefined
): Promise<void> {
  if (!booking.medusa_order_id || !booking.tracking_number || !next || next === previous) return
  const label = { tracking_number: booking.tracking_number, tracking_url: booking.tracking_url }
  if (next === "delivered") await markOrderDelivered(container, booking.medusa_order_id, label)
  else if (SHIPPED_STATUSES.includes(next) && !SHIPPED_STATUSES.includes(previous ?? "")) {
    await markOrderShipped(container, booking.medusa_order_id, label)
  }
}
