import { Migration } from "@mikro-orm/migrations"

/**
 * Invoices to the e-invoice template (RMC 98-2026): a unique id for the
 * verification link, whether the document is official (issued under a BIR
 * Permit to Issue), credit notes that point at what they correct, merchant
 * numbers, and a lock: an issued document is never edited or deleted.
 */
export class Migration1771000000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "unique_id" text NULL;`)
    this.addSql(`ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "document" text NOT NULL DEFAULT 'invoice';`)
    this.addSql(`ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "official" boolean NOT NULL DEFAULT false;`)
    this.addSql(`ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "corrects_id" text NULL;`)
    this.addSql(`DROP TRIGGER IF EXISTS "invoice_final" ON "invoice";`)
    this.addSql(`UPDATE "invoice" SET "unique_id" = 'MRT' || upper(substr(md5("id"), 1, 16)) WHERE "unique_id" IS NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "invoice_unique_id_key" ON "invoice" ("unique_id");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "invoice_corrects_idx" ON "invoice" ("corrects_id");`)
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "merchant_number" (
        "seller_id" text   NOT NULL,
        "number"    serial NOT NULL,
        CONSTRAINT "merchant_number_pkey" PRIMARY KEY ("seller_id"),
        CONSTRAINT "merchant_number_key" UNIQUE ("number")
      );
    `)
    this.addSql(`
      CREATE OR REPLACE FUNCTION invoice_is_final() RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'An issued document cannot be changed or deleted; issue a credit note instead';
      END;
      $$ LANGUAGE plpgsql;
    `)
    this.addSql(`
      CREATE TRIGGER "invoice_final" BEFORE UPDATE OR DELETE ON "invoice"
        FOR EACH ROW EXECUTE FUNCTION invoice_is_final();
    `)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TRIGGER IF EXISTS "invoice_final" ON "invoice";`)
    this.addSql(`DROP FUNCTION IF EXISTS invoice_is_final();`)
    this.addSql(`DROP TABLE IF EXISTS "merchant_number";`)
    this.addSql(`ALTER TABLE "invoice" DROP COLUMN IF EXISTS "corrects_id";`)
    this.addSql(`ALTER TABLE "invoice" DROP COLUMN IF EXISTS "official";`)
    this.addSql(`ALTER TABLE "invoice" DROP COLUMN IF EXISTS "document";`)
    this.addSql(`ALTER TABLE "invoice" DROP COLUMN IF EXISTS "unique_id";`)
  }
}
