/**
 * What is owed to sellers from online payments, one line per payment per
 * seller. A buyer pays once for a cart that Mercur splits into one order per
 * seller, so a payment is divided by those orders' totals rather than handed
 * whole to whichever seller happened to be read first.
 *
 * Left out: payments already in a bank file (settlement_line), subscription
 * payments (the platform's own income), and cancelled orders.
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

export async function unsettledLines(pg: any, dateFrom?: string, dateTo?: string): Promise<SettlementLine[]> {
  const params: any[] = []
  let dateFilter = ""
  if (dateFrom) {
    dateFilter += " AND gt.created_at >= ?"
    params.push(dateFrom)
  }
  if (dateTo) {
    dateFilter += " AND gt.created_at <= ?"
    params.push(dateTo)
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
     ORDER BY p.created_at DESC, sp.seller_id
    `,
    params
  )

  const seen = new Map<string, number>()
  return (result.rows || []).map((row: any) => {
    const n = (seen.get(row.id) ?? 0) + 1
    seen.set(row.id, n)
    return {
      id: row.id,
      // A bank reference must be unique per payout line
      reference_number: Number(row.parts) > 1 ? `${row.reference_number}-${n}` : row.reference_number,
      seller_id: row.seller_id,
      seller_name: row.seller_name,
      order_id: row.order_id,
      amount: Number(row.amount),
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

type PaidLine = { id: string; seller_id?: string | null; order_id?: string | null; reference_number: string; amount: number; net_amount?: number }

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
}

/** A deleted bank file was never sent, so what it listed is owed again. */
export async function releaseSettled(pg: any, kind: "tama" | "dft", generationId: string) {
  await pg("settlement_line").where({ kind, generation_id: generationId }).delete()
}
