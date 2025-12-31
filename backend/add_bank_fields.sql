-- Add bank fields to seller table
ALTER TABLE seller
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS account_number text,
ADD COLUMN IF NOT EXISTS account_name text,
ADD COLUMN IF NOT EXISTS branch_name text,
ADD COLUMN IF NOT EXISTS swift_code text,
ADD COLUMN IF NOT EXISTS beneficiary_address text,
ADD COLUMN IF NOT EXISTS beneficiary_bank_address text,
ADD COLUMN IF NOT EXISTS dft_bank_name text,
ADD COLUMN IF NOT EXISTS dft_bank_code text,
ADD COLUMN IF NOT EXISTS dft_swift_code text,
ADD COLUMN IF NOT EXISTS dft_bank_address text,
ADD COLUMN IF NOT EXISTS dft_beneficiary_name text,
ADD COLUMN IF NOT EXISTS dft_beneficiary_code text,
ADD COLUMN IF NOT EXISTS dft_beneficiary_address text,
ADD COLUMN IF NOT EXISTS dft_account_number text;



