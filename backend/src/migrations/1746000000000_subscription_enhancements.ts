import { Migration } from "@mikro-orm/migrations"

export class Migration1746000000000 extends Migration {
  async up(): Promise<void> {
    // Add yearly_price to subscription_plan
    this.addSql(`ALTER TABLE "subscription_plan" ADD COLUMN IF NOT EXISTS "yearly_price" numeric NULL;`)

    // Seed yearly prices (10 months for the price of 12)
    this.addSql(`UPDATE "subscription_plan" SET "yearly_price" = ROUND("price" * 10) WHERE "id" = 'subplan_foundation';`)
    this.addSql(`UPDATE "subscription_plan" SET "yearly_price" = ROUND("price" * 10) WHERE "id" = 'subplan_boost';`)
    this.addSql(`UPDATE "subscription_plan" SET "yearly_price" = ROUND("price" * 10) WHERE "id" = 'subplan_managed';`)

    // Add billing_period and plan_id to vendor_subscription
    this.addSql(`ALTER TABLE "vendor_subscription" ADD COLUMN IF NOT EXISTS "billing_period" text NOT NULL DEFAULT 'monthly';`)
    this.addSql(`ALTER TABLE "vendor_subscription" ADD COLUMN IF NOT EXISTS "plan_id" text NULL;`)

    // GiyaPay config dedicated to subscription payments
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "giyapay_subscription_config" (
        "id"             text        NOT NULL DEFAULT 'giyapay_sub_config',
        "merchant_id"    text        NOT NULL,
        "merchant_secret" text       NOT NULL,
        "sandbox_mode"   boolean     NOT NULL DEFAULT true,
        "is_enabled"     boolean     NOT NULL DEFAULT false,
        "created_at"     timestamptz NOT NULL DEFAULT now(),
        "updated_at"     timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "giyapay_subscription_config_pkey" PRIMARY KEY ("id")
      );
    `)
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "subscription_plan" DROP COLUMN IF EXISTS "yearly_price";`)
    this.addSql(`ALTER TABLE "vendor_subscription" DROP COLUMN IF EXISTS "billing_period";`)
    this.addSql(`ALTER TABLE "vendor_subscription" DROP COLUMN IF EXISTS "plan_id";`)
    this.addSql(`DROP TABLE IF EXISTS "giyapay_subscription_config";`)
  }
}
