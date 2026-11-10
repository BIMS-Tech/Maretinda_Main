import { Migration } from "@mikro-orm/migrations"

/**
 * Settlement files (TAMA and DFT) list sellers' bank account numbers. They
 * were written to the public media bucket, where anyone with the link could
 * read them. They're small, so they live here, behind the admin routes.
 */
export class Migration1757000000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "settlement_file" (
        "kind"          text        NOT NULL,
        "generation_id" text        NOT NULL,
        "file_name"     text        NOT NULL,
        "content_type"  text        NOT NULL,
        "content"       bytea       NOT NULL,
        "created_at"    timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "settlement_file_pkey" PRIMARY KEY ("kind", "generation_id")
      );
    `)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "settlement_file";`)
  }
}
