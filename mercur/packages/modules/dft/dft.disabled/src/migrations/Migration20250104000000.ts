import { Migration } from '@mikro-orm/migrations'

export class Migration20250104000000 extends Migration {
  override async up(): Promise<void> {
    // Create dft_configuration table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "dft_configuration" (
        "id" text NOT NULL,
        "seller_id" text NOT NULL,
        "bank_name" text NOT NULL,
        "bank_code" text NULL,
        "swift_code" text NOT NULL,
        "bank_address" text NOT NULL,
        "beneficiary_name" text NOT NULL,
        "beneficiary_code" text NOT NULL,
        "beneficiary_address" text NOT NULL,
        "account_number" text NOT NULL,
        "remittance_type" text NOT NULL DEFAULT 'TT',
        "currency" text NOT NULL DEFAULT 'PHP',
        "charge_type" text NOT NULL DEFAULT '0',
        "source_account" text NOT NULL,
        "is_verified" boolean NOT NULL DEFAULT false,
        "verification_date" timestamptz NULL,
        "created_by" text NULL,
        "notes" text NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "dft_configuration_pkey" PRIMARY KEY ("id")
      );
    `)

    // Create indexes for dft_configuration
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dft_configuration_seller_id" ON "dft_configuration" (seller_id) WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dft_configuration_deleted_at" ON "dft_configuration" (deleted_at) WHERE deleted_at IS NULL;`)

    // Create dft_generation table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "dft_generation" (
        "id" text NOT NULL,
        "batch_id" text NOT NULL UNIQUE,
        "generation_date" timestamptz NOT NULL,
        "file_name" text NOT NULL,
        "file_path" text NULL,
        "status" text CHECK ("status" IN ('pending', 'generated', 'downloaded', 'processed', 'failed')) NOT NULL DEFAULT 'pending',
        "total_amount" numeric NOT NULL,
        "transaction_count" integer NOT NULL,
        "currency" text NOT NULL DEFAULT 'PHP',
        "generated_by" text NOT NULL,
        "processed_at" timestamptz NULL,
        "downloaded_at" timestamptz NULL,
        "file_size" integer NULL,
        "checksum" text NULL,
        "notes" text NULL,
        "error_message" text NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "dft_generation_pkey" PRIMARY KEY ("id")
      );
    `)

    // Create indexes for dft_generation
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dft_generation_batch_id" ON "dft_generation" (batch_id) WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dft_generation_status" ON "dft_generation" (status) WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dft_generation_deleted_at" ON "dft_generation" (deleted_at) WHERE deleted_at IS NULL;`)

    // Create dft_transaction table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "dft_transaction" (
        "id" text NOT NULL,
        "dft_generation_id" text NOT NULL,
        "payout_id" text NOT NULL,
        "order_id" text NULL,
        "seller_id" text NOT NULL,
        "amount" numeric NOT NULL,
        "currency" text NOT NULL DEFAULT 'PHP',
        "beneficiary_name" text NOT NULL,
        "beneficiary_code" text NOT NULL,
        "beneficiary_account" text NOT NULL,
        "beneficiary_address" text NOT NULL,
        "swift_code" text NOT NULL,
        "bank_address" text NOT NULL,
        "remittance_type" text NOT NULL DEFAULT 'TT',
        "source_account" text NOT NULL,
        "purpose" text NOT NULL,
        "charge_type" text NOT NULL DEFAULT '0',
        "status" text CHECK ("status" IN ('pending', 'included', 'processed', 'failed', 'excluded')) NOT NULL DEFAULT 'pending',
        "line_number" integer NULL,
        "transaction_date" timestamptz NOT NULL,
        "error_message" text NULL,
        "retry_count" integer NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "dft_transaction_pkey" PRIMARY KEY ("id")
      );
    `)

    // Create indexes for dft_transaction
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dft_transaction_generation_id" ON "dft_transaction" (dft_generation_id) WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dft_transaction_payout_id" ON "dft_transaction" (payout_id) WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dft_transaction_seller_id" ON "dft_transaction" (seller_id) WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dft_transaction_status" ON "dft_transaction" (status) WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_dft_transaction_deleted_at" ON "dft_transaction" (deleted_at) WHERE deleted_at IS NULL;`)

    // Add foreign key constraints
    this.addSql(`ALTER TABLE "dft_transaction" ADD CONSTRAINT "FK_dft_transaction_generation" FOREIGN KEY ("dft_generation_id") REFERENCES "dft_generation" ("id") ON DELETE CASCADE;`)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "dft_transaction";`)
    this.addSql(`DROP TABLE IF EXISTS "dft_generation";`)
    this.addSql(`DROP TABLE IF EXISTS "dft_configuration";`)
  }
}
