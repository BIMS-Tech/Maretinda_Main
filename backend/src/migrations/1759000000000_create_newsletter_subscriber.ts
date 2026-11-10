import { Migration } from "@mikro-orm/migrations"

/** The storefront newsletter form's list. Emails are stored lowercased. */
export class Migration1759000000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "newsletter_subscriber" (
        "email"      text        NOT NULL,
        "source"     text        NOT NULL DEFAULT 'storefront',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "newsletter_subscriber_pkey" PRIMARY KEY ("email")
      );
    `)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "newsletter_subscriber";`)
  }
}
