import { readdirSync } from "fs"
import path from "path"
import { sign } from "jsonwebtoken"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createApiKeysWorkflow } from "@medusajs/core-flows"

/**
 * Shared setup for HTTP integration tests.
 *
 * The test runner only applies module migrations; our own tables
 * (subscriptions, vouchers, shipping, chat, reels…) live in src/migrations and
 * are applied in production by src/scripts/run-custom-migrations.ts. Apply them
 * the same way here, once per suite: the runner TRUNCATEs every table between
 * tests but never drops them.
 */
export async function applyCustomMigrations(container: any) {
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const dir = path.join(__dirname, "..", "src", "migrations")
  const files = readdirSync(dir)
    .filter((f) => /^\d+_.+\.ts$/.test(f))
    .sort()

  // The support-assistant tables need pgvector, which a stock local Postgres
  // doesn't ship. Nothing else depends on them, so skip rather than fail.
  const { rows } = await pg.raw(`SELECT 1 FROM pg_available_extensions WHERE name = 'vector'`)
  const hasVector = rows.length > 0

  for (const file of files) {
    const mod = require(path.join(dir, file))
    const MigrationClass = Object.values(mod).find((v) => typeof v === "function") as any
    const statements: string[] = []
    const migration = Object.create(MigrationClass.prototype)
    migration.addSql = (sql: string) => statements.push(sql)
    await migration.up()
    if (!hasVector && statements.some((s) => /EXTENSION IF NOT EXISTS vector/i.test(s))) {
      console.warn(`[integration-tests] pgvector not installed, skipping ${file}`)
      continue
    }
    for (const sql of statements) await pg.raw(sql)
  }
}

export const pgOf = (container: any) => container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

const jwtSecret = () => process.env.JWT_SECRET || "supersecret"

/**
 * Tokens are minted directly rather than via /auth/*: Mercur creates sellers
 * through an admin-approved request handled by subscribers, which don't run
 * in MEDUSA_WORKER_MODE=server. The shape matches what Medusa's auth routes
 * issue, so every authenticate() middleware accepts it.
 */
export function tokenFor(actor_type: "customer" | "seller" | "user", actor_id: string) {
  return sign(
    { actor_id, actor_type, auth_identity_id: `authid_${actor_id}`, app_metadata: {} },
    jwtSecret(),
    { expiresIn: "1h" }
  )
}

export const bearer = (token: string) => ({ authorization: `Bearer ${token}` })

export async function createPublishableKey(container: any): Promise<string> {
  const { result } = await createApiKeysWorkflow(container).run({
    input: { api_keys: [{ title: "integration tests", type: "publishable", created_by: "test" }] },
  })
  return result[0].token
}

let seq = 0

export async function createSeller(container: any, over: Record<string, any> = {}) {
  const sellerModule = container.resolve("seller")
  const n = ++seq
  const [seller] = await sellerModule.createSellers([
    { name: `Test Shop ${n}`, handle: `test-shop-${n}-${Date.now()}`, ...over },
  ])
  const [member] = await sellerModule.createMembers([
    { name: `Owner ${n}`, email: `owner${n}@example.test`, seller_id: seller.id },
  ])
  return { seller, member, token: tokenFor("seller", member.id) }
}

export async function createCustomer(container: any, over: Record<string, any> = {}) {
  const customerModule = container.resolve(Modules.CUSTOMER)
  const n = ++seq
  const customer = await customerModule.createCustomers({
    email: `buyer${n}-${Date.now()}@example.test`,
    first_name: "Test",
    last_name: `Buyer ${n}`,
    // A token means a signed-in, registered customer; guest checkouts have no account
    has_account: true,
    ...over,
  })
  return { customer, token: tokenFor("customer", customer.id) }
}

export async function createAdmin(container: any) {
  const userModule = container.resolve(Modules.USER)
  const user = await userModule.createUsers({ email: `admin${++seq}-${Date.now()}@example.test` })
  return { user, token: tokenFor("user", user.id) }
}

/**
 * Mirrors the fresh-install seed in 1753000000000_trial_period_and_rename_plans,
 * with the one-month trial from 1756000000000_one_month_free_trial.
 * Upserts because the first test still sees the rows the migration inserted.
 */
export async function seedPlans(container: any) {
  await pgOf(container)("subscription_plan")
    .insert([
      { id: "subplan_foundation", name: "Starter", price: 499, yearly_price: 4990, trial_days: 30, status: "active" },
      { id: "subplan_boost", name: "Growth", price: 1499, yearly_price: 14990, trial_days: 30, status: "active" },
      { id: "subplan_managed", name: "Premium", price: 3999, yearly_price: 39990, trial_days: 30, status: "active" },
    ])
    .onConflict("id")
    .merge()
}

const DAY = 24 * 60 * 60 * 1000

/**
 * Puts a seller on an active Growth plan. Sellers without one can't change
 * their shop (the plan gate), so any test that writes through /vendor needs it.
 */
export async function givePlan(container: any, sellerId: string, over: Record<string, any> = {}) {
  await pgOf(container)("seller_subscription").insert({
    id: `vsub_test_${++seq}_${Date.now()}`,
    seller_id: sellerId,
    plan_name: "Growth",
    price: 1499,
    start_date: new Date(Date.now() - DAY),
    end_date: new Date(Date.now() + 29 * DAY),
    status: "active",
    ...over,
  })
}

/** Every request to a non-2xx status resolves instead of throwing. */
export const noThrow = { validateStatus: () => true }

/** axios 0.21 can't send a browser FormData, so build the multipart body by hand. */
export function multipart(name: string, type: string, bytes: Buffer) {
  const boundary = "----maretindatest"
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${name}"\r\nContent-Type: ${type}\r\n\r\n`
    ),
    bytes,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ])
  return { body, headers: { "content-type": `multipart/form-data; boundary=${boundary}` } }
}
