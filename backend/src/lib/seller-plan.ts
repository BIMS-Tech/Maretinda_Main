/**
 * A seller sells only while on a plan: paid, or the free first month. Without
 * one they can still look around their panel, pay for a plan, keep their
 * profile and get paid, and finish the orders buyers already placed. Anything
 * that changes what the shop sells or where it ships needs a plan.
 */
const WORKS_WITHOUT_PLAN =
  /^\/vendor\/(subscription|sellers|orders|returns|shipping-orders|chat|talkjs|payouts|payout-account|invites\/accept|me|notifications)(\/|$)/

export const vendorRequestNeedsPlan = (method: string, path: string) =>
  method.toUpperCase() !== "GET" && !WORKS_WITHOUT_PLAN.test(path)

export const PLAN_REQUIRED_MESSAGE =
  "Your shop needs an active plan to make changes. Choose a plan under Subscription to keep selling."

/** The ids of the given sellers that have no plan running right now. */
export async function sellersWithoutPlan(pg: any, sellerIds: string[]): Promise<string[]> {
  const ids = [...new Set(sellerIds.filter(Boolean))]
  if (!ids.length) return []
  const onPlan = await pg("seller_subscription")
    .whereIn("seller_id", ids)
    .where("status", "active")
    .where("end_date", ">", new Date())
    .distinct("seller_id")
  const active = new Set(onPlan.map((r: any) => r.seller_id))
  return ids.filter((id) => !active.has(id))
}

/**
 * Handles of the live shops with products on the shelf but no plan running.
 * The storefront leaves them out of listings and search.
 */
export async function closedShopHandles(pg: any): Promise<string[]> {
  const rows = await pg("seller")
    .whereNull("seller.deleted_at")
    .whereExists(
      pg("seller_seller_product_product")
        .whereRaw("seller_seller_product_product.seller_id = seller.id")
        .whereNull("seller_seller_product_product.deleted_at")
    )
    .whereNotExists(
      pg("seller_subscription")
        .whereRaw("seller_subscription.seller_id = seller.id")
        .where("seller_subscription.status", "active")
        .where("seller_subscription.end_date", ">", new Date())
    )
    .select("handle")
  return rows.map((r: any) => r.handle)
}

export const closedShopMessage = (names: string[]) =>
  names.length === 1
    ? `${names[0]} isn't taking orders right now. Remove its items to check out.`
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} aren't taking orders right now. Remove their items to check out.`

/** Names of the shops selling these products that have no plan running. */
export async function closedShopsSelling(pg: any, productIds: string[]): Promise<string[]> {
  if (!productIds.length) return []
  const links = await pg("seller_seller_product_product")
    .whereIn("product_id", productIds)
    .whereNull("deleted_at")
    .select("seller_id")
  const closed = await sellersWithoutPlan(pg, links.map((l: any) => l.seller_id))
  if (!closed.length) return []
  const sellers = await pg("seller").whereIn("id", closed).select("name")
  return sellers.map((s: any) => s.name)
}
