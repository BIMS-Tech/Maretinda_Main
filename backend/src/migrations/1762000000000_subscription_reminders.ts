import { Migration } from "@mikro-orm/migrations"

/** Which expiry notice a subscription has already been sent: "7d", "1d" or "ended". */
export class Migration1762000000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`ALTER TABLE "seller_subscription" ADD COLUMN IF NOT EXISTS "last_reminder" text NULL;`)
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "seller_subscription" DROP COLUMN IF EXISTS "last_reminder";`)
  }
}
