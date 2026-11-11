import { sellerReadiness } from "./seller-readiness"

/**
 * A seller sells only while on a plan: paid, or the free first month. Without
 * one they can still look around their panel, pay for a plan, keep their
 * profile and get paid, and finish the orders buyers already placed. Anything
 * that changes what the shop sells or where it ships needs a plan.
 */
const WORKS_WITHOUT_PLAN =
  /^\/vendor\/(subscription|sellers|orders|returns|return-request|shipping-orders|chat|talkjs|payouts|payout-account|invites\/accept|me|notifications)(\/|$)/

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

/** An admin's suspension closes a shop whatever its plan or setup. */
export const isSuspended = (seller: { store_status?: string | null }) =>
  String(seller.store_status ?? "").toUpperCase() === "SUSPENDED"

/**
 * A shop is closed to buyers when an admin suspended it, it has no plan
 * running, or its store setup isn't finished (see lib/seller-readiness). Of
 * the given sellers, the closed ones.
 */
export async function closedSellers(pg: any, sellerIds: string[]): Promise<{ id: string; name: string; handle: string }[]> {
  const ids = [...new Set(sellerIds.filter(Boolean))]
  if (!ids.length) return []
  const noPlan = new Set(await sellersWithoutPlan(pg, ids))
  const sellers = await pg("seller").whereIn("id", ids).whereNull("deleted_at").select("*")
  return sellers
    .filter((s: any) => isSuspended(s) || noPlan.has(s.id) || !sellerReadiness(s).ready)
    .map((s: any) => ({ id: s.id, name: s.name, handle: s.handle }))
}

/**
 * Handles of the closed shops that have products on the shelf. The
 * storefront leaves them out of listings and search.
 */
export async function closedShopHandles(pg: any): Promise<string[]> {
  const withProducts = await pg("seller_seller_product_product").whereNull("deleted_at").distinct("seller_id")
  return (await closedSellers(pg, withProducts.map((r: any) => r.seller_id))).map((s) => s.handle)
}

export const closedShopMessage = (names: string[]) =>
  names.length === 1
    ? `${names[0]} isn't taking orders right now. Remove its items to check out.`
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} aren't taking orders right now. Remove their items to check out.`

/** Names of the closed shops selling these products. */
export async function closedShopsSelling(pg: any, productIds: string[]): Promise<string[]> {
  if (!productIds.length) return []
  const links = await pg("seller_seller_product_product")
    .whereIn("product_id", productIds)
    .whereNull("deleted_at")
    .select("seller_id")
  return (await closedSellers(pg, links.map((l: any) => l.seller_id))).map((s) => s.name)
}
