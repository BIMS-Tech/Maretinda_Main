import { allocateCharges, recordRecoveries, Recovery, releaseRecoveries } from "./seller-charges"

/**
 * What is owed to sellers from online payments, one line per payment per
 * seller. A buyer pays once for a cart that Mercur splits into one order per
 * seller, so a payment is divided by those orders' totals rather than handed
 * whole to whichever seller happened to be read first.
 *
 * Left out: payments already in a bank file (settlement_line), subscription
 * payments (the platform's own income), and cancelled orders. A line is paid
 * PAYOUT_HOLD_DAYS after its order is delivered, less any approved return.
 */

export type SettlementLine = {
  id: string
  reference_number: string
  seller_id: string | null
  seller_name: string | null
  order_id: string | null
  amount: number
  transaction_date: Date
  remarks: string
  bank_name: string | null
  swift_code: string | null
  beneficiary_name: string | null
  beneficiary_account: string | null
  beneficiary_address: string | null
  beneficiary_bank_address: string | null
}

export const isMetrobank = (line: Pick<SettlementLine, "bank_name">) => /metrobank/i.test(line.bank_name || "")

/**
 * Days after delivery before a seller is paid for an order (owner decision,
 * 17 November 2026: 14 days for every seller). Covers the buyer's 7-day
 * return window with time for an escalated return to be decided.
 */
export const PAYOUT_HOLD_DAYS = 14

const DAY = 24 * 60 * 60 * 1000

/** What a payout line is waiting on, if anything. */
export type PayoutHold = "no_order" | "not_delivered" | "holding" | "return_open" | "refunded" | null

export type PayoutLine = SettlementLine & {
  /** The order's total before any approved return was taken off. */
  order_amount: number
  delivered_at: Date | null
  /** When the line can go into a bank file; null while it waits on delivery or a return. */
  release_at: Date | null
  hold: PayoutHold
}

/** The 2.5% processing fee and ₱5 per payment the bank files deduct (unchanged, see decision 2). */
export const netOfFees = (gross: number) => Math.max(0, Math.round((gross - gross * 0.025 - 5) * 100) / 100)

/**
 * Whether a line may be paid now. A line is paid once, in full, after the hold:
 * an approved return comes off its amount first, and an open one keeps it back.
 */
export function payoutHold(
  line: { order_id: string | null; delivered_at: Date | null; open_returns: number; amount: number },
  now = new Date(),
  holdDays = PAYOUT_HOLD_DAYS
): { hold: PayoutHold; release_at: Date | null } {
  if (!line.order_id) return { hold: "no_order", release_at: null }
  if (!line.delivered_at) return { hold: "not_delivered", release_at: null }
  const release_at = new Date(line.delivered_at.getTime() + holdDays * DAY)
  if (line.open_returns > 0) return { hold: "return_open", release_at: null }
  if (line.amount <= 0) return { hold: "refunded", release_at: null }
  if (now < release_at) return { hold: "holding", release_at }
  return { hold: null, release_at }
}

/**
 * Every online payment not yet in a bank file, per seller, with whether it can
 * be paid yet. Pass seller_id to read one seller's.
 */
