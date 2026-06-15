import { Migration } from "@mikro-orm/migrations"

/**
 * Platform-level shipping tables.
 * Maretinda manages ONE central account per carrier — no per-vendor credentials.
 * Vendors pick a carrier when creating a shipment; Maretinda's account handles billing.
 *
 * Depends on: 1743000000000_create_shipping_tables (seller_shipping_order must exist)
 */
export class Migration1744000000000 extends Migration {
  async up(): Promise<void> {
    // Platform (Maretinda) credentials per provider — admin-managed
    this.addSql(`
      CREATE TABLE IF NOT EXISTS platform_shipping_provider (
        id TEXT PRIMARY KEY,
        provider_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT false,
        credentials JSONB NOT NULL DEFAULT '{}',
        settings JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );
    `)

    // Shipping rate cache — avoids hammering carrier APIs on every checkout
    this.addSql(`
      CREATE TABLE IF NOT EXISTS shipping_rate_cache (
        id TEXT PRIMARY KEY,
        cache_key TEXT NOT NULL UNIQUE,
        provider_id TEXT NOT NULL,
        origin_postal TEXT,
        dest_postal TEXT,
        weight_kg NUMERIC,
        rates JSONB NOT NULL DEFAULT '[]',
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)

    // Extra columns on seller_shipping_order for calculated rates
    // (columns are included in 1743000000000 for fresh DB; this ALTER is a no-op there)
    this.addSql(`
      ALTER TABLE seller_shipping_order
        ADD COLUMN IF NOT EXISTS calculated_rate NUMERIC,
        ADD COLUMN IF NOT EXISTS service_level TEXT DEFAULT 'Standard',
        ADD COLUMN IF NOT EXISTS rate_currency TEXT DEFAULT 'PHP';
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS idx_platform_shipping_provider_id
        ON platform_shipping_provider(provider_id);
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS idx_shipping_rate_cache_key
        ON shipping_rate_cache(cache_key);
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS idx_shipping_rate_cache_expires
        ON shipping_rate_cache(expires_at);
    `)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS shipping_rate_cache;`)
    this.addSql(`DROP TABLE IF EXISTS platform_shipping_provider;`)
    this.addSql(`
      ALTER TABLE seller_shipping_order
        DROP COLUMN IF EXISTS calculated_rate,
        DROP COLUMN IF EXISTS service_level,
        DROP COLUMN IF EXISTS rate_currency;
    `)
  }
}
