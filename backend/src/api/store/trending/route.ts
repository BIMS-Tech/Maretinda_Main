import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/trending
 *
 * Returns products ordered by trending_score (units sold in last 7 days).
 * Falls back to created_at DESC when no scores exist yet.
 *
 * Query params:
 *   category  - product_category handle (e.g. "fashion"). Omit for all.
 *   limit     - default 12
 *   region_id - optional, forwarded to price calculation
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  let pg: any
  try {
    pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  } catch {
    pg =
      (req.scope as any).__pg_connection__ ||
      (req.scope as any).pgConnection
  }

  if (!pg?.raw) {
    return res.status(500).json({ message: "Database unavailable" })
  }

  const limit = Math.min(Number(req.query.limit) || 12, 50)
  const category = (req.query.category as string) || null

  try {
    // Build query with optional category filter
    let sql: string
    let bindings: any[]

    if (category) {
      sql = `
        SELECT DISTINCT ON (p.id)
          p.id,
          p.title,
          p.handle,
          p.thumbnail,
          p.status,
          p.metadata,
          p.created_at,
          COALESCE((p.metadata->>'trending_score')::int, 0) AS score
        FROM product p
        JOIN product_category_product pcp ON pcp.product_id = p.id
        JOIN product_category pc ON pc.id = pcp.product_category_id
        WHERE p.status = 'published'
          AND p.deleted_at IS NULL
          AND LOWER(pc.handle) = LOWER(?)
        ORDER BY p.id, score DESC, p.created_at DESC
        LIMIT ?
      `
      bindings = [category, limit]
    } else {
      sql = `
        SELECT
          p.id,
          p.title,
          p.handle,
          p.thumbnail,
          p.status,
          p.metadata,
          p.created_at,
          COALESCE((p.metadata->>'trending_score')::int, 0) AS score
        FROM product p
        WHERE p.status = 'published'
          AND p.deleted_at IS NULL
        ORDER BY score DESC, p.created_at DESC
        LIMIT ?
      `
      bindings = [limit]
    }

    const result = await pg.raw(sql, bindings)
    const rows: any[] = result.rows ?? []

    // Re-sort by score DESC after DISTINCT ON de-duplication
    rows.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))

    const products = rows.map((row) => ({
      id: row.id,
      title: row.title,
      handle: row.handle,
      thumbnail: row.thumbnail,
      created_at: row.created_at,
      trending_score: row.score ?? 0,
      avg_rating: row.metadata?.avg_rating ?? null,
      review_count: row.metadata?.review_count ?? 0,
    }))

    return res.json({ products, count: products.length })
  } catch (error) {
    console.error(
      "[/store/trending] Error:",
      error instanceof Error ? error.message : error
    )
    return res.status(500).json({
      message: "Failed to fetch trending products",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
