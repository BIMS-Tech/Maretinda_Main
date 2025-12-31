# Database Setup Guide

This guide explains how to set up your database with all custom tables and fields automatically.

## Quick Start

### For a New Database

When setting up a brand new database, run:

```bash
npm run db:setup
```

This command will:
1. Run all Medusa core migrations (`medusa db:migrate`)
2. Create all custom tables (TAMA, DFT, GiyaPay)
3. Add bank/settlement fields to the seller table
4. Create performance indexes

### For an Existing Database

If you already have a database and just need to add the custom fields:

```bash
npm run db:init
```

This will safely add all custom fields and tables without affecting existing data.

## What Gets Created

### 1. Seller Table Extensions

The following bank/settlement fields are added to the `seller` table:

**Standard Bank Fields:**
- `bank_name` - Name of the bank
- `account_number` - Bank account number
- `account_name` - Name on the account
- `branch_name` - Bank branch name
- `swift_code` - SWIFT/BIC code for international transfers
- `beneficiary_address` - Beneficiary address
- `beneficiary_bank_address` - Bank branch address

**Legacy DFT Fields:**
- `dft_bank_name` - DFT bank name
- `dft_bank_code` - DFT bank code
- `dft_swift_code` - DFT SWIFT code
- `dft_bank_address` - DFT bank address
- `dft_beneficiary_name` - DFT beneficiary name
- `dft_beneficiary_code` - DFT beneficiary code
- `dft_beneficiary_address` - DFT beneficiary address
- `dft_account_number` - DFT account number

### 2. TAMA Generations Table

Tracks TAMA file generation history:
- `id` - Unique identifier
- `seller_id` - Reference to seller
- `start_date` - Report period start
- `end_date` - Report period end
- `file_path` - Path to generated file
- `status` - Generation status (PENDING, COMPLETED, FAILED)
- `created_at`, `updated_at` - Timestamps

### 3. DFT Generations Table

Tracks DFT file generation history (same structure as TAMA):
- `id` - Unique identifier
- `seller_id` - Reference to seller
- `start_date` - Report period start
- `end_date` - Report period end
- `file_path` - Path to generated file
- `status` - Generation status
- `created_at`, `updated_at` - Timestamps

### 4. GiyaPay Tables

**giyapay_transaction:**
- `id` - Transaction ID
- `reference_number` - GiyaPay reference
- `order_id` - Medusa order ID
- `cart_id` - Cart ID
- `vendor_id` - Seller/vendor ID
- `amount` - Transaction amount
- `currency` - Currency code (default: PHP)
- `status` - Transaction status
- `gateway` - Payment gateway (GCASH, PAYMAYA, etc.)
- `description` - Transaction description
- `payment_data` - Full payment response (JSONB)
- `created_at`, `updated_at` - Timestamps

**giyapay_config:**
- `id` - Config ID
- `merchant_id` - GiyaPay merchant ID
- `merchant_secret` - GiyaPay secret key
- `sandbox_mode` - Enable/disable sandbox
- `is_enabled` - Enable/disable payment gateway
- `created_at`, `updated_at` - Timestamps

### 5. Performance Indexes

The following indexes are created for optimal query performance:
- `idx_seller_account_number` - Seller account lookup
- `idx_giyapay_ref` - GiyaPay reference number lookup
- `idx_giyapay_order` - GiyaPay order lookup
- `idx_giyapay_vendor` - Vendor-specific transactions
- `idx_tama_seller` - TAMA generations by seller
- `idx_dft_seller` - DFT generations by seller

## Automatic Initialization

The database fields are also automatically initialized when the backend starts, thanks to the **settlement loader** (`src/loaders/settlement.ts`).

This means:
- ✅ Fields are created automatically on server startup
- ✅ Safe to run multiple times (idempotent)
- ✅ No manual intervention needed in production

## Manual Migration (Alternative)

If you prefer to run the SQL manually, you can use:

```bash
psql $DATABASE_URL -f add_bank_fields.sql
```

Or run the standalone migration script:

```bash
npx tsx src/scripts/add-settlement-fields.ts
```

## Verification

After running the setup, verify everything is configured correctly:

```bash
# Check if tables exist
psql $DATABASE_URL -c "\dt"

# Check seller table columns
psql $DATABASE_URL -c "\d seller"

# Verify bank fields exist
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name='seller' AND column_name LIKE '%bank%';"
```

## Troubleshooting

### Issue: "relation 'seller' does not exist"

**Solution:** Run Medusa migrations first:
```bash
medusa db:migrate
```

Then run the custom initialization:
```bash
npm run db:init
```

### Issue: "column already exists"

**Solution:** This is normal! The script is idempotent and will skip existing columns. The warning is informational only.

### Issue: "Invalid request: Unrecognized fields"

**Solution:** This means the entity model doesn't recognize the fields. Make sure:
1. The `Seller` model is defined in `src/models/seller.ts`
2. It's exported from `src/models/index.ts`
3. The backend has been rebuilt: `npm run build`
4. The server has been restarted

### Issue: Custom fields not appearing

**Solution:**
1. Verify the database columns exist: `\d seller` in psql
2. Check the backend logs for loader initialization
3. Rebuild and restart: `npm run build && npm run dev`

## Production Deployment

For production deployments, add to your deployment pipeline:

```bash
# 1. Run migrations
medusa db:migrate

# 2. Initialize custom fields
npm run db:init

# 3. Start the server
npm start
```

Or use the combined command:

```bash
npm run db:setup && npm start
```

## Development Workflow

### Setting up a new developer

```bash
# 1. Clone the repo
git clone <repo-url>
cd backend

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.template .env
# Edit .env with your DATABASE_URL

# 4. Set up the database
npm run db:setup

# 5. Seed sample data (optional)
npm run seed

# 6. Start development server
npm run dev
```

### Resetting the database

```bash
# Drop and recreate (PostgreSQL)
psql -c "DROP DATABASE medusa; CREATE DATABASE medusa;"

# Re-run setup
npm run db:setup

# Re-seed data
npm run seed
```

## Files Reference

- **Models:** `src/models/seller.ts` - Entity definition with bank fields
- **Migration:** `src/migrations/1734480000000_add_seller_bank_fields.ts` - Database migration
- **Loader:** `src/loaders/settlement.ts` - Auto-initialization on startup
- **Setup Script:** `src/scripts/init-database.ts` - Manual initialization script
- **Validator:** `src/api/vendor/sellers/me/validators.ts` - Request validation
- **Route:** `src/api/vendor/sellers/me/route.ts` - API endpoint

## Support

If you encounter issues not covered here, check:
1. Backend logs for detailed error messages
2. PostgreSQL logs for database errors
3. Ensure all dependencies are installed
4. Verify DATABASE_URL is correct

## Next Steps

After database setup:
1. ✅ Configure GiyaPay credentials in admin panel
2. ✅ Test vendor bank information submission
3. ✅ Generate test TAMA/DFT files
4. ✅ Verify settlement reports work correctly


