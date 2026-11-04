/**
 * Medusa 2.11's promotion table has no metadata column, and updatePromotions
 * silently drops the field, so the extras we attach to a promotion live in our
 * own promotion_metadata table.
 */

const uniq = (ids: string[]) => [...new Set(ids.filter(Boolean))]

export async function metadataForPromotions(pg: any, promotionIds: string[]): Promise<Map<string, Record<string, any>>> {
  const ids = uniq(promotionIds)
  if (!ids.length) return new Map()
  const rows = await pg("promotion_metadata").whereIn("promotion_id", ids).select("promotion_id", "metadata")
  return new Map(rows.map((r: any) => [r.promotion_id, r.metadata ?? {}]))
}

/** Merges into what's stored, so one form can't wipe fields set by another. */
export async function savePromotionMetadata(pg: any, promotionId: string, metadata: Record<string, any>) {
  const current = (await metadataForPromotions(pg, [promotionId])).get(promotionId) ?? {}
  const merged = { ...current, ...metadata }
  await pg("promotion_metadata")
    .insert({ promotion_id: promotionId, metadata: JSON.stringify(merged), updated_at: new Date() })
    .onConflict("promotion_id")
    .merge()
  return merged
}

/**
 * Who owns each promotion, from the link the seller routes write. Not from
 * metadata: ownership shouldn't depend on something an editor can change.
 */
export async function sellersOfPromotions(
  pg: any,
  promotionIds: string[]
): Promise<Map<string, { seller_id: string; seller_name?: string }>> {
  const ids = uniq(promotionIds)
  if (!ids.length) return new Map()
  const rows = await pg("seller_seller_promotion_promotion as l")
    .leftJoin("seller as s", "s.id", "l.seller_id")
    .whereIn("l.promotion_id", ids)
    .whereNull("l.deleted_at")
    .select("l.promotion_id", "l.seller_id", "s.name as seller_name")
  return new Map(rows.map((r: any) => [r.promotion_id, { seller_id: r.seller_id, seller_name: r.seller_name }]))
}

/**
 * Enforces first_order_only where it counts: applying the code and completing
 * the cart. Collecting a voucher is only a wallet; codes are public, so anyone
 * could type one straight into checkout. Returns a message when refused.
 */
export async function refusedPromoCode(
  pg: any,
  codes: string[],
  customerId?: string | null
): Promise<string | null> {
  const wanted = uniq(codes)
  if (!wanted.length) return null

  const restricted = await pg("promotion as p")
    .join("promotion_metadata as m", "m.promotion_id", "p.id")
    .whereIn("p.code", wanted)
    .whereRaw(`(m.metadata->>'first_order_only') = 'true'`)
    .select("p.code")
  if (!restricted.length) return null

  if (!customerId) return "Sign in to use this first-order voucher"

  const previous = await pg.raw(
    `SELECT 1 FROM "order" WHERE customer_id = ? AND status NOT IN ('canceled', 'archived') LIMIT 1`,
    [customerId]
  )
  return previous.rows.length ? "This voucher is only for first-time buyers" : null
}
