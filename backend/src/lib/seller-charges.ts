import crypto from "crypto"

/**
 * What a shop owes Maretinda after a refund (return shipping, the processing
 * fee, or a refund paid after its payout), and how it is recovered (policy
 * Section 2.1): first from the next payouts, then, if none comes within 14
 * days, from the shop's security deposit. A shop whose deposit falls below the
 * required minimum is paused until it is topped up.
 */

const round = (n: number) => Math.round(n * 100) / 100
const newId = (p: string) => `${p}_${crypto.randomBytes(10).toString("hex")}`
const DAY = 24 * 3600_000
export const DEPOSIT_AFTER_DAYS = 14

/** Required deposit in pesos; 0 (the default until finance sets it) turns the pause off. */
export const depositMinimum = (env: Record<string, string | undefined> = process.env) => {
  const n = Number(env.SELLER_SECURITY_DEPOSIT_MIN)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export type OpenCharge = { id: string; seller_id: string; order_id: string | null; label: string; amount: number; owed: number; created_at: Date }

/** Charges with something still owed, oldest first. */
export async function openCharges(pg: any, sellerIds?: string[]): Promise<OpenCharge[]> {
  const q = pg("seller_charge as c")
    .leftJoin("seller_charge_recovery as r", "r.charge_id", "c.id")
    .whereNull("c.waived_at")
    .groupBy("c.id")
    .select("c.id", "c.seller_id", "c.order_id", "c.label", "c.amount", "c.created_at", pg.raw("c.amount - coalesce(sum(r.amount), 0) as owed"))
    .havingRaw("c.amount - coalesce(sum(r.amount), 0) > 0")
    .orderBy("c.created_at")
  if (sellerIds) q.whereIn("c.seller_id", sellerIds.length ? sellerIds : ["__none__"])
  return (await q).map((c: any) => ({ ...c, amount: Number(c.amount), owed: round(Number(c.owed)) }))
}

export type Recovery = { charge_id: string; amount: number }

/**
 * Takes what each shop owes out of its lines in a payout file, largest lines
 * first, never below zero. Returns the lines with their reduced net amount and
 * what was recovered from each; nothing is recorded until the file is made.
 */
export async function allocateCharges<T extends { seller_id: string | null; net_amount: number }>(
  pg: any,
  lines: T[]
): Promise<(T & { recoveries: Recovery[] })[]> {
  const sellers = [...new Set(lines.map((l) => l.seller_id).filter(Boolean) as string[])]
  const owed = await openCharges(pg, sellers)
  const out = lines.map((l) => ({ ...l, recoveries: [] as Recovery[] }))
  for (const sellerId of sellers) {
    const charges = owed.filter((c) => c.seller_id === sellerId).map((c) => ({ ...c }))
    const own = out.filter((l) => l.seller_id === sellerId).sort((a, b) => b.net_amount - a.net_amount)
    for (const line of own) {
      for (const charge of charges) {
        if (line.net_amount <= 0) break
        if (charge.owed <= 0) continue
        const take = round(Math.min(charge.owed, line.net_amount))
        charge.owed = round(charge.owed - take)
        line.net_amount = round(line.net_amount - take)
        line.recoveries.push({ charge_id: charge.id, amount: take })
      }
    }
  }
  return out
}

export async function recordRecoveries(pg: any, recoveries: Recovery[], source: "payout" | "deposit" | "cod", sourceId: string) {
  const rows = recoveries.filter((r) => r.amount > 0).map((r) => ({ id: newId("rcv"), ...r, source, source_id: sourceId }))
  if (rows.length) await pg("seller_charge_recovery").insert(rows)
}

/** A payout file deleted before it was sent recovered nothing. */
export async function releaseRecoveries(pg: any, source: "payout" | "cod", sourceId: string) {
  await pg("seller_charge_recovery").where({ source, source_id: sourceId }).delete()
}

export async function depositBalance(pg: any, sellerId: string): Promise<number> {
  const rows = await pg("seller_deposit_entry").where("seller_id", sellerId).select("kind").sum("amount as total").groupBy("kind")
  const of = (k: string) => Number(rows.find((r: any) => r.kind === k)?.total ?? 0)
  return round(of("received") - of("deducted") - of("returned"))
}

export function parseDepositEntry(body: any): { kind: "received" | "returned"; amount: number; reference: string | null; note: string | null } | string {
  const amount = Math.round(Number(body?.amount) * 100) / 100
  if (body?.kind !== "received" && body?.kind !== "returned") return "Record a deposit received, or one returned to the shop."
  if (!Number.isFinite(amount) || amount <= 0) return "Enter the amount."
  const reference = typeof body?.reference === "string" ? body.reference.trim().slice(0, 100) : ""
  if (!reference) return "Enter the bank or transfer reference."
  return { kind: body.kind, amount, reference, note: typeof body?.note === "string" ? body.note.trim().slice(0, 300) || null : null }
}

export async function addDepositEntry(pg: any, sellerId: string, entry: Exclude<ReturnType<typeof parseDepositEntry>, string>, by: string) {
  if (entry.kind === "returned" && entry.amount > (await depositBalance(pg, sellerId))) return { error: "That's more than the deposit holds." }
  await pg("seller_deposit_entry").insert({ id: newId("dep"), seller_id: sellerId, kind: entry.kind, amount: entry.amount, reference: entry.reference, note: entry.note, created_by: by })
  return { balance: await depositBalance(pg, sellerId) }
}

/** Charges still owed 14 days on (no payout covered them) come out of the shop's deposit. */
export async function recoverFromDeposits(pg: any, now = new Date()) {
  const due = (await openCharges(pg)).filter((c) => new Date(c.created_at).getTime() < now.getTime() - DEPOSIT_AFTER_DAYS * DAY)
  const taken: { seller_id: string; amount: number }[] = []
  for (const sellerId of [...new Set(due.map((c) => c.seller_id))]) {
    let balance = await depositBalance(pg, sellerId)
    for (const charge of due.filter((c) => c.seller_id === sellerId)) {
      if (balance <= 0) break
      const take = round(Math.min(balance, charge.owed))
      const entryId = newId("dep")
      await pg("seller_deposit_entry").insert({ id: entryId, seller_id: sellerId, kind: "deducted", amount: take, charge_id: charge.id, note: charge.label, created_by: "system" })
      await recordRecoveries(pg, [{ charge_id: charge.id, amount: take }], "deposit", entryId)
      balance = round(balance - take)
      taken.push({ seller_id: sellerId, amount: take })
    }
  }
  return taken
}

/** Shops paused because their deposit is under the minimum (none while the minimum is 0). */
export async function sellersBelowDeposit(pg: any, sellerIds: string[]): Promise<Set<string>> {
  const min = depositMinimum()
  if (!min || !sellerIds.length) return new Set()
  const out = new Set<string>()
  for (const id of sellerIds) if ((await depositBalance(pg, id)) < min) out.add(id)
  return out
}
