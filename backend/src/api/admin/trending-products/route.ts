import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /admin/trending-products
 * Returns top products ordered by trending_score (units sold last 7 days).
 * Used by the admin StoreFront panel to select the hero featured product.
 *
 * Query params:
 *   limit  - default 10, max 50
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const limit = Math.min(Number(req.query.limit) || 10, 50)

    const result = await pg.raw(
      `SELECT
         p.id,
         p.title,
         p.handle,
         p.thumbnail,
         COALESCE((p.metadata->>'trending_score')::int, 0)  AS trending_score,
         COALESCE((p.metadata->>'avg_rating')::float, 0)    AS avg_rating,
         COALESCE((p.metadata->>'review_count')::int, 0)    AS review_count,
         p.metadata
       FROM product p
       WHERE p.status = 'published'
         AND p.deleted_at IS NULL
       ORDER BY trending_score DESC, p.created_at DESC
       LIMIT ?`,
      [limit]
    )

    const products = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      handle: row.handle,
      thumbnail: row.thumbnail,
      trending_score: row.trending_score,
      avg_rating: row.avg_rating,
      review_count: row.review_count,
    }))

    res.status(200).json({ products })
  } catch (error: any) {
    console.error("[Admin Trending Products] Error:", error.message)
    res.status(500).json({ message: "Failed to fetch trending products", error: error.message })
  }
}
