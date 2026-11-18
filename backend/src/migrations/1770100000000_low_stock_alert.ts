import { Migration } from "@mikro-orm/migrations"

/**
 * Which variants a shop was already warned about, so an alert goes out once
 * when stock runs low and once more when it runs out, not on every order.
 * The row goes away once the variant is restocked above the threshold.
 */
export class Migration1770100000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "low_stock_alert" (
        "variant_id"  text        NOT NULL,
        "level"       text        NOT NULL,
        "available"   integer     NOT NULL,
        "notified_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "low_stock_alert_pkey" PRIMARY KEY ("variant_id"),
        CONSTRAINT "low_stock_alert_level_check" CHECK ("level" IN ('low', 'out'))
      );
    `)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "low_stock_alert";`)
  }
}
