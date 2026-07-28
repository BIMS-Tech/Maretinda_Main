import { Migration } from "@mikro-orm/migrations"

export class Migration1754000000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "seller_reel" (
        "id"            text        NOT NULL,
        "seller_id"     text        NOT NULL,
        "title"         text        NOT NULL DEFAULT '',
        "description"   text        NULL,
        "video_url"     text        NOT NULL,
        "thumbnail_url" text        NULL,
        "duration"      integer     NULL,
        "product_ids"   jsonb       NOT NULL DEFAULT '[]'::jsonb,
        "status"        text        NOT NULL DEFAULT 'published',
        "view_count"    integer     NOT NULL DEFAULT 0,
        "like_count"    integer     NOT NULL DEFAULT 0,
        "published_at"  timestamptz NULL,
        "created_at"    timestamptz NOT NULL DEFAULT now(),
        "updated_at"    timestamptz NOT NULL DEFAULT now(),
        "deleted_at"    timestamptz NULL,
        CONSTRAINT "seller_reel_pkey" PRIMARY KEY ("id")
      );
    `)

    this.addSql(`CREATE INDEX IF NOT EXISTS "seller_reel_seller_idx"    ON "seller_reel" ("seller_id");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "seller_reel_status_idx"    ON "seller_reel" ("status");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "seller_reel_published_idx" ON "seller_reel" ("published_at" DESC NULLS LAST);`)

    this.addSql(`
      CREATE TABLE IF NOT EXISTS "seller_reel_like" (
        "reel_id"     text        NOT NULL REFERENCES "seller_reel"("id") ON DELETE CASCADE,
        "customer_id" text        NOT NULL,
        "created_at"  timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "seller_reel_like_pkey" PRIMARY KEY ("reel_id", "customer_id")
      );
    `)

    this.addSql(`CREATE INDEX IF NOT EXISTS "seller_reel_like_customer_idx" ON "seller_reel_like" ("customer_id");`)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "seller_reel_like";`)
    this.addSql(`DROP TABLE IF EXISTS "seller_reel";`)
  }
}
