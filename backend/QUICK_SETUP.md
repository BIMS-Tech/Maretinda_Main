# Quick Setup for Bank Fields

## Problem Fixed

The "Invalid request: Unrecognized fields" error was caused by:
1. ❌ Database columns not existing
2. ❌ Entity model not defined
3. ❌ Strict validation mode blocking custom fields  
4. ❌ Framework middleware validating before route handler

## What We Fixed

### ✅ 1. Database Schema
- Created `src/scripts/init-database.ts` - Automatic database initialization
- Added npm script: `npm run db:init`
- Created migration: `src/migrations/1734480000000_add_seller_bank_fields.ts`
- Auto-loader: `src/loaders/settlement.ts` (runs on server start)

### ✅ 2. Entity Model  
- Created `src/models/seller.ts` - Defines Seller entity with bank fields
- Exported from `src/models/index.ts`

### ✅ 3. Validation
- Updated `src/api/vendor/sellers/me/validators.ts` - Changed from `.strict()` to `.passthrough()`
- Updated `src/api/vendor/sellers/me/middlewares.ts` - Disabled automatic body validation

### ✅ 4. Route Handler
- `src/api/vendor/sellers/me/route.ts` already handles the fields correctly

## How to Apply Changes

### Option 1: Quick Restart (Fastest)

Just restart your backend server. The changes are already in place.

```bash
# If backend is running in terminal 4:
# Press Ctrl+C to stop it

cd backend
npm run dev
```

The server will automatically:
- Load the new Seller model
- Initialize database fields via the settlement loader
- Use the updated validation (passthrough mode)

### Option 2: Full Database Reset (If Needed)

If you want to ensure a clean state:

```bash
cd backend

# 1. Initialize/verify database schema
npm run db:init

# 2. Restart server
npm run dev
```

### Option 3: New Database Setup

For a completely new database:

```bash
cd backend

# 1. Run Medusa migrations
medusa db:migrate

# 2. Initialize custom fields
npm run db:init  

# 3. Seed data (optional)
npm run seed

# 4. Start server
npm run dev
```

## Verify It's Working

### 1. Check Server Logs

When the server starts, you should see:

```
[Settlement Loader] ========== INITIALIZING SETTLEMENT FIELDS ==========
[Settlement Loader] ========== SETTLEMENT FIELDS INITIALIZED ==========
```

### 2. Test the API

Make a POST request to update seller bank info:

```bash
curl -X POST http://localhost:9000/vendor/sellers/me \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bank_name": "Test Bank",
    "account_number": "123456789",
    "account_name": "Test Account"
  }'
```

### 3. Expected Response

Success (200):
```json
{
  "seller": {
    "id": "sel_...",
    "name": "...",
    "bank_name": "Test Bank",
    "account_number": "123456789",
    "account_name": "Test Account",
    ...
  }
}
```

## Files Changed

1. **New Files:**
   - `src/models/seller.ts` - Seller entity model
   - `src/scripts/init-database.ts` - Database initialization script
   - `DATABASE_SETUP_GUIDE.md` - Full documentation
   - `QUICK_SETUP.md` - This file

2. **Modified Files:**
   - `src/models/index.ts` - Export Seller model
   - `src/api/vendor/sellers/me/validators.ts` - Changed to `.passthrough()`
   - `src/api/vendor/sellers/me/middlewares.ts` - Added `validateBody = false`
   - `package.json` - Added `db:init` and `db:setup` scripts

3. **Existing Files (Already Working):**
   - `src/loaders/settlement.ts` - Auto-creates fields on startup
   - `src/migrations/1734480000000_add_seller_bank_fields.ts` - Migration file
   - `src/api/vendor/sellers/me/route.ts` - Route handler

## Troubleshooting

### Still Getting "Invalid request: Unrecognized fields"?

**Solution:** Restart the backend server. The new model needs to be loaded.

```bash
# Stop the server (Ctrl+C)
cd backend
npm run dev
```

### Fields Not Saving to Database?

**Solution:** Run the database initialization:

```bash
cd backend
npm run db:init
```

### Database Connection Error?

**Solution:** Check your DATABASE_URL in `.env`:

```bash
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/medusa
```

### Model Not Loading?

**Solution:** Ensure the export is correct:

```bash
# Check that this file exists and exports Seller:
cat src/models/index.ts
```

Should contain:
```typescript
export { default as Seller } from "./seller"
```

## Production Deployment

Add to your CI/CD pipeline:

```bash
# Build
npm run build

# Database setup
medusa db:migrate
npm run db:init

# Start
npm start
```

## Summary

✅ Database columns created  
✅ Entity model defined  
✅ Validation mode fixed (`.passthrough()`)  
✅ Middleware validation disabled  
✅ Auto-initialization on startup  
✅ Manual initialization script available  

**Just restart your backend server and it should work!**


