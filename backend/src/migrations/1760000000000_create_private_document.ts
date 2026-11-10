import { Migration } from "@mikro-orm/migrations"

/**
 * Seller applicants' IDs, permits and tax forms. They were uploaded to the
 * public media bucket; they live here now and only admins can open them.
 */
export class Migration1760000000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "private_document" (
        "id"           text        NOT NULL,
        "file_name"    text        NOT NULL,
        "content_type" text        NOT NULL,
        "content"      bytea       NOT NULL,
        "source_url"   text        NULL,
        "created_at"   timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "private_document_pkey" PRIMARY KEY ("id")
      );
    `)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "private_document";`)
  }
}
