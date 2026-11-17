import { Migration } from "@mikro-orm/migrations"

/**
 * The seller application now asks what a marketplace needs to vet a shop:
 * the shop name buyers see, TIN and VAT status, a structured business address,
 * what is sold, and the applicant's recorded consent to the seller terms and
 * the privacy notice.
 */
export class Migration1768000000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "seller_application"
        ADD COLUMN IF NOT EXISTS "shop_name"            text        NULL,
        ADD COLUMN IF NOT EXISTS "vat_registered"       boolean     NULL,
        ADD COLUMN IF NOT EXISTS "business_province"    text        NULL,
        ADD COLUMN IF NOT EXISTS "business_city"        text        NULL,
        ADD COLUMN IF NOT EXISTS "business_barangay"    text        NULL,
        ADD COLUMN IF NOT EXISTS "business_street"      text        NULL,
        ADD COLUMN IF NOT EXISTS "business_postal_code" text        NULL,
        ADD COLUMN IF NOT EXISTS "main_category"        text        NULL,
        ADD COLUMN IF NOT EXISTS "product_count"        text        NULL,
        ADD COLUMN IF NOT EXISTS "product_source"       text        NULL,
        ADD COLUMN IF NOT EXISTS "sells_regulated"      boolean     NULL,
        ADD COLUMN IF NOT EXISTS "store_links"          text        NULL,
        ADD COLUMN IF NOT EXISTS "terms_accepted_at"    timestamptz NULL,
        ADD COLUMN IF NOT EXISTS "terms_version"        text        NULL,
        ADD COLUMN IF NOT EXISTS "privacy_consent_at"   timestamptz NULL;
    `)
    this.addSql(`CREATE INDEX IF NOT EXISTS "seller_application_email_status_idx" ON "seller_application" (lower("email"), "status");`)
  }

  async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE "seller_application"
        DROP COLUMN IF EXISTS "shop_name", DROP COLUMN IF EXISTS "vat_registered",
        DROP COLUMN IF EXISTS "business_province", DROP COLUMN IF EXISTS "business_city",
        DROP COLUMN IF EXISTS "business_barangay", DROP COLUMN IF EXISTS "business_street",
        DROP COLUMN IF EXISTS "business_postal_code", DROP COLUMN IF EXISTS "main_category",
        DROP COLUMN IF EXISTS "product_count", DROP COLUMN IF EXISTS "product_source",
        DROP COLUMN IF EXISTS "sells_regulated", DROP COLUMN IF EXISTS "store_links",
        DROP COLUMN IF EXISTS "terms_accepted_at", DROP COLUMN IF EXISTS "terms_version",
        DROP COLUMN IF EXISTS "privacy_consent_at";
    `)
    this.addSql(`DROP INDEX IF EXISTS "seller_application_email_status_idx";`)
  }
}
