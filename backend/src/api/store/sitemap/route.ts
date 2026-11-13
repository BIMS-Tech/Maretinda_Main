import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { closedSellers } from "../../../lib/seller-plan"

const MAX_PRODUCTS = 20000

/**
 * GET /store/sitemap
 *
 * What search engines should index: published products and the shops that can
 * sell (not suspended, plan running, setup finished), plus the active top-level categories.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const stocked = (await pg("seller_seller_product_product").whereNull("deleted_at").distinct("seller_id")).map((r: any) => r.seller_id)
  const closed = new Set((await closedSellers(pg, stocked)).map((s) => s.id))
  const open = stocked.filter((id: string) => !closed.has(id))

  const [shops, products, categories] = await Promise.all([
    pg("seller").whereIn("id", open).whereNull("deleted_at").whereNotNull("handle").select("handle", "updated_at").orderBy("created_at", "asc"),
    pg("product as p")
      .join("seller_seller_product_product as sp", "sp.product_id", "p.id")
      .whereIn("sp.seller_id", open)
      .whereNull("p.deleted_at")
      .whereNull("sp.deleted_at")
      .where("p.status", "published")
      .select("p.handle", "p.updated_at")
      .orderBy("p.updated_at", "desc")
      .limit(MAX_PRODUCTS),
    pg("product_category")
      .whereNull("deleted_at")
      .whereNull("parent_category_id")
      .where({ is_active: true, is_internal: false })
      .select("handle", "updated_at"),
  ])

  res.setHeader("Cache-Control", "public, max-age=3600")
  res.json({ products, shops, categories })
}
