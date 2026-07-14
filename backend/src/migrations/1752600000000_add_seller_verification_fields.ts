import { Migration } from "@mikro-orm/migrations"

/**
 * Business verification for sellers.
 *
 * TIN and business documents are collected (optionally) at registration and
 * live on the seller_application. This adds them to the seller itself so an
 * approved seller can view/complete them from Store settings, and so the
 * storefront can tag only fully-verified sellers.
 *
 * verification_status lifecycle:
 *   unverified      -> details incomplete (missing TIN or required documents)
 *   pending_review  -> details complete, awaiting admin confirmation
 *   verified        -> admin confirmed (storefront "Verified" badge shows)
 *   rejected        -> admin rejected (see verification_notes)
 */
export class Migration1752600000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "seller"
      ADD COLUMN IF NOT EXISTS "business_documents"  jsonb,
      ADD COLUMN IF NOT EXISTS "form_of_organization" text,
      ADD COLUMN IF NOT EXISTS "verification_status"  text NOT NULL DEFAULT 'unverified',
      ADD COLUMN IF NOT EXISTS "verified_at"          timestamptz,
      ADD COLUMN IF NOT EXISTS "verification_notes"   text;
    `)
  }

  async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE "seller"
      DROP COLUMN IF EXISTS "business_documents",
      DROP COLUMN IF EXISTS "form_of_organization",
      DROP COLUMN IF EXISTS "verification_status",
      DROP COLUMN IF EXISTS "verified_at",
      DROP COLUMN IF EXISTS "verification_notes";
    `)
  }
}
