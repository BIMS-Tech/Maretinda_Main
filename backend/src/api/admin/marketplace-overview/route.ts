import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { isSuspended, sellersWithoutPlan } from "../../../lib/seller-plan"
import { sellerReadiness } from "../../../lib/seller-readiness"

const DAY = 24 * 60 * 60 * 1000

/**
 * GET /admin/marketplace-overview
 * The admin dashboard's figures, using the marketplace's own rules: a shop
 * sells only with a plan and a finished, approved setup (lib/seller-plan,
 * lib/seller-readiness). Money is in pesos, as Medusa stores it here.
 */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const since = new Date(Date.now() - 30 * DAY)
  const count = async (q: any) => Number((await q.count("* as n").first())?.n ?? 0)

  // Sellers: who can sell, and why the rest can't
  const sellerRows = await pg("seller").whereNull("deleted_at").select("*")
  const noPlan = new Set(await sellersWithoutPlan(pg, sellerRows.map((s: any) => s.id)))
  let selling = 0
  let closedSetup = 0
  let suspended = 0
  for (const s of sellerRows) {
    if (isSuspended(s)) {
      suspended++
      continue
    }
    if (noPlan.has(s.id)) continue
    if (sellerReadiness(s).ready) selling++
    else closedSetup++
  }

  // Plans running now; a yearly plan is a twelfth of its price each month
  const plans = await pg("seller_subscription")
    .where("status", "active")
    .where("end_date", ">", new Date())
    .select("price", "billing_period", "is_trial")
  const paid = plans.filter((p: any) => !p.is_trial)
  const mrr = paid.reduce(
    (sum: number, p: any) => sum + Number(p.price ?? 0) / (p.billing_period === "yearly" ? 12 : 1),
    0
  )

  // Orders, with totals from the order's current summary
  const orders = () => pg("order as o").whereNull("o.deleted_at").where("o.is_draft_order", false)
  const total = (alias: string) =>
    pg.raw(`COALESCE((SELECT (s.totals->>'current_order_total')::numeric FROM order_summary s
              WHERE s.order_id = ${alias}.id AND s.version = ${alias}.version AND s.deleted_at IS NULL LIMIT 1), 0)`)
  const sales = await orders()
    .where("o.created_at", ">=", since)
    .whereNot("o.status", "canceled")
    .select(pg.raw(`COALESCE(SUM(${total("o").toString()}), 0) AS total`))
    .first()
  const recent = await orders()
    .leftJoin("customer as c", "c.id", "o.customer_id")
    .leftJoin("seller_seller_order_order as l", function (this: any) {
      this.on("l.order_id", "o.id").andOnNull("l.deleted_at")
    })
    .leftJoin("seller as s", "s.id", "l.seller_id")
    .orderBy("o.created_at", "desc")
    .limit(8)
    .select(
      "o.id",
      "o.display_id",
      "o.status",
      "o.created_at",
      "o.email",
      "c.first_name",
      "c.last_name",
      "s.name as seller_name",
      pg.raw(`${total("o").toString()} AS total`)
    )

  res.json({
    sellers: {
      total: sellerRows.length,
      selling,
      closed_no_plan: sellerRows.filter((s: any) => !isSuspended(s) && noPlan.has(s.id)).length,
      closed_setup: closedSetup,
      suspended,
    },
    subscriptions: { paid: paid.length, trials: plans.length - paid.length, mrr: Math.round(mrr * 100) / 100 },
    orders: {
      total: await count(orders()),
      last_30_days: await count(orders().where("o.created_at", ">=", since)),
      sales_30_days: Number(sales?.total ?? 0),
    },
    recent_orders: recent.map((o: any) => ({
      id: o.id,
      display_id: o.display_id,
      status: o.status,
      created_at: o.created_at,
      total: Number(o.total),
      customer_name: [o.first_name, o.last_name].filter(Boolean).join(" ") || o.email || null,
      seller_name: o.seller_name ?? null,
    })),
    requests: {
      seller_applications: await count(pg("seller_application").where("status", "pending")),
      verifications: await count(pg("seller").whereNull("deleted_at").where("verification_status", "pending_review")),
      product_requests: await count(pg("request").whereNull("deleted_at").where("status", "pending")),
      returns_escalated: await count(pg("order_return_request").whereNull("deleted_at").where("status", "escalated")),
    },
  })
}
