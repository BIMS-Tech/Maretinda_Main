import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Product 3D Model Loader
 * Creates the product_3d_model table on startup (idempotent), so a fresh
 * database gets it automatically without relying on `medusa db:migrate`.
 */
export default async function product3dModelLoader(container: MedusaContainer): Promise<void> {
  console.log("[3D Model Loader] ========== INITIALIZING product_3d_model TABLE ==========")
  try {
    const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

    await pg.raw(`
      CREATE TABLE IF NOT EXISTS "product_3d_model" (
        "id" text NOT NULL,
        "product_id" text NOT NULL,
        "seller_id" text NOT NULL,
        "status" text NOT NULL DEFAULT 'processing',
        "source_image_url" text NOT NULL,
        "model_url" text NULL,
        "thumbnail_url" text NULL,
        "provider" text NOT NULL DEFAULT 'meshy',
        "provider_task_id" text NOT NULL,
        "error_message" text NULL,
        "progress" integer NOT NULL DEFAULT 0,
        "is_primary" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "product_3d_model_pkey" PRIMARY KEY ("id")
      )
    `)
    await pg.raw(`CREATE INDEX IF NOT EXISTS "product_3d_model_product_id_idx" ON "product_3d_model" ("product_id")`)
    await pg.raw(`CREATE INDEX IF NOT EXISTS "product_3d_model_seller_id_idx" ON "product_3d_model" ("seller_id")`)

    console.log("[3D Model Loader] ========== product_3d_model TABLE READY ==========")
  } catch (error) {
    console.error("[3D Model Loader] ========== FAILED ==========", error)
  }
}
