import { Migration } from "@mikro-orm/migrations"

/** A buyer's report of a product or shop, for an admin to review. */
export class Migration1767000000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "listing_report" (
        "id"             bigserial   NOT NULL,
        "kind"           text        NOT NULL,
        "target_id"      text        NOT NULL,
        "target_label"   text        NULL,
        "target_handle"  text        NULL,
        "seller_id"      text        NULL,
        "reason"         text        NOT NULL,
        "comment"        text        NOT NULL,
        "reporter_email" text        NULL,
        "status"         text        NOT NULL DEFAULT 'open',
        "admin_note"     text        NULL,
        "resolved_by"    text        NULL,
        "resolved_at"    timestamptz NULL,
        "created_at"     timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "listing_report_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "listing_report_kind_check" CHECK ("kind" IN ('product', 'seller')),
        CONSTRAINT "listing_report_status_check" CHECK ("status" IN ('open', 'resolved', 'dismissed'))
      );
    `)
    this.addSql(`CREATE INDEX IF NOT EXISTS "listing_report_status_idx" ON "listing_report" ("status", "created_at" DESC);`)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "listing_report";`)
  }
}
