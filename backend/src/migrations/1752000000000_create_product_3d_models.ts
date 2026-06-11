import { Migration } from "@mikro-orm/migrations"

export class Migration1752000000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "product_3d_model" (
        "id"                text        NOT NULL,
        "product_id"        text        NOT NULL,
        "seller_id"         text        NOT NULL,
        "status"            text        NOT NULL DEFAULT 'processing',
        "source_image_url"  text        NOT NULL,
        "model_url"         text        NULL,
        "thumbnail_url"     text        NULL,
        "provider"          text        NOT NULL DEFAULT 'meshy',
        "provider_task_id"  text        NOT NULL,
        "error_message"     text        NULL,
        "progress"          integer     NOT NULL DEFAULT 0,
        "is_primary"        boolean     NOT NULL DEFAULT false,
        "created_at"        timestamptz NOT NULL DEFAULT now(),
        "updated_at"        timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "product_3d_model_pkey" PRIMARY KEY ("id")
      );
    `)
    this.addSql(`CREATE INDEX IF NOT EXISTS "product_3d_model_product_id_idx" ON "product_3d_model" ("product_id");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "product_3d_model_seller_id_idx" ON "product_3d_model" ("seller_id");`)
  }

  async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "product_3d_model_product_id_idx";`)
    this.addSql(`DROP INDEX IF EXISTS "product_3d_model_seller_id_idx";`)
    this.addSql(`DROP TABLE IF EXISTS "product_3d_model";`)
  }
}
