/**
 * Custom Migrations Runner
 *
 * Usage (inside the backend image):
 *   node .medusa/server/src/scripts/run-custom-migrations.js
 *
 * `medusa db:migrate` only runs module migrations, never src/migrations, so
 * these used to be applied by hand and production ended up missing some (the
 * seller verification columns). deploy/scripts/release.sh runs this right
 * after db:migrate.
 *
 * Each file runs once, in its own transaction, and is recorded in
 * custom_migration. Re-running is not safe: several files rewrite
 * subscription_plan rows and would undo edits made in the admin.
 */

import { readdirSync } from "fs"
import path from "path"
import { Client } from "pg"

// Already applied to production by hand before this runner existed. On a
// database that has the custom schema but no custom_migration table they are
// recorded without running; a fresh database runs everything.
const BASELINE = [
  "1734480000000_add_seller_bank_fields",
  "1743000000000_create_shipping_tables",
  "1744000000000_create_platform_shipping",
  "1745800000000_create_subscription_tables",
  "1746000000000_subscription_enhancements",
  "1747100000000_create_customer_voucher",
  "1748400000000_create_seller_application",
  "1748450000000_add_seller_application_auth_identity",
  "1748800000000_create_chat_tables",
  "1749500000000_create_seller_promotion",
  "1750000000000_create_site_settings",
  "1751000000000_ensure_customer_voucher",
  "1751500000000_rename_chat_vendor_to_seller",
  "1752000000000_add_seller_application_promo_code",
  "1752000000000_create_product_3d_models",
  "1753000000000_trial_period_and_rename_plans",
  "1754000000000_create_seller_reels",
]

const MIGRATIONS_DIR = path.join(__dirname, "..", "migrations")

// The files are MikroORM migrations that only call this.addSql() in up(), so
// collect those statements without standing up a MikroORM instance
async function collectSql(file: string): Promise<string[]> {
  const mod = require(path.join(MIGRATIONS_DIR, file))
  const MigrationClass = Object.values(mod).find((v) => typeof v === "function") as any
  if (!MigrationClass) {
    throw new Error(`${file} exports no migration class`)
  }
  const statements: string[] = []
  const migration = Object.create(MigrationClass.prototype)
  migration.addSql = (sql: string) => statements.push(sql)
  await migration.up()
  return statements
}

async function main() {
  const names = readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d+_.+\.js$/.test(f))
    .map((f) => f.replace(/\.js$/, ""))
    .sort()

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ...(process.env.DATABASE_SSL === "false" ? { ssl: false } : {}),
  })
  await client.connect()

  try {
    const { rows: [state] } = await client.query(`
      SELECT to_regclass('public.custom_migration') IS NULL AS untracked,
             to_regclass('public.subscription_plan') IS NOT NULL AS has_custom_schema
    `)

    if (state.untracked) {
      // One transaction, so a table without its baseline can never exist
      // (that would re-run every migration on the next deploy)
      await client.query("BEGIN")
      await client.query(`
        CREATE TABLE "custom_migration" (
          "name"       text        NOT NULL PRIMARY KEY,
          "applied_at" timestamptz NOT NULL DEFAULT now()
        )
      `)
      if (state.has_custom_schema) {
        await client.query(
          `INSERT INTO "custom_migration" ("name") SELECT unnest($1::text[])`,
          [BASELINE]
        )
        console.log(`[custom-migrations] recorded ${BASELINE.length} previously applied migrations`)
      }
      await client.query("COMMIT")
    }

    const { rows } = await client.query(`SELECT "name" FROM "custom_migration"`)
    const applied = new Set(rows.map((r) => r.name))
    const pending = names.filter((n) => !applied.has(n))

    for (const name of pending) {
      const statements = await collectSql(`${name}.js`)
      await client.query("BEGIN")
      try {
        for (const sql of statements) {
          await client.query(sql)
        }
        await client.query(`INSERT INTO "custom_migration" ("name") VALUES ($1)`, [name])
        await client.query("COMMIT")
      } catch (e) {
        await client.query("ROLLBACK")
        throw new Error(`${name} failed: ${(e as Error).message}`)
      }
      console.log(`[custom-migrations] applied ${name}`)
    }

    if (!pending.length) {
      console.log("[custom-migrations] up to date")
    }
  } finally {
    await client.end()
  }
}

main().catch((e) => {
  console.error(`[custom-migrations] ${e.message}`)
  process.exit(1)
})
