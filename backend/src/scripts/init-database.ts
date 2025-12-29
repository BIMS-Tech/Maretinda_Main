import { Client } from 'pg'
import * as dotenv from 'dotenv'

/**
 * Database Initialization Script
 * 
 * This script automatically sets up all custom tables and fields when initializing a new database.
 * Run this after `medusa db:migrate` to ensure all custom fields are added.
 * 
 * Usage: npm run db:init
 */

// Load environment variables
dotenv.config()

async function initDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  try {
    await client.connect()
    console.log('✅ Connected to database')
    console.log('🚀 Starting database initialization...\n')

    // ============================================================
    // 1. ADD BANK/SETTLEMENT FIELDS TO SELLER TABLE
    // ============================================================
    console.log('📦 Adding bank/settlement fields to seller table...')
    
    const settlementFields = [
      { name: 'bank_name', type: 'TEXT' },
      { name: 'account_number', type: 'TEXT' },
      { name: 'account_name', type: 'TEXT' },
      { name: 'branch_name', type: 'TEXT' },
      { name: 'swift_code', type: 'TEXT' },
      { name: 'beneficiary_address', type: 'TEXT' },
      { name: 'beneficiary_bank_address', type: 'TEXT' },
      // Legacy DFT fields
      { name: 'dft_bank_name', type: 'TEXT' },
      { name: 'dft_bank_code', type: 'TEXT' },
      { name: 'dft_swift_code', type: 'TEXT' },
      { name: 'dft_bank_address', type: 'TEXT' },
      { name: 'dft_beneficiary_name', type: 'TEXT' },
      { name: 'dft_beneficiary_code', type: 'TEXT' },
      { name: 'dft_beneficiary_address', type: 'TEXT' },
      { name: 'dft_account_number', type: 'TEXT' }
    ]

    for (const field of settlementFields) {
      try {
        await client.query(`
          ALTER TABLE "seller" 
          ADD COLUMN IF NOT EXISTS "${field.name}" ${field.type}
        `)
        console.log(`  ✅ Added column: ${field.name}`)
      } catch (error: any) {
        if (error.code === '42701') { // duplicate column
          console.log(`  ⏭️  Column already exists: ${field.name}`)
        } else {
          console.error(`  ❌ Error adding ${field.name}:`, error.message)
        }
      }
    }

    // ============================================================
    // 2. CREATE TAMA GENERATIONS TABLE
    // ============================================================
    console.log('\n📦 Creating tama_generations table...')
    
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS "tama_generations" (
          id TEXT PRIMARY KEY,
          seller_id TEXT NOT NULL,
          start_date TIMESTAMP NOT NULL,
          end_date TIMESTAMP NOT NULL,
          file_path TEXT,
          status TEXT DEFAULT 'PENDING',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `)
      console.log('  ✅ tama_generations table created/verified')
    } catch (error: any) {
      console.error('  ❌ Error creating tama_generations table:', error.message)
    }

    // ============================================================
    // 3. CREATE DFT GENERATIONS TABLE
    // ============================================================
    console.log('\n📦 Creating dft_generations table...')
    
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS "dft_generations" (
          id TEXT PRIMARY KEY,
          seller_id TEXT NOT NULL,
          start_date TIMESTAMP NOT NULL,
          end_date TIMESTAMP NOT NULL,
          file_path TEXT,
          status TEXT DEFAULT 'PENDING',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `)
      console.log('  ✅ dft_generations table created/verified')
    } catch (error: any) {
      console.error('  ❌ Error creating dft_generations table:', error.message)
    }

    // ============================================================
    // 4. CREATE GIYAPAY TABLES (if not already created by module)
    // ============================================================
    console.log('\n📦 Verifying GiyaPay tables...')
    
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS "giyapay_transaction" (
          id TEXT PRIMARY KEY,
          reference_number TEXT NOT NULL,
          order_id TEXT,
          cart_id TEXT,
          vendor_id TEXT,
          amount NUMERIC NOT NULL,
          currency TEXT DEFAULT 'PHP',
          status TEXT DEFAULT 'PENDING',
          gateway TEXT DEFAULT 'GCASH',
          description TEXT,
          payment_data JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `)
      console.log('  ✅ giyapay_transaction table created/verified')
    } catch (error: any) {
      console.error('  ❌ Error creating giyapay_transaction table:', error.message)
    }

    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS "giyapay_config" (
          id TEXT PRIMARY KEY,
          merchant_id TEXT NOT NULL,
          merchant_secret TEXT NOT NULL,
          sandbox_mode BOOLEAN DEFAULT true,
          is_enabled BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `)
      console.log('  ✅ giyapay_config table created/verified')
    } catch (error: any) {
      console.error('  ❌ Error creating giyapay_config table:', error.message)
    }

    // ============================================================
    // 5. CREATE INDEXES FOR PERFORMANCE
    // ============================================================
    console.log('\n📦 Creating indexes...')
    
    const indexes = [
      { table: 'seller', column: 'account_number', name: 'idx_seller_account_number' },
      { table: 'giyapay_transaction', column: 'reference_number', name: 'idx_giyapay_ref' },
      { table: 'giyapay_transaction', column: 'order_id', name: 'idx_giyapay_order' },
      { table: 'giyapay_transaction', column: 'vendor_id', name: 'idx_giyapay_vendor' },
      { table: 'tama_generations', column: 'seller_id', name: 'idx_tama_seller' },
      { table: 'dft_generations', column: 'seller_id', name: 'idx_dft_seller' },
    ]

    for (const index of indexes) {
      try {
        await client.query(`
          CREATE INDEX IF NOT EXISTS "${index.name}" 
          ON "${index.table}" ("${index.column}")
        `)
        console.log(`  ✅ Created index: ${index.name}`)
      } catch (error: any) {
        if (error.code === '42P07') { // already exists
          console.log(`  ⏭️  Index already exists: ${index.name}`)
        } else {
          console.error(`  ❌ Error creating index ${index.name}:`, error.message)
        }
      }
    }

    // ============================================================
    // 6. VERIFY ALL TABLES
    // ============================================================
    console.log('\n📊 Verifying database schema...')
    
    const { rows: tables } = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `)
    
    console.log(`\n  Found ${tables.length} tables in database`)
    
    // Check for our custom tables
    const requiredTables = ['seller', 'giyapay_transaction', 'giyapay_config', 'tama_generations', 'dft_generations']
    const existingTableNames = tables.map((t: any) => t.tablename)
    
    for (const table of requiredTables) {
      if (existingTableNames.includes(table)) {
        console.log(`  ✅ ${table} exists`)
      } else {
        console.log(`  ❌ ${table} NOT FOUND`)
      }
    }

    // Verify seller table has bank fields
    const { rows: sellerColumns } = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'seller' 
      AND column_name IN (
        'bank_name', 'account_number', 'account_name', 'branch_name',
        'swift_code', 'beneficiary_address', 'beneficiary_bank_address',
        'dft_bank_name', 'dft_bank_code', 'dft_swift_code', 'dft_bank_address',
        'dft_beneficiary_name', 'dft_beneficiary_code', 'dft_beneficiary_address',
        'dft_account_number'
      )
    `)

    console.log(`\n  Seller table has ${sellerColumns.length}/15 bank fields`)
    
    console.log('\n✅ Database initialization complete!')
    console.log('\n📋 Summary:')
    console.log('   - Seller table updated with bank/settlement fields')
    console.log('   - TAMA generations table created')
    console.log('   - DFT generations table created')
    console.log('   - GiyaPay tables verified')
    console.log('   - Performance indexes created')
    console.log('\n🚀 Your database is ready!')

  } catch (error) {
    console.error('\n❌ Database initialization failed:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

// Run the initialization
initDatabase().catch(console.error)

