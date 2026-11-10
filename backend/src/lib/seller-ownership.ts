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

/** A review is the seller's if it's about their shop or one of their products. */
export async function sellerOwnsReview(pg: any, sellerId: string, reviewId: string): Promise<boolean> {
  const ofShop = await pg("seller_seller_review_review")
    .where({ seller_id: sellerId, review_id: reviewId })
    .whereNull("deleted_at")
    .first()
  if (ofShop) return true

  const ofProduct = await pg("product_product_review_review as pr")
    .join("seller_seller_product_product as sp", "sp.product_id", "pr.product_id")
    .where({ "pr.review_id": reviewId, "sp.seller_id": sellerId })
    .whereNull("pr.deleted_at")
    .whereNull("sp.deleted_at")
    .first("pr.id")
  return Boolean(ofProduct)
}
