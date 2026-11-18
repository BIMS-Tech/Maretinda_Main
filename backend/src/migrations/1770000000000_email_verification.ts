import { Migration } from "@mikro-orm/migrations"

/**
 * Email confirmation at sign-up, for buyers and seller applicants.
 *
 * Everyone who already has an account, and every application already sent,
 * counts as confirmed: they signed up before confirmation existed, and their
 * orders and approvals must keep working. This runs once (custom_migration),
 * so only accounts that exist when it ships are let through this way.
 */
export class Migration1770000000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "email_verification_token" (
        "token_hash" text        NOT NULL,
        "kind"       text        NOT NULL,
        "subject_id" text        NOT NULL,
        "email"      text        NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "expires_at" timestamptz NOT NULL,
        "used_at"    timestamptz NULL,
        CONSTRAINT "email_verification_token_pkey" PRIMARY KEY ("token_hash"),
        CONSTRAINT "email_verification_token_kind_check" CHECK ("kind" IN ('customer', 'seller_application'))
      );
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "email_verification_token_subject_idx"
        ON "email_verification_token" ("kind", "subject_id");
    `)
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "customer_email_verified" (
        "customer_id" text        NOT NULL,
        "email"       text        NOT NULL,
        "verified_at" timestamptz NOT NULL DEFAULT now(),
        "method"      text        NOT NULL,
        "verified_by" text        NULL,
        CONSTRAINT "customer_email_verified_pkey" PRIMARY KEY ("customer_id")
      );
    `)
    this.addSql(`
      INSERT INTO "customer_email_verified" ("customer_id", "email", "method")
      SELECT "id", lower("email"), 'existing'
        FROM "customer"
       WHERE "has_account" = true AND "deleted_at" IS NULL AND "email" IS NOT NULL
      ON CONFLICT ("customer_id") DO NOTHING;
    `)
    this.addSql(`ALTER TABLE "seller_application" ADD COLUMN IF NOT EXISTS "email_verified_at" timestamptz NULL;`)
    this.addSql(`ALTER TABLE "seller_application" ADD COLUMN IF NOT EXISTS "email_verified_by" text NULL;`)
    this.addSql(`
      UPDATE "seller_application"
         SET "email_verified_at" = COALESCE("submitted_at", now()), "email_verified_by" = 'existing'
       WHERE "email_verified_at" IS NULL;
    `)
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "seller_application" DROP COLUMN IF EXISTS "email_verified_by";`)
    this.addSql(`ALTER TABLE "seller_application" DROP COLUMN IF EXISTS "email_verified_at";`)
    this.addSql(`DROP TABLE IF EXISTS "customer_email_verified";`)
    this.addSql(`DROP TABLE IF EXISTS "email_verification_token";`)
  }
}
