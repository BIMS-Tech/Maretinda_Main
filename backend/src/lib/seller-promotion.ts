/**
 * A seller's promotion may only ever discount that seller's own products.
 *
 * Medusa's promotion engine is platform-wide: an automatic or order-level
 * promotion with no product rule applies to every shopper and every seller's
 * items, so a seller could otherwise give away other sellers' stock.
 */

export const PRODUCT_RULE_ATTRIBUTE = "items.product.id"

export async function productIdsOfSeller(pg: any, sellerId: string): Promise<string[]> {
  const rows = await pg("seller_seller_product_product")
    .where("seller_id", sellerId)
    .whereNull("deleted_at")
    .select("product_id")
  return rows.map((r: any) => r.product_id)
}

const toValues = (values: unknown): string[] =>
  (Array.isArray(values) ? values : [values]).map((v: any) => String(v?.value ?? v))

/** Rewrites a seller's create payload. Throws when it can't be made safe. */
export function scopeSellerPromotion(body: any, ownedProductIds: string[]): any {
  if (!ownedProductIds.length) {
    throw new SellerPromotionError("Add a product to your store before creating a promotion")
  }

  const method = { ...(body.application_method ?? {}) }
  const rules: any[] = Array.isArray(method.target_rules) ? method.target_rules : []

  const owned = new Set(ownedProductIds)
  const otherRules = rules.filter((r) => r?.attribute !== PRODUCT_RULE_ATTRIBUTE)
  const requested = rules
    .filter((r) => r?.attribute === PRODUCT_RULE_ATTRIBUTE)
    .flatMap((r) => toValues(r.values))

  if (requested.some((id) => !owned.has(id))) {
    throw new SellerPromotionError("A promotion can only target your own products")
  }

  return {
    ...body,
    is_automatic: false,
    application_method: {
      ...method,
      target_type: "items",
      allocation: method.allocation ?? "across",
      target_rules: [
        ...otherRules,
        {
          attribute: PRODUCT_RULE_ATTRIBUTE,
          operator: "in",
          values: requested.length ? requested : ownedProductIds,
        },
      ],
    },
  }
}

/** Fields an update must not change, or the scoping above could be undone. */
export function stripUnsafePromotionUpdate(body: any): any {
  const { is_automatic: _automatic, ...rest } = body ?? {}
  if (rest.application_method) {
    const { target_type: _target, target_rules: _rules, ...method } = rest.application_method
    rest.application_method = method
  }
  return rest
}

export class SellerPromotionError extends Error {}
