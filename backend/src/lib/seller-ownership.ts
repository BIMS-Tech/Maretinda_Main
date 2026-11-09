/**
 * Ownership checks for custom /vendor routes. Mercur guards its own routes with
 * checkResourceOwnershipByResourceId; these give ours the same guarantee.
 */

export async function sellerIdOfMember(pg: any, memberId?: string): Promise<string | null> {
  if (!memberId) return null
  const member = await pg("member").where("id", memberId).first()
  return member?.seller_id ?? null
}

export async function sellerOwnsOrder(pg: any, sellerId: string, orderId: string): Promise<boolean> {
  const row = await pg("seller_seller_order_order")
    .where({ seller_id: sellerId, order_id: orderId })
    .whereNull("deleted_at")
    .first()
  return Boolean(row)
}
