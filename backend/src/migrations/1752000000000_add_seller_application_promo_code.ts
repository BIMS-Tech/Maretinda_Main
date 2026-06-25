import { Migration } from "@mikro-orm/migrations"

export class Migration1752000000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`ALTER TABLE "seller_application" ADD COLUMN IF NOT EXISTS "promo_code" text NULL;`)
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "seller_application" DROP COLUMN IF EXISTS "promo_code";`)
  }
}
