import { Migration } from "@mikro-orm/migrations"

export class Migration1753000000000 extends Migration {
  async up(): Promise<void> {
    // Add trial control columns to subscription_plan
    this.addSql(`ALTER TABLE "subscription_plan" ADD COLUMN IF NOT EXISTS "trial_days" integer NOT NULL DEFAULT 0;`)
    this.addSql(`ALTER TABLE "subscription_plan" ADD COLUMN IF NOT EXISTS "yearly_discount_percent" numeric NULL;`)

    // Add trial tracking columns to seller_subscription
    this.addSql(`ALTER TABLE "seller_subscription" ADD COLUMN IF NOT EXISTS "is_trial" boolean NOT NULL DEFAULT false;`)
    this.addSql(`ALTER TABLE "seller_subscription" ADD COLUMN IF NOT EXISTS "trial_ends_at" timestamptz NULL;`)

    // Rename plans: Foundation→Starter, Boost→Growth, Managed→Premium
    // Also update prices and features to match the new design
    this.addSql(`
      UPDATE "subscription_plan" SET
        "name" = 'Starter',
        "price" = 499,
        "yearly_price" = 4990,
        "yearly_discount_percent" = 17,
        "trial_days" = 7,
        "features" = '{"max_products": 50, "analytics": "basic", "storefront": "standard", "staff_accounts": 1, "giyapay_payments": true, "inventory": "standard", "support": "email", "flash_sales": false, "subscription_products": false, "dedicated_manager": false, "sla": false, "model_3d": false}'::jsonb,
        "updated_at" = now()
      WHERE "name" = 'Foundation';
    `)

    this.addSql(`
      UPDATE "subscription_plan" SET
        "name" = 'Growth',
        "price" = 1499,
        "yearly_price" = 14990,
        "yearly_discount_percent" = 17,
        "trial_days" = 7,
        "features" = '{"max_products": 500, "analytics": "advanced", "storefront": "standard", "staff_accounts": 5, "giyapay_payments": true, "inventory": "smart", "support": "priority", "flash_sales": true, "subscription_products": true, "dedicated_manager": false, "sla": false, "model_3d": "coming_soon"}'::jsonb,
        "updated_at" = now()
      WHERE "name" = 'Boost';
    `)

    this.addSql(`
      UPDATE "subscription_plan" SET
        "name" = 'Premium',
        "price" = 3999,
        "yearly_price" = 39990,
        "yearly_discount_percent" = 17,
        "trial_days" = 7,
        "features" = '{"max_products": -1, "analytics": "premium", "storefront": "standard", "staff_accounts": 15, "giyapay_payments": true, "inventory": "advanced", "support": "dedicated", "flash_sales": true, "subscription_products": true, "dedicated_manager": true, "sla": true, "model_3d": "coming_soon"}'::jsonb,
        "updated_at" = now()
      WHERE "name" = 'Managed';
    `)

    // Update plan_name references in existing subscriptions
    this.addSql(`UPDATE "seller_subscription" SET "plan_name" = 'Starter' WHERE "plan_name" = 'Foundation';`)
    this.addSql(`UPDATE "seller_subscription" SET "plan_name" = 'Growth' WHERE "plan_name" = 'Boost';`)
    this.addSql(`UPDATE "seller_subscription" SET "plan_name" = 'Premium' WHERE "plan_name" = 'Managed';`)

    // Seed for fresh installations (no existing plans)
    this.addSql(`
      INSERT INTO "subscription_plan" ("id", "name", "price", "yearly_price", "yearly_discount_percent", "trial_days", "features", "status", "created_at", "updated_at")
      VALUES
        (
          'subplan_foundation',
          'Starter',
          499, 4990, 17, 7,
          '{"max_products": 50, "analytics": "basic", "storefront": "standard", "staff_accounts": 1, "giyapay_payments": true, "inventory": "standard", "support": "email", "flash_sales": false, "subscription_products": false, "dedicated_manager": false, "sla": false, "model_3d": false}'::jsonb,
          'active', now(), now()
        ),
        (
          'subplan_boost',
          'Growth',
          1499, 14990, 17, 7,
          '{"max_products": 500, "analytics": "advanced", "storefront": "standard", "staff_accounts": 5, "giyapay_payments": true, "inventory": "smart", "support": "priority", "flash_sales": true, "subscription_products": true, "dedicated_manager": false, "sla": false, "model_3d": "coming_soon"}'::jsonb,
          'active', now(), now()
        ),
        (
          'subplan_managed',
          'Premium',
          3999, 39990, 17, 7,
          '{"max_products": -1, "analytics": "premium", "storefront": "standard", "staff_accounts": 15, "giyapay_payments": true, "inventory": "advanced", "support": "dedicated", "flash_sales": true, "subscription_products": true, "dedicated_manager": true, "sla": true, "model_3d": "coming_soon"}'::jsonb,
          'active', now(), now()
        )
      ON CONFLICT (id) DO NOTHING;
    `)
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "subscription_plan" DROP COLUMN IF EXISTS "trial_days";`)
    this.addSql(`ALTER TABLE "subscription_plan" DROP COLUMN IF EXISTS "yearly_discount_percent";`)
    this.addSql(`ALTER TABLE "seller_subscription" DROP COLUMN IF EXISTS "is_trial";`)
    this.addSql(`ALTER TABLE "seller_subscription" DROP COLUMN IF EXISTS "trial_ends_at";`)

    this.addSql(`UPDATE "subscription_plan" SET "name" = 'Foundation', "price" = 999 WHERE "name" = 'Starter';`)
    this.addSql(`UPDATE "subscription_plan" SET "name" = 'Boost', "price" = 2499 WHERE "name" = 'Growth';`)
    this.addSql(`UPDATE "subscription_plan" SET "name" = 'Managed', "price" = 5999 WHERE "name" = 'Premium';`)

    this.addSql(`UPDATE "seller_subscription" SET "plan_name" = 'Foundation' WHERE "plan_name" = 'Starter';`)
    this.addSql(`UPDATE "seller_subscription" SET "plan_name" = 'Boost' WHERE "plan_name" = 'Growth';`)
    this.addSql(`UPDATE "seller_subscription" SET "plan_name" = 'Managed' WHERE "plan_name" = 'Premium';`)
  }
}
