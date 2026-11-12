import crypto from "crypto"

/** Records that a buyer is leaving for GiyaPay to pay for this cart. False when the cart isn't one that can be paid. */
export async function recordAttempt(pg: any, cartId: string, method?: string): Promise<boolean> {
  const cart = await pg("cart").where("id", cartId).whereNull("deleted_at").whereNull("completed_at").first("id", "email")
  if (!cart) return false
  const session = await pg("cart_payment_collection as cpc")
    .join("payment_session as ps", "ps.payment_collection_id", "cpc.payment_collection_id")
    .where("cpc.cart_id", cartId)
    .whereNull("cpc.deleted_at")
    .whereILike("ps.provider_id", "%giyapay%")
    .orderBy("ps.created_at", "desc")
    .first("ps.amount")
  if (!session) return false
  await pg("giyapay_attempt").insert({
    id: `gpa_${crypto.randomBytes(12).toString("hex")}`,
    cart_id: cartId,
    amount: session.amount,
    email: cart.email,
    method: typeof method === "string" ? method.slice(0, 40) : null,
  })
  return true
}

const MINUTE = 60 * 1000

/**
 * Carts sent to GiyaPay that never came back: no verified payment, no order,
 * not yet looked at. Most are buyers who changed their mind; one that GiyaPay
 * shows as paid is a buyer who was charged and has no order.
 */
export async function unconfirmedAttempts(pg: any, now: Date = new Date()) {
  const result = await pg.raw(
    `
    SELECT DISTINCT ON (a.cart_id)
           a.id, a.cart_id, a.amount, a.email, a.method, a.created_at,
           (SELECT count(*) FROM giyapay_attempt x WHERE x.cart_id = a.cart_id) AS attempts
      FROM giyapay_attempt a
      JOIN cart c ON c.id = a.cart_id
     WHERE a.resolved_at IS NULL
       AND a.created_at < ?
       AND a.created_at > ?
       AND c.completed_at IS NULL
       AND NOT EXISTS (SELECT 1 FROM giyapay_transaction t WHERE t.cart_id = a.cart_id AND t.status = 'SUCCESS')
       AND NOT EXISTS (SELECT 1 FROM giyapay_attempt r WHERE r.cart_id = a.cart_id AND r.resolved_at IS NOT NULL AND r.created_at >= a.created_at)
     ORDER BY a.cart_id, a.created_at DESC
    `,
    [new Date(now.getTime() - 30 * MINUTE), new Date(now.getTime() - 30 * 24 * 60 * MINUTE)]
  )
  return (result.rows || [])
    .map((r: any) => ({ ...r, amount: Number(r.amount), attempts: Number(r.attempts) }))
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

/** Marks every open attempt for the cart as looked at, with what was found. */
export async function resolveAttempt(pg: any, attemptId: string, adminId: string, note: string): Promise<boolean> {
  const attempt = await pg("giyapay_attempt").where("id", attemptId).first("cart_id")
  if (!attempt) return false
  await pg("giyapay_attempt")
    .where("cart_id", attempt.cart_id)
    .whereNull("resolved_at")
    .update({ resolved_at: new Date(), resolved_by: adminId, resolved_note: note })
  return true
}
