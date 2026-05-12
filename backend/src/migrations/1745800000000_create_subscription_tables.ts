import { Migration } from "@mikro-orm/migrations"

export class Migration1745800000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "subscription_plan" (
        "id"         text        NOT NULL,
        "name"       text        NOT NULL,
        "price"      numeric     NOT NULL DEFAULT 0,
        "features"   jsonb       NULL,
        "status"     text        NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "subscription_plan_pkey" PRIMARY KEY ("id")
      );
    `)

    this.addSql(`
      CREATE TABLE IF NOT EXISTS "vendor_subscription" (
        "id"                text        NOT NULL,
        "vendor_id"         text        NOT NULL,
        "plan_name"         text        NOT NULL,
        "price"             numeric     NOT NULL DEFAULT 0,
        "start_date"        timestamptz NOT NULL,
        "end_date"          timestamptz NOT NULL,
        "status"            text        NOT NULL DEFAULT 'active',
        "auto_renew"        boolean     NOT NULL DEFAULT false,
        "payment_reference" text        NULL,
        "created_at"        timestamptz NOT NULL DEFAULT now(),
        "updated_at"        timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "vendor_subscription_pkey" PRIMARY KEY ("id")
      );
    `)

    this.addSql(`CREATE INDEX IF NOT EXISTS "vendor_subscription_vendor_id_idx" ON "vendor_subscription" ("vendor_id");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "vendor_subscription_status_idx"    ON "vendor_subscription" ("status");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "vendor_subscription_end_date_idx"  ON "vendor_subscription" ("end_date");`)

    // Seed hardcoded plans
    this.addSql(`
      INSERT INTO "subscription_plan" ("id", "name", "price", "features", "status", "created_at", "updated_at")
      VALUES
        (
          'subplan_foundation',
          'Foundation',
          999,
          '{"max_products": 50, "analytics": "basic", "priority_support": false, "featured_listings": false, "dedicated_manager": false}'::jsonb,
          'active',
          now(), now()
        ),
        (
          'subplan_boost',
          'Boost',
          2499,
          '{"max_products": 200, "analytics": "advanced", "priority_support": false, "featured_listings": true, "dedicated_manager": false}'::jsonb,
          'active',
          now(), now()
        ),
        (
          'subplan_managed',
          'Managed',
          5999,
          '{"max_products": -1, "analytics": "premium", "priority_support": true, "featured_listings": true, "dedicated_manager": true}'::jsonb,
          'active',
          now(), now()
        )
      ON CONFLICT (id) DO NOTHING;
    `)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "vendor_subscription";`)
    this.addSql(`DROP TABLE IF EXISTS "subscription_plan";`)
  }
}
