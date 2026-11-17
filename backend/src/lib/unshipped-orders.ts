/**
 * Orders a shop hasn't shipped: not cancelled, nothing handed to a courier.
 * Sellers are reminded once on day 2 and once on day 5 after the order.
 */
export const REMINDER_DAYS = [2, 5]

/** Orders placed between `days` and `days + 1` days ago that still have no shipped parcel, grouped by shop. */
export async function unshippedOrders(pg: any, days: number, now = new Date()) {
  const from = new Date(now.getTime() - (days + 1) * 86_400_000)
  const to = new Date(now.getTime() - days * 86_400_000)
  const rows = await pg("order as o")
    .join("seller_seller_order_order as so", function (this: any) {
      this.on("so.order_id", "o.id").andOnNull("so.deleted_at")
    })
    .join("seller as s", "s.id", "so.seller_id")
    .whereNull("o.deleted_at")
    .whereNull("o.canceled_at")
    .whereNotIn("o.status", ["canceled", "completed", "archived", "draft"])
    .where("o.created_at", ">=", from)
    .where("o.created_at", "<", to)
    .whereNotExists(
      pg("order_fulfillment as of")
        .join("fulfillment as f", "f.id", "of.fulfillment_id")
        .whereRaw("of.order_id = o.id")
        .whereNull("of.deleted_at")
        .whereNull("f.canceled_at")
        .whereNotNull("f.shipped_at")
    )
    .select("o.id", "o.display_id", "o.created_at", "s.id as seller_id", "s.name as seller_name", "s.email as seller_email")
  const bySeller = new Map<string, { name: string; email: string | null; orders: { id: string; display_id: number }[] }>()
  for (const r of rows) {
    const entry = bySeller.get(r.seller_id) ?? { name: r.seller_name as string, email: r.seller_email as string | null, orders: [] as { id: string; display_id: number }[] }
    entry.orders.push({ id: r.id, display_id: r.display_id })
    bySeller.set(r.seller_id, entry)
  }
  return bySeller
}
