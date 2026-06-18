import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Brand Loader
 * Creates the brand catalog tables on startup (idempotent), so a fresh database
 * gets them automatically without relying on `medusa db:migrate`.
 *
 *   brand          — the admin-curated brand catalog
 *   product_brand  — links a product to one brand
 */
export default async function brandLoader(container: MedusaContainer): Promise<void> {
  console.log("[Brand Loader] ========== INITIALIZING BRAND TABLES ==========")
  try {
    const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

    await pg.raw(`
      CREATE TABLE IF NOT EXISTS "brand" (
        "id" text NOT NULL,
        "name" text NOT NULL,
        "slug" text,
        "logo_url" text,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "brand_pkey" PRIMARY KEY ("id")
      )
    `)
    await pg.raw(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_brand_slug" ON "brand" ("slug") WHERE "deleted_at" IS NULL AND "slug" IS NOT NULL`)
    await pg.raw(`CREATE INDEX IF NOT EXISTS "idx_brand_deleted" ON "brand" ("deleted_at")`)

    await pg.raw(`
      CREATE TABLE IF NOT EXISTS "product_brand" (
        "id" text NOT NULL,
        "product_id" text NOT NULL,
        "brand_id" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "product_brand_pkey" PRIMARY KEY ("id")
      )
    `)
    await pg.raw(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_product_brand_product" ON "product_brand" ("product_id") WHERE "deleted_at" IS NULL`)
    await pg.raw(`CREATE INDEX IF NOT EXISTS "idx_product_brand_brand" ON "product_brand" ("brand_id") WHERE "deleted_at" IS NULL`)

    console.log("[Brand Loader] ========== BRAND TABLES READY ==========")
  } catch (error) {
    console.error("[Brand Loader] ========== FAILED ==========", error)
  }
}
