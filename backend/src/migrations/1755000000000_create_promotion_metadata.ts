import { Migration } from "@mikro-orm/migrations"

/**
 * Medusa's promotion table has no metadata column, so seller scope, first-order
 * rules and voucher descriptions were silently never saved. They live here now.
 * If a database did get a hand-added promotion.metadata column, keep its values.
 */
export class Migration1755000000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "promotion_metadata" (
        "promotion_id" text        NOT NULL,
        "metadata"     jsonb       NOT NULL DEFAULT '{}',
        "created_at"   timestamptz NOT NULL DEFAULT now(),
        "updated_at"   timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "promotion_metadata_pkey" PRIMARY KEY ("promotion_id")
      );
    `)
    this.addSql(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
           WHERE table_name = 'promotion' AND column_name = 'metadata'
        ) THEN
          EXECUTE 'INSERT INTO promotion_metadata (promotion_id, metadata)
                   SELECT id, metadata FROM promotion WHERE metadata IS NOT NULL
                   ON CONFLICT (promotion_id) DO NOTHING';
        END IF;
      END $$;
    `)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "promotion_metadata";`)
  }
}
