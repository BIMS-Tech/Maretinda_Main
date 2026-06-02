import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function promotionsLoader(container: MedusaContainer): Promise<void> {
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  await pg.raw(`
    CREATE TABLE IF NOT EXISTS "seller_promotion" (
      "seller_id"    text NOT NULL,
      "promotion_id" text NOT NULL,
      "created_at"   timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "seller_promotion_pkey" PRIMARY KEY ("seller_id", "promotion_id")
    )
  `)

  await pg.raw(`CREATE INDEX IF NOT EXISTS "seller_promotion_seller_idx" ON "seller_promotion" ("seller_id")`)
  await pg.raw(`CREATE INDEX IF NOT EXISTS "seller_promotion_promotion_idx" ON "seller_promotion" ("promotion_id")`)

  console.log('[PromotionsLoader] seller_promotion table ready')
}
