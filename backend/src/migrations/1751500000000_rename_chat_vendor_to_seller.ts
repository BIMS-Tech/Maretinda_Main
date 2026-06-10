import { Migration } from "@mikro-orm/migrations"

export class Migration1751500000000 extends Migration {
  async up(): Promise<void> {
    // Rename vendor_id → seller_id if the old column still exists
    this.addSql(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'chat_conversation' AND column_name = 'vendor_id'
        ) THEN
          ALTER TABLE "chat_conversation" RENAME COLUMN "vendor_id" TO "seller_id";
        END IF;
      END $$;
    `)

    // Rename unread_vendor → unread_seller if the old column still exists
    this.addSql(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'chat_conversation' AND column_name = 'unread_vendor'
        ) THEN
          ALTER TABLE "chat_conversation" RENAME COLUMN "unread_vendor" TO "unread_seller";
        END IF;
      END $$;
    `)

    // Rename old index if it still exists
    this.addSql(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE tablename = 'chat_conversation' AND indexname = 'chat_conv_vendor_id_idx'
        ) THEN
          ALTER INDEX "chat_conv_vendor_id_idx" RENAME TO "chat_conv_seller_id_idx";
        END IF;
      END $$;
    `)

    // Ensure the new index exists (in case this is a fresh DB where the old migration already used seller_id)
    this.addSql(`CREATE INDEX IF NOT EXISTS "chat_conv_seller_id_idx" ON "chat_conversation" ("seller_id");`)
  }

  async down(): Promise<void> {
    this.addSql(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'chat_conversation' AND column_name = 'seller_id'
        ) THEN
          ALTER TABLE "chat_conversation" RENAME COLUMN "seller_id" TO "vendor_id";
        END IF;
      END $$;
    `)

    this.addSql(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'chat_conversation' AND column_name = 'unread_seller'
        ) THEN
          ALTER TABLE "chat_conversation" RENAME COLUMN "unread_seller" TO "unread_vendor";
        END IF;
      END $$;
    `)

    this.addSql(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE tablename = 'chat_conversation' AND indexname = 'chat_conv_seller_id_idx'
        ) THEN
          ALTER INDEX "chat_conv_seller_id_idx" RENAME TO "chat_conv_vendor_id_idx";
        END IF;
      END $$;
    `)
  }
}
