import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { orderDeliveredAt, RETURN_WINDOW_DAYS } from "../../../../../../lib/return-window"

const COURIER: Record<string, string> = { flyingtigers: "Flying Tigers", ninjavan: "Ninja Van" }

/**
 * GET /store/account/orders/:id/tracking — the buyer's own parcel: tracking
 * numbers and links, the courier, when it was delivered, and until when a
 * return can be asked for.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const order = await pg("order")
    .where({ id: req.params.id, customer_id: req.auth_context.actor_id })
    .whereNull("deleted_at")
    .first("id")
  if (!order) return res.status(404).json({ type: "not_found", message: "Order not found" })

  const labels = await pg("order_fulfillment as of")
    .join("fulfillment as f", "f.id", "of.fulfillment_id")
    .join("fulfillment_label as l", "l.fulfillment_id", "f.id")
    .where("of.order_id", order.id)
    .whereNull("of.deleted_at")
    .whereNull("f.canceled_at")
    .whereNull("l.deleted_at")
    .select("l.tracking_number", "l.tracking_url", "f.shipped_at", "f.delivered_at")
  const booking = await pg("seller_shipping_order")
    .where("medusa_order_id", order.id)
    .whereNot("status", "cancelled")
    .whereNull("deleted_at")
    .orderBy("created_at", "desc")
    .first("provider", "tracking_number", "tracking_url", "status")

  const parcels = labels
    .filter((l: any) => l.tracking_number)
    .map((l: any) => ({ tracking_number: l.tracking_number, tracking_url: l.tracking_url || null, shipped_at: l.shipped_at, delivered_at: l.delivered_at }))
  if (booking?.tracking_number && !parcels.some((p: any) => p.tracking_number === booking.tracking_number)) {
    parcels.push({ tracking_number: booking.tracking_number, tracking_url: booking.tracking_url || null, shipped_at: null, delivered_at: null })
  }

  const delivered = await orderDeliveredAt(pg, order.id)
  res.json({
    courier: booking ? COURIER[booking.provider] ?? booking.provider : null,
    courier_status: booking?.status ?? null,
    parcels,
    delivered_at: delivered,
    return_until: delivered ? new Date(delivered.getTime() + RETURN_WINDOW_DAYS * 24 * 3600 * 1000) : null,
  })
}
