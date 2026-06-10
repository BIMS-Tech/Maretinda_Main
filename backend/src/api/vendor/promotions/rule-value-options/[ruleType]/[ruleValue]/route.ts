import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

async function getSellerIdFromMember(req: any): Promise<string | null> {
  const memberId = req.auth_context?.actor_id
  if (!memberId) return null
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const result = await pg.raw(`SELECT seller_id FROM member WHERE id = ? LIMIT 1`, [memberId])
  return result.rows?.[0]?.seller_id || null
}

/**
 * GET /seller/promotions/rule-value-options/:ruleType/:ruleValue
 * Return possible values for a given rule attribute.
 * - customer_group: fetch all customer groups
 * - product: fetch seller's own products
 * - country: return empty (rarely used)
 * - anything else: return empty
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { ruleValue } = req.params

    if (ruleValue === "currency_code") {
      const valueFilter = req.query?.value
      const allowed: string[] = Array.isArray(valueFilter)
        ? (valueFilter as string[])
        : valueFilter
        ? [valueFilter as string]
        : []

      const values = allowed.map((code) => ({
        value: code,
        label: code.toUpperCase(),
      }))

      res.status(200).json({ values })
      return
    }

    if (ruleValue === "customer_group") {
      const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
      const result = await pg.raw(
        `SELECT id, name FROM customer_group WHERE deleted_at IS NULL ORDER BY name ASC LIMIT 200`
      )

      const values = (result.rows || []).map((g: any) => ({
        value: g.id,
        label: g.name,
      }))

      res.status(200).json({ values })
      return
    }

    if (ruleValue === "product") {
      const sellerId = await getSellerIdFromMember(req)
      if (!sellerId) {
        res.status(401).json({ message: "Unauthorized" })
        return
      }

      // Fetch products linked to this seller via the seller_product join table
      const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
      const result = await pg.raw(
        `SELECT p.id, p.title
         FROM product p
         INNER JOIN seller_product sp ON sp.product_id = p.id
         WHERE sp.seller_id = ?
         ORDER BY p.title ASC
         LIMIT 500`,
        [sellerId]
      )

      const values = (result.rows || []).map((p: any) => ({
        value: p.id,
        label: p.title,
      }))

      res.status(200).json({ values })
      return
    }

    if (ruleValue === "product_category") {
      const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
      const result = await pg.raw(
        `SELECT id, name FROM product_category WHERE deleted_at IS NULL ORDER BY name ASC LIMIT 500`
      )

      const values = (result.rows || []).map((c: any) => ({
        value: c.id,
        label: c.name,
      }))

      res.status(200).json({ values })
      return
    }

    // For country and any other values, return empty
    res.status(200).json({ values: [] })
  } catch (error: any) {
    console.error("[sellerRuleValueOptions] Error:", error)
    res.status(500).json({ message: "Failed to retrieve rule value options", error: error.message })
  }
}
