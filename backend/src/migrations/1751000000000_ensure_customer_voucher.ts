import { Migration } from "@mikro-orm/migrations"

export class Migration1751000000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "customer_voucher" (
        "id"             text        NOT NULL DEFAULT gen_random_uuid()::text,
        "customer_id"    text        NOT NULL,
        "promotion_id"   text        NOT NULL,
        "promotion_code" text        NOT NULL,
        "collected_at"   timestamptz NOT NULL DEFAULT now(),
        "used_at"        timestamptz,
        "expires_at"     timestamptz,
        "metadata"       jsonb,
        CONSTRAINT "customer_voucher_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "customer_voucher_unique" UNIQUE ("customer_id", "promotion_id")
      );
    `)
    this.addSql(`CREATE INDEX IF NOT EXISTS "customer_voucher_customer_idx" ON "customer_voucher" ("customer_id");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "customer_voucher_promotion_idx" ON "customer_voucher" ("promotion_id");`)
  }

  async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "customer_voucher_promotion_idx";`)
    this.addSql(`DROP INDEX IF EXISTS "customer_voucher_customer_idx";`)
    this.addSql(`DROP TABLE IF EXISTS "customer_voucher";`)
  }
}
