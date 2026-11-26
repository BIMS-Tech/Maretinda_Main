import { allocateCharges, recordRecoveries } from "./seller-charges"
import { PAYOUT_HOLD_DAYS } from "./settlement-lines"

/**
 * Cash-on-delivery money collected by a courier booked through Maretinda.
 * A booking's COD amount is in parcel_details (is_cod / cod_amount). Once the
 * parcel is delivered the courier holds the cash:
 *   with_courier  -> delivered, Maretinda hasn't received it yet
 *   to_pay_seller -> Maretinda received it, the seller hasn't been paid
 *   paid          -> passed on to the seller
 */

export type CodState = "with_courier" | "to_pay_seller" | "paid"


/** COD cash follows the same rule as online payments: the seller is paid PAYOUT_HOLD_DAYS after delivery. */
const PAYABLE_FROM = `(o.updated_at + interval '${PAYOUT_HOLD_DAYS} days')`
const OPEN_RETURN = `EXISTS (
  SELECT 1 FROM order_return_order_return_request_order_order rl
    JOIN order_return_request rr ON rr.id = rl.order_return_request_id
   WHERE rl.order_id = o.medusa_order_id AND rl.deleted_at IS NULL AND rr.deleted_at IS NULL
     AND rr.status IN ('pending', 'escalated'))`

const COD_AMOUNT = `COALESCE(NULLIF(o.parcel_details->>'cod_amount', '')::numeric, NULLIF(o.parcel_details->>'codAmount', '')::numeric, 0)`
const IS_COD = `(COALESCE(o.parcel_details->>'is_cod', o.parcel_details->>'isCod', 'false') = 'true')`
const STATE = `CASE WHEN o.cod_paid_at IS NOT NULL THEN 'paid' WHEN o.cod_received_at IS NOT NULL THEN 'to_pay_seller' ELSE 'with_courier' END`

function base(pg: any, filters: { seller_id?: string; state?: string; provider?: string }) {
  const q = pg("seller_shipping_order as o")
    .leftJoin("seller as s", "s.id", "o.seller_id")
    .whereNull("o.deleted_at")
    .where("o.status", "delivered")
    .whereRaw(IS_COD)
    .whereRaw(`${COD_AMOUNT} > 0`)
  if (filters.seller_id) q.where("o.seller_id", filters.seller_id)
  if (filters.provider) q.where("o.provider", filters.provider)
  if (filters.state) q.whereRaw(`${STATE} = ?`, [filters.state])
  return q
}

export async function listCodRemittances(
  pg: any,
  filters: { seller_id?: string; state?: string; provider?: string } = {},
  limit = 50,
  offset = 0
) {
  const rows = await base(pg, filters)
    .select(
      "o.id", "o.seller_id", "s.name as seller_name", "o.medusa_order_id", "o.provider", "o.tracking_number",
      "o.updated_at as delivered_at", "o.cod_received_at", "o.cod_received_ref", "o.cod_paid_at", "o.cod_paid_ref",
      pg.raw(`${COD_AMOUNT} AS cod_amount`),
      pg.raw(`${STATE} AS state`),
      pg.raw(`${PAYABLE_FROM} AS payable_from`),
      pg.raw(`${OPEN_RETURN} AS return_open`),
      // What was refunded to the buyer comes off what the shop is paid
      pg.raw(`(SELECT COALESCE(sum(r.amount), 0) FROM buyer_refund r WHERE r.order_id = o.medusa_order_id AND r.status <> 'void') AS refunded`)
    )
    .orderBy("o.updated_at", "desc")
    .limit(Math.min(limit, 200))
    .offset(offset)

  const totals = await base(pg, { seller_id: filters.seller_id, provider: filters.provider })
    .select(pg.raw(`${STATE} AS state`), pg.raw(`COUNT(*) AS count`), pg.raw(`COALESCE(SUM(${COD_AMOUNT}), 0) AS amount`))
    .groupByRaw(STATE)

  const summary: Record<CodState, { count: number; amount: number }> = {
    with_courier: { count: 0, amount: 0 },
    to_pay_seller: { count: 0, amount: 0 },
    paid: { count: 0, amount: 0 },
  }
  for (const t of totals) summary[t.state as CodState] = { count: Number(t.count), amount: Number(t.amount) }
  const count = Object.entries(summary).reduce((n, [state, v]) => (!filters.state || filters.state === state ? n + v.count : n), 0)

  return {
    remittances: await withAmountToPay(pg, rows),
    count,
    summary,
  }
}

/**
 * Records a hop. "received" = the courier remitted to Maretinda; "paid" =
 * Maretinda paid the seller, which needs the cash to have been received first,
 * the 14-day hold after delivery to have passed, and no return to be open.
 * Returns how many bookings moved.
 */
export async function recordCodStep(pg: any, ids: string[], step: "received" | "paid", reference: string): Promise<number> {
  const eligible = base(pg, {}).whereIn("o.id", ids)
  if (step === "received") eligible.whereNull("o.cod_received_at")
  else
    eligible
      .whereNotNull("o.cod_received_at")
      .whereNull("o.cod_paid_at")
      .whereRaw(`${PAYABLE_FROM} <= now()`)
      .whereRaw(`NOT ${OPEN_RETURN}`)
  const moving: string[] = await eligible.pluck("o.id")
  if (!moving.length) return 0

  // updated_at is left alone: it is when the courier marked the parcel delivered
  const now = new Date()
  if (step === "paid") {
    // What the shop owed from refunds was kept back from this transfer
    const rows = await base(pg, {}).whereIn("o.id", moving).select("o.id", "o.seller_id", "o.medusa_order_id", pg.raw(`${COD_AMOUNT} AS cod_amount`))
    for (const r of await withAmountToPay(pg, rows)) await recordRecoveries(pg, r.recoveries, "cod", r.id)
  }
  await pg("seller_shipping_order")
    .whereIn("id", moving)
    .update(step === "received" ? { cod_received_at: now, cod_received_ref: reference } : { cod_paid_at: now, cod_paid_ref: reference })
  return moving.length
}

/**
 * What to transfer to the shop for each parcel: the cash collected, less any
 * refund to the buyer, less what the shop still owes from earlier refunds.
 */
async function withAmountToPay(pg: any, rows: any[]) {
  const ids = rows.map((r) => r.medusa_order_id).filter(Boolean)
  const refunds = ids.length
    ? await pg("buyer_refund").whereIn("order_id", ids).whereNot("status", "void").select("order_id").sum("amount as total").groupBy("order_id")
    : []
  const refunded = new Map<string, number>(refunds.map((r: any) => [r.order_id, Number(r.total)]))
  const lines = rows.map((r) => {
    const cash = Number(r.cod_amount)
    const back = refunded.get(r.medusa_order_id) ?? 0
    return { ...r, cod_amount: cash, refunded: back, net_amount: Math.max(0, Math.round((cash - back) * 100) / 100) }
  })
  // Only parcels that are about to be paid keep back what is owed
  const payable = lines.filter((l) => !l.cod_paid_at)
  const allocated = new Map((await allocateCharges(pg, payable)).map((l) => [l.id, l]))
  return lines.map((l) => {
    const a = allocated.get(l.id)
    return { ...l, to_pay: a ? a.net_amount : l.net_amount, kept_for_refunds: a ? Math.round((l.net_amount - a.net_amount) * 100) / 100 : 0, recoveries: a?.recoveries ?? [] }
  })
}
