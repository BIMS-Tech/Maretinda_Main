import { Migration } from '@mikro-orm/migrations';

export class Migration20250827000000 extends Migration {

  override async up(): Promise<void> {
    // Add DFT (Data File Transfer) fields to seller table for bank transfer information
    this.addSql(`alter table if exists "seller" add column if not exists "dft_bank_name" text;`);
    this.addSql(`alter table if exists "seller" add column if not exists "dft_bank_code" text;`);
    this.addSql(`alter table if exists "seller" add column if not exists "dft_swift_code" text;`);
    this.addSql(`alter table if exists "seller" add column if not exists "dft_bank_address" text;`);
    this.addSql(`alter table if exists "seller" add column if not exists "dft_beneficiary_name" text;`);
    this.addSql(`alter table if exists "seller" add column if not exists "dft_beneficiary_code" text;`);
    this.addSql(`alter table if exists "seller" add column if not exists "dft_beneficiary_address" text;`);
    this.addSql(`alter table if exists "seller" add column if not exists "dft_account_number" text;`);
  }

  override async down(): Promise<void> {
    // Remove DFT fields
    this.addSql(`alter table if exists "seller" drop column if exists "dft_bank_name";`);
    this.addSql(`alter table if exists "seller" drop column if exists "dft_bank_code";`);
    this.addSql(`alter table if exists "seller" drop column if exists "dft_swift_code";`);
    this.addSql(`alter table if exists "seller" drop column if exists "dft_bank_address";`);
    this.addSql(`alter table if exists "seller" drop column if exists "dft_beneficiary_name";`);
    this.addSql(`alter table if exists "seller" drop column if exists "dft_beneficiary_code";`);
    this.addSql(`alter table if exists "seller" drop column if exists "dft_beneficiary_address";`);
    this.addSql(`alter table if exists "seller" drop column if exists "dft_account_number";`);
  }

}
