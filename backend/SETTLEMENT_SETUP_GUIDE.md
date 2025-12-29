# Settlement System - Automatic Setup Guide

## ✅ What's Been Done

The settlement system is now configured to **automatically set up all required database tables** when you start the backend, even on fresh databases.

---

## 🔄 How It Works

### 1. **Automatic Table Creation via Loaders**

When the backend starts (`npm run dev` or `yarn dev`), the following loaders run automatically:

#### **a. Settlement Loader** (`src/loaders/settlement.ts`)
- Adds bank/settlement fields to the `seller` table
- Fields added:
  - `bank_name`, `account_number`, `account_name`, `branch_name`
  - `swift_code`, `beneficiary_address`, `beneficiary_bank_address`
  - Legacy DFT fields for backward compatibility
- Uses `ADD COLUMN IF NOT EXISTS` - **safe to run multiple times**

#### **b. TAMA Loader** (`src/loaders/tama.ts`)
- Registers TAMA file generator service
- Creates `tama_generation` table automatically

#### **c. DFT Loader** (`src/loaders/dft.ts`)
- Registers DFT file generator service
- Creates `dft_generation` table automatically

### 2. **Custom Vendor API Route**

Created `/vendor/sellers/me` route to handle seller profile updates with new bank fields:
- Location: `backend/src/api/vendor/sellers/me/route.ts`
- Handles both GET and PUT requests
- Supports all new settlement fields

---

## 🚀 Fresh Database Setup

### For New Databases:

1. **Set up your database** (PostgreSQL):
   ```bash
   # Create database
   createdb your_database_name
   ```

2. **Configure environment**:
   ```bash
   # In backend/.env
   DATABASE_URL=postgresql://user:password@localhost:5432/your_database_name
   ```

3. **Start the backend**:
   ```bash
   cd backend
   npm run dev
   # or
   yarn dev
   ```

4. **That's it!** The loaders will automatically:
   - Add settlement fields to seller table
   - Create tama_generation table
   - Create dft_generation table
   - Register all services

---

## 📁 Tables Created Automatically

### 1. **seller table** (modified)
Added columns:
```sql
- bank_name (text)
- account_number (text)
- account_name (text)
- branch_name (text)
- swift_code (text) - for non-Metrobank
- beneficiary_address (text) - for non-Metrobank
- beneficiary_bank_address (text) - for non-Metrobank
-- Plus legacy DFT fields for backward compatibility
```

### 2. **tama_generation** table
Stores TAMA file generation records:
```sql
- id, batch_id, generation_date, file_name
- status, total_amount, transaction_count
- funding_account, generated_by
- timestamps
```

### 3. **dft_generation** table
Stores DFT file generation records:
```sql
- id, batch_id, generation_date, file_name
- status, total_amount, transaction_count
- generated_by
- timestamps
```

---

## 🔧 Troubleshooting

### If tables don't get created:

1. **Check backend logs** for loader messages:
   ```
   [Settlement Loader] ========== INITIALIZING SETTLEMENT FIELDS ==========
   [TAMA Loader] ========== TAMA SERVICE REGISTERED & TABLES INITIALIZED ==========
   [DFT Loader] ========== DFT SERVICE REGISTERED & TABLES INITIALIZED ==========
   ```

2. **Verify database connection**:
   ```bash
   cd backend
   psql $DATABASE_URL -c "\dt"
   ```

3. **Manual table creation** (if needed):
   ```bash
   cd backend
   psql $DATABASE_URL < <(cat <<'EOF'
   -- Run the SQL from settlement loader
   ALTER TABLE "seller" ADD COLUMN IF NOT EXISTS "bank_name" text;
   -- ... (rest of fields)
   EOF
   )
   ```

### If vendor panel save fails:

1. **Check the custom API route exists**:
   ```bash
   ls backend/src/api/vendor/sellers/me/route.ts
   ```

2. **Restart backend** to load the new route:
   ```bash
   cd backend
   yarn dev
   ```

3. **Check backend logs** when saving:
   ```
   [VendorUpdateSeller] Updating seller: seller_xxxxx
   [VendorUpdateSeller] Fields being updated: [...]
   [VendorUpdateSeller] ✅ Successfully updated seller
   ```

---

## 📋 What Happens on Each Fresh Deploy

1. ✅ Backend starts
2. ✅ Loaders run (`settlement` → `giyapay` → `tama` → `dft`)
3. ✅ `seller` table gets new columns (if not exist)
4. ✅ `tama_generation` table created (if not exist)
5. ✅ `dft_generation` table created (if not exist)
6. ✅ Services registered and ready
7. ✅ Vendor panel can save bank settings
8. ✅ Admin panel can view/generate reports

---

## 🎯 Summary

**You no longer need to manually run migrations!** Everything is handled automatically by the loaders when the backend starts.

### Files Modified:
- ✅ `backend/src/loaders/settlement.ts` (NEW)
- ✅ `backend/src/loaders/tama.ts` (UPDATED)
- ✅ `backend/src/loaders/dft.ts` (UPDATED)
- ✅ `backend/src/loaders/index.ts` (UPDATED)
- ✅ `backend/src/api/vendor/sellers/me/route.ts` (NEW)

### Safe for Production:
- Uses `IF NOT EXISTS` clauses
- Idempotent (can run multiple times safely)
- No data loss on restarts
- Follows Medusa v2 patterns

---

## 🔍 Verification Commands

```bash
# Check if seller table has new fields
psql $DATABASE_URL -c "\d seller"

# Check if generation tables exist
psql $DATABASE_URL -c "\dt *generation*"

# Check backend is running
curl http://localhost:9000/health

# Check if custom vendor route works
curl -X GET http://localhost:9000/vendor/sellers/me \
  -H "Cookie: your-session-cookie"
```

---

## 📞 Support

If you encounter any issues:
1. Check the backend terminal for error messages
2. Verify DATABASE_URL in `.env`
3. Ensure PostgreSQL is running
4. Restart the backend: `yarn dev`

That's it! Your settlement system will now work on any fresh database automatically! 🎉




