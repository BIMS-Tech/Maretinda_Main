import { Migration } from "@mikro-orm/migrations"

/**
 * Cash a courier collected on delivery travels courier -> Maretinda -> seller.
 * These columns record each hop on the booking, so cash that was collected but
 * never arrived, or arrived but was never passed on, shows up as outstanding.
 */
export class Migration1764000000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "seller_shipping_order"
        ADD COLUMN IF NOT EXISTS "cod_received_at"  timestamptz NULL,
        ADD COLUMN IF NOT EXISTS "cod_received_ref" text NULL,
        ADD COLUMN IF NOT EXISTS "cod_paid_at"      timestamptz NULL,
        ADD COLUMN IF NOT EXISTS "cod_paid_ref"     text NULL;
    `)
  }

  async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE "seller_shipping_order"
        DROP COLUMN IF EXISTS "cod_received_at", DROP COLUMN IF EXISTS "cod_received_ref",
        DROP COLUMN IF EXISTS "cod_paid_at", DROP COLUMN IF EXISTS "cod_paid_ref";
    `)
  }
}
