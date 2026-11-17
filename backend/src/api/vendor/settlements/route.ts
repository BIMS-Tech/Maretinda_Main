import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { netOfFees, PAYOUT_HOLD_DAYS, payoutLines } from "../../../lib/settlement-lines"
import { sellerIdOfMember } from "../../../lib/seller-ownership"

const round = (n: number) => Math.round(n * 100) / 100

/**
 * GET /vendor/settlements — the shop's money from online payments: what is
 * waiting (and on what), what goes in the next bank file, and what was paid.
 * COD cash is on /vendor/cod-remittances.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const sellerId = await sellerIdOfMember(pg, req.auth_context?.actor_id)
  if (!sellerId) return res.status(401).json({ message: "Unauthorized" })

  const lines = await payoutLines(pg, { sellerId })
  const pending = lines.map((l) => ({
    reference_number: l.reference_number,
    order_id: l.order_id,
    paid_at: l.transaction_date,
    delivered_at: l.delivered_at,
    release_at: l.release_at,
    hold: l.hold,
    order_amount: l.order_amount,
    amount: l.amount,
    net_amount: netOfFees(l.amount),
  }))

  // settled_at is when the bank file listing the line was made
  const paid = await pg("settlement_line")
    .where("seller_id", sellerId)
    // "legacy" lines only mark payments from before the ledger existed as not
    // to be paid again; they were never in a bank file
    .whereNot("kind", "legacy")
    .select("reference_number", "order_id", "kind", "gross_amount", "net_amount", "created_at as settled_at")
    .orderBy("created_at", "desc")
    .limit(100)

  const sum = (rows: typeof pending, pick: (r: (typeof pending)[number]) => boolean) =>
    round(rows.filter(pick).reduce((n, r) => n + r.net_amount, 0))

  res.json({
    hold_days: PAYOUT_HOLD_DAYS,
    summary: {
      ready: sum(pending, (r) => r.hold === null),
      holding: sum(pending, (r) => r.hold === "holding"),
      awaiting_delivery: sum(pending, (r) => r.hold === "not_delivered"),
      return_open: sum(pending, (r) => r.hold === "return_open"),
      paid_total: round(paid.reduce((n: number, p: any) => n + Number(p.net_amount ?? p.gross_amount ?? 0), 0)),
    },
    pending,
    paid: paid.map((p: any) => ({ ...p, gross_amount: Number(p.gross_amount), net_amount: Number(p.net_amount ?? p.gross_amount) })),
  })
}