export async function payoutLines(
  pg: any,
  opts: { dateFrom?: string; dateTo?: string; sellerId?: string; now?: Date } = {}
): Promise<PayoutLine[]> {
  const params: any[] = []
  let dateFilter = ""
  if (opts.dateFrom) {
    dateFilter += " AND gt.created_at >= ?"
    params.push(opts.dateFrom)
  }
  if (opts.dateTo) {
    dateFilter += " AND gt.created_at <= ?"
    params.push(opts.dateTo)
  }
  let sellerFilter = ""
  if (opts.sellerId) {
    sellerFilter = " AND COALESCE(sp.seller_id, p.seller_id) = ?"
    params.push(opts.sellerId)
  }

  const result = await pg.raw(
    `
    WITH paid AS (
      SELECT gt.id, gt.reference_number, gt.cart_id, gt.seller_id, gt.amount, gt.created_at, gt.description
        FROM giyapay_transaction gt
       WHERE gt.status = 'SUCCESS'
         AND COALESCE(gt.order_id, '') NOT LIKE 'vrenew\\_%'
         AND COALESCE(gt.order_id, '') NOT LIKE 'vsub\\_%'
         AND NOT EXISTS (SELECT 1 FROM settlement_line sl WHERE sl.transaction_id = gt.id)
         ${dateFilter}
    ),
    split AS (
      SELECT p.id, so.seller_id, o.id AS order_id, o.canceled_at,
             (os.totals->>'current_order_total')::numeric AS amount
        FROM paid p
        JOIN order_set oset ON oset.cart_id = p.cart_id AND oset.deleted_at IS NULL
        JOIN marketplace_order_set_order_order l ON l.order_set_id = oset.id AND l.deleted_at IS NULL
        JOIN "order" o ON o.id = l.order_id AND o.deleted_at IS NULL
        JOIN seller_seller_order_order so ON so.order_id = o.id AND so.deleted_at IS NULL
        JOIN LATERAL (
          SELECT totals FROM order_summary
           WHERE order_id = o.id AND deleted_at IS NULL
           ORDER BY version DESC LIMIT 1
        ) os ON true
    )
    SELECT p.id, p.reference_number, p.created_at AS transaction_date, p.description AS remarks,
           COALESCE(sp.seller_id, p.seller_id) AS seller_id,
           sp.order_id,
           COALESCE(sp.amount, p.amount) AS amount,
           (SELECT count(*) FROM split x WHERE x.id = p.id) AS parts,
           (SELECT min(f.delivered_at)
              FROM order_fulfillment ofl
              JOIN fulfillment f ON f.id = ofl.fulfillment_id
             WHERE ofl.order_id = sp.order_id AND ofl.deleted_at IS NULL
               AND f.deleted_at IS NULL AND f.canceled_at IS NULL) AS delivered_at,
           (SELECT count(*)
              FROM order_return_order_return_request_order_order rl
              JOIN order_return_request rr ON rr.id = rl.order_return_request_id
             WHERE rl.order_id = sp.order_id AND rl.deleted_at IS NULL AND rr.deleted_at IS NULL
               AND rr.status IN ('pending', 'escalated')) AS open_returns,
           -- What goes back to the buyer: the refund the policy worked out, or for
           -- returns approved before refunds were tracked, the items' price
           (SELECT COALESCE(sum(r.amount), 0) FROM buyer_refund r
             WHERE r.order_id = sp.order_id AND r.kind = 'return' AND r.status <> 'void')
           + (SELECT COALESCE(sum(li.unit_price * rli.quantity), 0)
              FROM order_return_order_return_request_order_order rl
              JOIN order_return_request rr ON rr.id = rl.order_return_request_id
              JOIN order_return_request_line_item rli ON rli.return_request_id = rr.id AND rli.deleted_at IS NULL
              JOIN order_line_item li ON li.id = rli.line_item_id
             WHERE rl.order_id = sp.order_id AND rl.deleted_at IS NULL AND rr.deleted_at IS NULL
               AND rr.status = 'refunded'
               AND NOT EXISTS (SELECT 1 FROM buyer_refund r2 WHERE r2.request_id = rr.id AND r2.status <> 'void')) AS refunded_value,
           s.name AS seller_name,
           COALESCE(s.bank_name, s.dft_bank_name) AS bank_name,
           COALESCE(s.swift_code, s.dft_swift_code) AS swift_code,
           COALESCE(s.account_name, s.dft_beneficiary_name) AS beneficiary_name,
           COALESCE(s.account_number, s.dft_account_number) AS beneficiary_account,
           COALESCE(s.beneficiary_address, s.dft_beneficiary_address) AS beneficiary_address,
           COALESCE(s.beneficiary_bank_address, s.dft_bank_address) AS beneficiary_bank_address
      FROM paid p
      LEFT JOIN split sp ON sp.id = p.id
      LEFT JOIN seller s ON s.id = COALESCE(sp.seller_id, p.seller_id)
     WHERE sp.canceled_at IS NULL
       ${sellerFilter}
     ORDER BY p.created_at DESC, sp.seller_id
    `,
    params
  )

  const now = opts.now ?? new Date()
  const seen = new Map<string, number>()
  return (result.rows || []).map((row: any) => {
    const n = (seen.get(row.id) ?? 0) + 1
    seen.set(row.id, n)
    const orderAmount = Number(row.amount)
    const amount = Math.max(0, Math.round((orderAmount - Number(row.refunded_value || 0)) * 100) / 100)
    const deliveredAt = row.delivered_at ? new Date(row.delivered_at) : null
    const { hold, release_at } = payoutHold(
      { order_id: row.order_id, delivered_at: deliveredAt, open_returns: Number(row.open_returns || 0), amount },
      now
    )
    return {
      id: row.id,
      // A bank reference must be unique per payout line
      reference_number: Number(row.parts) > 1 ? `${row.reference_number}-${n}` : row.reference_number,
      seller_id: row.seller_id,
      seller_name: row.seller_name,
      order_id: row.order_id,
      amount,
      order_amount: orderAmount,
      delivered_at: deliveredAt,
      release_at,
      hold,
      transaction_date: new Date(row.transaction_date),
      remarks: row.remarks || "MARETINDA SETTLEMENT",
      bank_name: row.bank_name,
      swift_code: row.swift_code,
      beneficiary_name: row.beneficiary_name,
      beneficiary_account: row.beneficiary_account,
      beneficiary_address: row.beneficiary_address,
      beneficiary_bank_address: row.beneficiary_bank_address,
    }
  })
}

