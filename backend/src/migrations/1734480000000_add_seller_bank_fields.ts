import { Migration } from "@mikro-orm/migrations"

export class Migration1734480000000 extends Migration {
  async up(): Promise<void> {
    // Add bank fields to seller table
    this.addSql(`
      ALTER TABLE "seller"
      ADD COLUMN IF NOT EXISTS "bank_name" text,
      ADD COLUMN IF NOT EXISTS "account_number" text,
      ADD COLUMN IF NOT EXISTS "account_name" text,
      ADD COLUMN IF NOT EXISTS "branch_name" text,
      ADD COLUMN IF NOT EXISTS "swift_code" text,
      ADD COLUMN IF NOT EXISTS "beneficiary_address" text,
      ADD COLUMN IF NOT EXISTS "beneficiary_bank_address" text,
      ADD COLUMN IF NOT EXISTS "dft_bank_name" text,
      ADD COLUMN IF NOT EXISTS "dft_bank_code" text,
      ADD COLUMN IF NOT EXISTS "dft_swift_code" text,
      ADD COLUMN IF NOT EXISTS "dft_bank_address" text,
      ADD COLUMN IF NOT EXISTS "dft_beneficiary_name" text,
      ADD COLUMN IF NOT EXISTS "dft_beneficiary_code" text,
      ADD COLUMN IF NOT EXISTS "dft_beneficiary_address" text,
      ADD COLUMN IF NOT EXISTS "dft_account_number" text;
    `)
  }

  async down(): Promise<void> {
    // Remove bank fields from seller table
    this.addSql(`
      ALTER TABLE "seller"
      DROP COLUMN IF EXISTS "bank_name",
      DROP COLUMN IF EXISTS "account_number",
      DROP COLUMN IF EXISTS "account_name",
      DROP COLUMN IF EXISTS "branch_name",
      DROP COLUMN IF EXISTS "swift_code",
      DROP COLUMN IF EXISTS "beneficiary_address",
      DROP COLUMN IF EXISTS "beneficiary_bank_address",
      DROP COLUMN IF EXISTS "dft_bank_name",
      DROP COLUMN IF EXISTS "dft_bank_code",
      DROP COLUMN IF EXISTS "dft_swift_code",
      DROP COLUMN IF EXISTS "dft_bank_address",
      DROP COLUMN IF EXISTS "dft_beneficiary_name",
      DROP COLUMN IF EXISTS "dft_beneficiary_code",
      DROP COLUMN IF EXISTS "dft_beneficiary_address",
      DROP COLUMN IF EXISTS "dft_account_number";
    `)
  }
}



