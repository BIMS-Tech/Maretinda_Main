import { Migration } from "@mikro-orm/migrations"

/**
 * What each bank file paid: one row per payment per seller. A payment with a
 * row here is never put in another file, so regenerating a date range can't
 * pay a seller twice, and anything without a row is still owed.
 *
 * Every payment made before this table existed is marked "legacy": those
 * were settled from the earlier files, and must not be swept into the next one.
 */
export class Migration1763000000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "settlement_line" (
        "transaction_id"   text        NOT NULL,
        "seller_id"        text        NOT NULL,
        "order_id"         text        NULL,
        "reference_number" text        NULL,
        "kind"             text        NOT NULL,
        "generation_id"    text        NULL,
        "gross_amount"     numeric     NOT NULL DEFAULT 0,
        "net_amount"       numeric     NOT NULL DEFAULT 0,
        "created_at"       timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "settlement_line_pkey" PRIMARY KEY ("transaction_id", "seller_id")
      );
    `)
    this.addSql(`CREATE INDEX IF NOT EXISTS "settlement_line_generation_idx" ON "settlement_line" ("kind", "generation_id");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "settlement_line_seller_idx" ON "settlement_line" ("seller_id");`)
    this.addSql(`
      DO $$
      BEGIN
        IF to_regclass('public.giyapay_transaction') IS NOT NULL THEN
          INSERT INTO "settlement_line" ("transaction_id", "seller_id", "order_id", "reference_number", "kind", "gross_amount")
          SELECT id, COALESCE(NULLIF(seller_id, ''), 'unknown'), order_id, reference_number, 'legacy', amount
            FROM giyapay_transaction
           WHERE status = 'SUCCESS'
          ON CONFLICT DO NOTHING;
        END IF;
      END $$;
    `)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "settlement_line";`)
  }
}
