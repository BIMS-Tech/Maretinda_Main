import { Migration } from "@mikro-orm/migrations"

/** Who changed what in the admin: every write an admin makes through the API. */
export class Migration1766000000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "admin_audit_log" (
        "id"         bigserial   NOT NULL,
        "actor_id"   text        NULL,
        "actor_type" text        NULL,
        "method"     text        NOT NULL,
        "path"       text        NOT NULL,
        "status"     integer     NOT NULL,
        "ip"         text        NULL,
        "body"       jsonb       NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id")
      );
    `)
    this.addSql(`CREATE INDEX IF NOT EXISTS "admin_audit_log_created_idx" ON "admin_audit_log" ("created_at" DESC);`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "admin_audit_log_actor_idx" ON "admin_audit_log" ("actor_id");`)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "admin_audit_log";`)
  }
}
