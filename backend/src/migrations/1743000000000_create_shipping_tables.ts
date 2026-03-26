import { Migration } from "@mikro-orm/migrations"

export class Migration1743000000000 extends Migration {
  async up(): Promise<void> {
    // Vendor shipping credentials (per provider, per seller)
    this.addSql(`
      CREATE TABLE IF NOT EXISTS vendor_shipping_credential (
        id TEXT PRIMARY KEY,
        seller_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        country_code TEXT,
        credentials JSONB NOT NULL DEFAULT '{}',
        is_enabled BOOLEAN NOT NULL DEFAULT false,
        is_default BOOLEAN NOT NULL DEFAULT false,
        access_token TEXT,
        token_expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        UNIQUE(seller_id, provider)
      );
    `)

    // Shipping orders created through third-party carriers
    this.addSql(`
      CREATE TABLE IF NOT EXISTS vendor_shipping_order (
        id TEXT PRIMARY KEY,
        seller_id TEXT NOT NULL,
        medusa_order_id TEXT,
        provider TEXT NOT NULL,
        country_code TEXT,
        provider_order_id TEXT,
        tracking_number TEXT,
        tracking_url TEXT,
        waybill_url TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        amount NUMERIC,
        currency TEXT DEFAULT 'PHP',
        from_details JSONB,
        to_details JSONB,
        parcel_details JSONB,
        provider_request JSONB,
        provider_response JSONB,
        webhook_events JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS idx_vendor_shipping_credential_seller
        ON vendor_shipping_credential(seller_id);
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS idx_vendor_shipping_order_seller
        ON vendor_shipping_order(seller_id);
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS idx_vendor_shipping_order_medusa
        ON vendor_shipping_order(medusa_order_id);
    `)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS vendor_shipping_order;`)
    this.addSql(`DROP TABLE IF EXISTS vendor_shipping_credential;`)
  }
}
