import { Migration } from '@mikro-orm/migrations';

export class Migration20250128000000 extends Migration {

  override async up(): Promise<void> {
    // Create vendor_shipping_credentials table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "vendor_shipping_credentials" (
        "id" TEXT PRIMARY KEY,
        "vendor_id" TEXT NOT NULL,
        "provider_id" TEXT NOT NULL,
        "credentials" JSONB NOT NULL,
        "is_active" BOOLEAN DEFAULT true,
        "last_used" TIMESTAMPTZ NULL,
        "metadata" JSONB DEFAULT '{}',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        
        -- Ensure one credential per vendor per provider
        UNIQUE("vendor_id", "provider_id")
      );
    `);

    // Create vendor_shipping_config table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "vendor_shipping_config" (
        "id" TEXT PRIMARY KEY,
        "vendor_id" TEXT UNIQUE NOT NULL,
        "enabled_providers" JSONB DEFAULT '[]',
        "default_provider" TEXT NULL,
        "preferences" JSONB DEFAULT '{}',
        "billing_config" JSONB DEFAULT '{}',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Add foreign key constraints
    this.addSql(`
      ALTER TABLE "vendor_shipping_credentials" 
      ADD CONSTRAINT "fk_vendor_shipping_credentials_vendor" 
      FOREIGN KEY ("vendor_id") REFERENCES "seller"("id") ON DELETE CASCADE;
    `);

    this.addSql(`
      ALTER TABLE "vendor_shipping_config" 
      ADD CONSTRAINT "fk_vendor_shipping_config_vendor" 
      FOREIGN KEY ("vendor_id") REFERENCES "seller"("id") ON DELETE CASCADE;
    `);

    // Create indexes for performance
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "idx_vendor_credentials_lookup" 
      ON "vendor_shipping_credentials"("vendor_id", "provider_id", "is_active");
    `);

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "idx_vendor_config_vendor" 
      ON "vendor_shipping_config"("vendor_id");
    `);

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "idx_vendor_credentials_active" 
      ON "vendor_shipping_credentials"("vendor_id") 
      WHERE "is_active" = true;
    `);
  }

  override async down(): Promise<void> {
    // Drop foreign key constraints
    this.addSql(`ALTER TABLE "vendor_shipping_credentials" DROP CONSTRAINT IF EXISTS "fk_vendor_shipping_credentials_vendor";`);
    this.addSql(`ALTER TABLE "vendor_shipping_config" DROP CONSTRAINT IF EXISTS "fk_vendor_shipping_config_vendor";`);
    
    // Drop indexes
    this.addSql(`DROP INDEX IF EXISTS "idx_vendor_credentials_lookup";`);
    this.addSql(`DROP INDEX IF EXISTS "idx_vendor_config_vendor";`);
    this.addSql(`DROP INDEX IF EXISTS "idx_vendor_credentials_active";`);
    
    // Drop tables
    this.addSql(`DROP TABLE IF EXISTS "vendor_shipping_config";`);
    this.addSql(`DROP TABLE IF EXISTS "vendor_shipping_credentials";`);
  }
}


