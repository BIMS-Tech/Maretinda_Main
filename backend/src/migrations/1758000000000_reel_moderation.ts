import { Migration } from "@mikro-orm/migrations"

/**
 * Admins can hide a seller's reel. Kept apart from the seller's own status
 * (draft/published/archived) so a seller can't republish a hidden reel.
 */
export class Migration1758000000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`ALTER TABLE "seller_reel" ADD COLUMN IF NOT EXISTS "moderation_status" text NOT NULL DEFAULT 'visible';`)
    this.addSql(`ALTER TABLE "seller_reel" ADD COLUMN IF NOT EXISTS "moderation_reason" text NULL;`)
    this.addSql(`ALTER TABLE "seller_reel" ADD COLUMN IF NOT EXISTS "moderated_at" timestamptz NULL;`)
    this.addSql(`ALTER TABLE "seller_reel" ADD COLUMN IF NOT EXISTS "moderated_by" text NULL;`)
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "seller_reel" DROP COLUMN IF EXISTS "moderation_status", DROP COLUMN IF EXISTS "moderation_reason", DROP COLUMN IF EXISTS "moderated_at", DROP COLUMN IF EXISTS "moderated_by";`)
  }
}
