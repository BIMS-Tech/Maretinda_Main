import { Migration } from "@mikro-orm/migrations"

export class Migration1749500000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "seller_promotion" (
        "seller_id"    text NOT NULL,
        "promotion_id" text NOT NULL,
        "created_at"   timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "seller_promotion_pkey" PRIMARY KEY ("seller_id", "promotion_id")
      );
    `)
    this.addSql(`CREATE INDEX IF NOT EXISTS "seller_promotion_seller_idx" ON "seller_promotion" ("seller_id");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "seller_promotion_promotion_idx" ON "seller_promotion" ("promotion_id");`)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "seller_promotion";`)
  }
}
