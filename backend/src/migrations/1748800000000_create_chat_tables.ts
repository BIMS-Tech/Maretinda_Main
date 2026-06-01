import { Migration } from "@mikro-orm/migrations"

export class Migration1748800000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "chat_conversation" (
        "id"              text        NOT NULL,
        "type"            text        NOT NULL DEFAULT 'vendor_customer',
        "vendor_id"       text        NULL,
        "customer_id"     text        NULL,
        "subject"         text        NULL,
        "status"          text        NOT NULL DEFAULT 'open',
        "last_message_at" timestamptz NULL,
        "unread_vendor"   integer     NOT NULL DEFAULT 0,
        "unread_customer" integer     NOT NULL DEFAULT 0,
        "unread_admin"    integer     NOT NULL DEFAULT 0,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        "updated_at"      timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "chat_conversation_pkey" PRIMARY KEY ("id")
      );
    `)

    this.addSql(`CREATE INDEX IF NOT EXISTS "chat_conv_vendor_id_idx"       ON "chat_conversation" ("vendor_id");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "chat_conv_customer_id_idx"     ON "chat_conversation" ("customer_id");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "chat_conv_last_msg_idx"        ON "chat_conversation" ("last_message_at" DESC NULLS LAST);`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "chat_conv_status_idx"          ON "chat_conversation" ("status");`)

    this.addSql(`
      CREATE TABLE IF NOT EXISTS "chat_message" (
        "id"              text        NOT NULL,
        "conversation_id" text        NOT NULL REFERENCES "chat_conversation"("id") ON DELETE CASCADE,
        "sender_id"       text        NOT NULL,
        "sender_role"     text        NOT NULL,
        "sender_name"     text        NOT NULL DEFAULT '',
        "body"            text        NOT NULL,
        "read_at"         timestamptz NULL,
        "created_at"      timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "chat_message_pkey" PRIMARY KEY ("id")
      );
    `)

    this.addSql(`CREATE INDEX IF NOT EXISTS "chat_msg_conversation_id_idx" ON "chat_message" ("conversation_id");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "chat_msg_created_at_idx"      ON "chat_message" ("created_at");`)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "chat_message";`)
    this.addSql(`DROP TABLE IF EXISTS "chat_conversation";`)
  }
}