/**
 * The lines a bank file may pay now: delivered more than PAYOUT_HOLD_DAYS ago,
 * no open return. net_amount is after the fees and after anything the shop
 * owes from earlier refunds (lib/seller-charges); recoveries say what of it.
 */
export async function unsettledLines(pg: any, dateFrom?: string, dateTo?: string): Promise<(SettlementLine & { net_amount: number; recoveries: Recovery[] })[]> {
  const ready = (await payoutLines(pg, { dateFrom, dateTo })).filter((l) => l.hold === null)
  return allocateCharges(pg, ready.map((l) => ({ ...l, net_amount: netOfFees(l.amount) })))
}

type PaidLine = { id: string; seller_id?: string | null; order_id?: string | null; reference_number: string; amount: number; net_amount?: number; recoveries?: Recovery[] }

/** Records the lines a bank file pays, so no later file includes them again. */
export async function markSettled(pg: any, lines: PaidLine[], kind: "tama" | "dft", generationId: string) {
  if (!lines.length) return
  await pg("settlement_line")
    .insert(
      lines.map((l) => ({
        transaction_id: l.id,
        seller_id: l.seller_id || "unknown",
        order_id: l.order_id ?? null,
        reference_number: l.reference_number,
        kind,
        generation_id: generationId,
        gross_amount: l.amount,
        net_amount: l.net_amount ?? l.amount,
      }))
    )
    .onConflict(["transaction_id", "seller_id"])
    .ignore()
  await recordRecoveries(pg, lines.flatMap((l) => l.recoveries ?? []), "payout", `${kind}:${generationId}`)
}

/** A deleted bank file was never sent, so what it listed is owed again. */
export async function releaseSettled(pg: any, kind: "tama" | "dft", generationId: string) {
  await pg("settlement_line").where({ kind, generation_id: generationId }).delete()
  await releaseRecoveries(pg, "payout", `${kind}:${generationId}`)
}
