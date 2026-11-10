/**
 * What each plan includes, as the seller panel shows it (hooks/api/plan-limits
 * and FeatureGate there). The API holds the same line so a seller can't get a
 * bigger plan's features by calling /vendor directly.
 */

const ALIASES: Record<string, string> = { Foundation: "Starter", Boost: "Growth", Managed: "Premium" }

/** Flash sales and promotions/vouchers come with these plans. */
export const MARKETING_PLANS = ["Growth", "Premium"]

const STAFF_SEATS: Record<string, number> = { Starter: 1, Growth: 5, Premium: 15 }

export type ActivePlan = { name: string; features: Record<string, unknown> }

export async function activePlanOf(pg: any, sellerId: string): Promise<ActivePlan | null> {
  const sub = await pg("seller_subscription")
    .where({ seller_id: sellerId, status: "active" })
    .where("end_date", ">", new Date())
    .orderBy("created_at", "desc")
    .first("plan_name")
  if (!sub) return null
  const name = ALIASES[sub.plan_name] ?? sub.plan_name
  const plan = await pg("subscription_plan").whereIn("name", [name, sub.plan_name]).first("features")
  return { name, features: plan?.features ?? {} }
}

/** -1 means no cap. */
export const maxProducts = (plan: ActivePlan) =>
  typeof plan.features.max_products === "number" ? plan.features.max_products : -1

export const maxStaff = (plan: ActivePlan) =>
  typeof plan.features.staff_accounts === "number" ? plan.features.staff_accounts : STAFF_SEATS[plan.name] ?? -1

export const hasMarketing = (plan: ActivePlan) => MARKETING_PLANS.includes(plan.name)

export async function productCount(pg: any, sellerId: string): Promise<number> {
  const row = await pg("seller_seller_product_product as l")
    .join("product as p", "p.id", "l.product_id")
    .where("l.seller_id", sellerId)
    .whereNull("l.deleted_at")
    .whereNull("p.deleted_at")
    .count("l.product_id as total")
    .first()
  return Number(row?.total ?? 0)
}

/** Members plus invites not yet accepted, so invites can't get round the cap. */
export async function staffCount(pg: any, sellerId: string): Promise<number> {
  const [members, invites] = await Promise.all([
    pg("member").where("seller_id", sellerId).whereNull("deleted_at").count("id as total").first(),
    pg("member_invite")
      .where({ seller_id: sellerId, accepted: false })
      .whereNull("deleted_at")
      .where("expires_at", ">", new Date())
      .count("id as total")
      .first(),
  ])
  return Number(members?.total ?? 0) + Number(invites?.total ?? 0)
}
