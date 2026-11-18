import { Migration } from "@mikro-orm/migrations"

/**
 * Admin roles (what each admin may change) and two-step sign-in (an
 * authenticator code after the password). Everyone who is an admin today
 * becomes an owner, so nobody loses access when this ships.
 */
export class Migration1769000000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "admin_role" (
        "email"      text        NOT NULL,
        "role"       text        NOT NULL,
        "updated_by" text        NULL,
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "admin_role_pkey" PRIMARY KEY ("email"),
        CONSTRAINT "admin_role_role_check" CHECK ("role" IN ('owner', 'manager', 'finance', 'support', 'viewer'))
      );
    `)
    this.addSql(`
      INSERT INTO "admin_role" ("email", "role", "updated_by")
      SELECT lower("email"), 'owner', 'migration'
        FROM "user" WHERE "deleted_at" IS NULL AND "email" IS NOT NULL
      ON CONFLICT ("email") DO NOTHING;
    `)
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "admin_mfa" (
        "user_id"        text        NOT NULL,
        "secret_enc"     text        NOT NULL,
        "enabled_at"     timestamptz NULL,
        "last_step"      bigint      NULL,
        "recovery_hashes" jsonb      NOT NULL DEFAULT '[]'::jsonb,
        "created_at"     timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "admin_mfa_pkey" PRIMARY KEY ("user_id")
      );
    `)
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "admin_mfa_session" (
        "token_hash"  text        NOT NULL,
        "user_id"     text        NOT NULL,
        "verified_at" timestamptz NOT NULL DEFAULT now(),
        "expires_at"  timestamptz NOT NULL,
        CONSTRAINT "admin_mfa_session_pkey" PRIMARY KEY ("token_hash")
      );
    `)
    this.addSql(`CREATE INDEX IF NOT EXISTS "admin_mfa_session_user_idx" ON "admin_mfa_session" ("user_id");`)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "admin_mfa_session";`)
    this.addSql(`DROP TABLE IF EXISTS "admin_mfa";`)
    this.addSql(`DROP TABLE IF EXISTS "admin_role";`)
  }
}
