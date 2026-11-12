import { Migration } from "@mikro-orm/migrations"

/**
 * One row each time a buyer is sent to GiyaPay to pay. GiyaPay confirms a
 * payment only by sending the buyer's browser back, so a buyer who pays and
 * then closes the tab leaves no trace. An attempt with no confirmation and no
 * order is the trace: someone can check it against GiyaPay's own records.
 */
export class Migration1765000000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "giyapay_attempt" (
        "id"            text        NOT NULL,
        "cart_id"       text        NOT NULL,
        "amount"        numeric     NOT NULL DEFAULT 0,
        "email"         text        NULL,
        "method"        text        NULL,
        "created_at"    timestamptz NOT NULL DEFAULT now(),
        "resolved_at"   timestamptz NULL,
        "resolved_by"   text        NULL,
        "resolved_note" text        NULL,
        CONSTRAINT "giyapay_attempt_pkey" PRIMARY KEY ("id")
      );
    `)
    this.addSql(`CREATE INDEX IF NOT EXISTS "giyapay_attempt_cart_idx" ON "giyapay_attempt" ("cart_id");`)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "giyapay_attempt";`)
  }
}
