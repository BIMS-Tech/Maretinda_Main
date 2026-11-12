import { Migration } from "@mikro-orm/migrations"

/**
 * Invoices: one per seller order (issued in the seller's name) and one per
 * paid subscription period (issued by the platform operator). The PDF is kept
 * as issued, so a later change to a shop's name or TIN never rewrites history.
 * Numbers run without gaps per issuer, as BIR requires of an invoice series.
 */
export class Migration1761000000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "invoice_series" (
        "issuer"      text    NOT NULL,
        "last_number" integer NOT NULL DEFAULT 0,
        CONSTRAINT "invoice_series_pkey" PRIMARY KEY ("issuer")
      );
    `)
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "invoice" (
        "id"            text        NOT NULL,
        "kind"          text        NOT NULL,
        "reference_id"  text        NOT NULL,
        "issuer"        text        NOT NULL,
        "number"        text        NOT NULL,
        "seller_id"     text        NULL,
        "customer_id"   text        NULL,
        "total"         numeric     NOT NULL DEFAULT 0,
        "data"          jsonb       NOT NULL,
        "pdf"           bytea       NOT NULL,
        "issued_at"     timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "invoice_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "invoice_kind_reference_key" UNIQUE ("kind", "reference_id"),
        CONSTRAINT "invoice_issuer_number_key" UNIQUE ("issuer", "number")
      );
    `)
    this.addSql(`CREATE INDEX IF NOT EXISTS "invoice_seller_idx" ON "invoice" ("seller_id");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "invoice_customer_idx" ON "invoice" ("customer_id");`)
    this.addSql(`ALTER TABLE "seller" ADD COLUMN IF NOT EXISTS "vat_registered" boolean NOT NULL DEFAULT false;`)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "invoice";`)
    this.addSql(`DROP TABLE IF EXISTS "invoice_series";`)
    this.addSql(`ALTER TABLE "seller" DROP COLUMN IF EXISTS "vat_registered";`)
  }
}
