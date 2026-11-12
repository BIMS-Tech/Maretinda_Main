/**
 * Cash-on-delivery money collected by a courier booked through Maretinda.
 * A booking's COD amount is in parcel_details (is_cod / cod_amount). Once the
 * parcel is delivered the courier holds the cash:
 *   with_courier  -> delivered, Maretinda hasn't received it yet
 *   to_pay_seller -> Maretinda received it, the seller hasn't been paid
 *   paid          -> passed on to the seller
 */

export type CodState = "with_courier" | "to_pay_seller" | "paid"

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
      pg.raw(`${STATE} AS state`)
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
    remittances: rows.map((r: any) => ({ ...r, cod_amount: Number(r.cod_amount) })),
    count,
    summary,
  }
}

/**
 * Records a hop. "received" = the courier remitted to Maretinda; "paid" =
 * Maretinda paid the seller, which needs the cash to have been received first.
 * Returns how many bookings moved.
 */
export async function recordCodStep(pg: any, ids: string[], step: "received" | "paid", reference: string): Promise<number> {
  const eligible = base(pg, {}).whereIn("o.id", ids)
  if (step === "received") eligible.whereNull("o.cod_received_at")
  else eligible.whereNotNull("o.cod_received_at").whereNull("o.cod_paid_at")
  const moving: string[] = await eligible.pluck("o.id")
  if (!moving.length) return 0

  // updated_at is left alone: it is when the courier marked the parcel delivered
  const now = new Date()
  await pg("seller_shipping_order")
    .whereIn("id", moving)
    .update(step === "received" ? { cod_received_at: now, cod_received_ref: reference } : { cod_paid_at: now, cod_paid_ref: reference })
  return moving.length
}
