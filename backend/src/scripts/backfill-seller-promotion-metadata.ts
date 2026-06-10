import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Backfill metadata for seller-created promotions that are missing
 * scope/seller_id/is_public flags. Run once after deploying the fix.
 *
 * Usage:  yarn medusa exec src/scripts/backfill-seller-promotion-metadata.ts
 */
export default async function backfillSellerPromotionMetadata({ container }: ExecArgs) {
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const updated = await knex.raw(`
    UPDATE promotion p
    SET metadata = COALESCE(p.metadata, '{}'::jsonb)
      || jsonb_build_object(
           'scope',     'seller',
           'is_public', true,
           'seller_id', sp.seller_id::text,
           'seller_name', s.name
         )
    FROM seller_seller_promotion_promotion sp
    JOIN seller s ON s.id = sp.seller_id
    WHERE p.id = sp.promotion_id
      AND (
        p.metadata IS NULL
        OR p.metadata->>'scope' IS NULL
        OR p.metadata->>'scope' != 'seller'
      )
    RETURNING p.id, p.code, p.metadata->>'seller_name' AS seller_name
  `)

  const rows = updated.rows as Array<{ id: string; code: string; seller_name: string }>
  if (rows.length === 0) {
    console.log("No promotions needed backfilling — all already tagged.")
  } else {
    console.log(`Backfilled ${rows.length} promotion(s):`)
    for (const r of rows) {
      console.log(`  [${r.id}] ${r.code} → seller: ${r.seller_name}`)
    }
  }
}
