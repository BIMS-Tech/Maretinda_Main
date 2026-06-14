import { Client } from "pg"
import * as dotenv from "dotenv"

/**
 * Applies the plan rename + trial-period changes to the subscription tables.
 *
 * Mirrors migration 1753000000000_trial_period_and_rename_plans.ts but runnable
 * directly against DATABASE_URL (the custom mikro-orm migrations are not picked
 * up by `medusa db:migrate`, which only runs module migrations).
 *
 * Usage: npx tsx src/scripts/apply-subscription-rename.ts
 */

dotenv.config()

function resolveDbUrl(): string {
  const raw = process.env.DATABASE_URL || ""
  // .env stores the URL with a literal $DB_NAME placeholder
  return raw.replace(/\$DB_NAME/g, process.env.DB_NAME || "")
}

async function run() {
  const client = new Client({ connectionString: resolveDbUrl() })
  await client.connect()
  console.log("✅ Connected to database")

  try {
    // 1. Schema: add trial + discount columns (idempotent)
    await client.query(`ALTER TABLE "subscription_plan" ADD COLUMN IF NOT EXISTS "trial_days" integer NOT NULL DEFAULT 0;`)
    await client.query(`ALTER TABLE "subscription_plan" ADD COLUMN IF NOT EXISTS "yearly_discount_percent" numeric NULL;`)
    await client.query(`ALTER TABLE "seller_subscription" ADD COLUMN IF NOT EXISTS "is_trial" boolean NOT NULL DEFAULT false;`)
    await client.query(`ALTER TABLE "seller_subscription" ADD COLUMN IF NOT EXISTS "trial_ends_at" timestamptz NULL;`)
    console.log("✅ Columns ensured (trial_days, yearly_discount_percent, is_trial, trial_ends_at)")

    // 2. Rename + reprice + refresh features
    await client.query(`
      UPDATE "subscription_plan" SET
        "name" = 'Starter', "price" = 499, "yearly_price" = 4990, "yearly_discount_percent" = 17, "trial_days" = 7,
        "features" = '{"max_products": 50, "analytics": "basic", "storefront": "standard", "staff_accounts": 1, "giyapay_payments": true, "inventory": "standard", "support": "email", "flash_sales": false, "subscription_products": false, "dedicated_manager": false, "sla": false, "model_3d": false}'::jsonb,
        "updated_at" = now()
      WHERE "name" IN ('Foundation', 'Starter') OR "id" = 'subplan_foundation';
    `)
    await client.query(`
      UPDATE "subscription_plan" SET
        "name" = 'Growth', "price" = 1499, "yearly_price" = 14990, "yearly_discount_percent" = 17, "trial_days" = 7,
        "features" = '{"max_products": 500, "analytics": "advanced", "storefront": "standard", "staff_accounts": 5, "giyapay_payments": true, "inventory": "smart", "support": "priority", "flash_sales": true, "subscription_products": true, "dedicated_manager": false, "sla": false, "model_3d": "coming_soon"}'::jsonb,
        "updated_at" = now()
      WHERE "name" IN ('Boost', 'Growth') OR "id" = 'subplan_boost';
    `)
    await client.query(`
      UPDATE "subscription_plan" SET
        "name" = 'Premium', "price" = 3999, "yearly_price" = 39990, "yearly_discount_percent" = 17, "trial_days" = 7,
        "features" = '{"max_products": -1, "analytics": "premium", "storefront": "standard", "staff_accounts": 15, "giyapay_payments": true, "inventory": "advanced", "support": "dedicated", "flash_sales": true, "subscription_products": true, "dedicated_manager": true, "sla": true, "model_3d": "coming_soon"}'::jsonb,
        "updated_at" = now()
      WHERE "name" IN ('Managed', 'Premium') OR "id" = 'subplan_managed';
    `)
    console.log("✅ Plans renamed/repriced (Starter / Growth / Premium)")

    // 3. Update existing subscription rows that reference the old names
    await client.query(`UPDATE "seller_subscription" SET "plan_name" = 'Starter' WHERE "plan_name" = 'Foundation';`)
    await client.query(`UPDATE "seller_subscription" SET "plan_name" = 'Growth'  WHERE "plan_name" = 'Boost';`)
    await client.query(`UPDATE "seller_subscription" SET "plan_name" = 'Premium' WHERE "plan_name" = 'Managed';`)
    console.log("✅ Existing subscriptions remapped to new plan names")

    const { rows } = await client.query(
      `SELECT name, price, yearly_price, yearly_discount_percent, trial_days FROM subscription_plan ORDER BY price`
    )
    console.table(rows)
    console.log("🎉 Done.")
  } finally {
    await client.end()
  }
}

run().catch((err) => {
  console.error("❌ Failed:", err.message)
  process.exit(1)
})
