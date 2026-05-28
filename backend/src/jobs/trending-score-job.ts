import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const config = {
  name: "trending-score-job",
  schedule: "0 * * * *", // every hour
}

/**
 * Computes a trending score for every product based on units sold in the last
 * 7 days. Also computes avg_rating and review_count from the reviews table.
 * Results are written back to product.metadata so the store endpoint can sort
 * by them without a heavy real-time join.
 */
export default async function trendingScoreJob(
  container: MedusaContainer
): Promise<void> {
  let pg: any
  try {
    pg = (container as any).resolve(ContainerRegistrationKeys.PG_CONNECTION)
  } catch {
    pg =
      (container as any).__pg_connection__ ||
      (container as any).pgConnection
  }

  if (!pg?.raw) {
    console.error("[TrendingScore] Could not resolve PG connection")
    return
  }

  try {
    // Step 1: count units sold per product in the last 7 days
    const salesResult = await pg.raw(`
      SELECT
        oli.product_id,
        SUM(oli.quantity)::int AS sold_7d
      FROM order_line_item oli
      JOIN "order" o ON o.id = oli.order_id
      WHERE
        o.created_at >= NOW() - INTERVAL '7 days'
        AND o.status NOT IN ('canceled', 'archived')
        AND oli.product_id IS NOT NULL
      GROUP BY oli.product_id
    `)

    const salesMap: Record<string, number> = {}
    for (const row of salesResult.rows ?? []) {
      salesMap[row.product_id] = Number(row.sold_7d) || 0
    }

    // Step 2: avg rating + review count per product from the reviews table
    let ratingsMap: Record<string, { avg: number; count: number }> = {}
    try {
      const ratingsResult = await pg.raw(`
        SELECT
          reference_id AS product_id,
          ROUND(AVG(rating)::numeric, 1)::float AS avg_rating,
          COUNT(*)::int AS review_count
        FROM review
        WHERE reference = 'product'
          AND deleted_at IS NULL
        GROUP BY reference_id
      `)
      for (const row of ratingsResult.rows ?? []) {
        ratingsMap[row.product_id] = {
          avg: Number(row.avg_rating) || 0,
          count: Number(row.review_count) || 0,
        }
      }
    } catch {
      // reviews table may not exist in all deployments — skip silently
    }

    // Step 3: write metadata back to products that have a score or rating
    const productIds = new Set([
      ...Object.keys(salesMap),
      ...Object.keys(ratingsMap),
    ])

    if (productIds.size === 0) {
      console.log("[TrendingScore] No trending data to update")
      return
    }

    let updated = 0
    for (const productId of productIds) {
      const score = salesMap[productId] ?? 0
      const rating = ratingsMap[productId]?.avg ?? null
      const reviewCount = ratingsMap[productId]?.count ?? 0

      await pg.raw(
        `UPDATE product
         SET metadata = COALESCE(metadata, '{}'::jsonb)
           || jsonb_build_object(
               'trending_score',  :score::int,
               'avg_rating',      :rating,
               'review_count',    :reviewCount::int,
               'trending_updated_at', NOW()::text
             )
         WHERE id = :productId
           AND deleted_at IS NULL`,
        { score, rating, reviewCount, productId }
      )
      updated++
    }

    console.log(`[TrendingScore] Updated ${updated} products`)
  } catch (error) {
    console.error(
      "[TrendingScore] Job failed:",
      error instanceof Error ? error.message : error
    )
  }
}
