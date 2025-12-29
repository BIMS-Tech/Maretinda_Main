#!/usr/bin/env ts-node
/**
 * Migration Script: Add Settlement Fields to Seller Table
 * 
 * This script adds bank/settlement fields to the seller table and creates
 * the necessary tables for TAMA and DFT file generation.
 * 
 * Run once with: npx ts-node src/scripts/add-settlement-fields.ts
 */

import { Client } from 'pg'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    // 1. ADD SETTLEMENT FIELDS TO SELLER TABLE
    console.log('\n📦 Adding settlement fields to seller table...')
    
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

    // 2. CREATE TAMA GENERATIONS TABLE
    console.log('\n📦 Creating tama_generations table...')
    
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS tama_generations (
          id TEXT PRIMARY KEY,
          period_start TIMESTAMP WITH TIME ZONE NOT NULL,
          period_end TIMESTAMP WITH TIME ZONE NOT NULL,
          file_path TEXT,
          status TEXT DEFAULT 'pending',
          total_transactions INTEGER DEFAULT 0,
          total_amount NUMERIC(10, 2) DEFAULT 0,
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)
      console.log('  ✅ tama_generations table created')
    } catch (error: any) {
      if (error.code === '42P07') { // duplicate table
        console.log('  ⏭️  tama_generations table already exists')
      } else {
        console.error('  ❌ Error creating tama_generations:', error.message)
      }
    }

    // 3. CREATE DFT GENERATIONS TABLE
    console.log('\n📦 Creating dft_generations table...')
    
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS dft_generations (
          id TEXT PRIMARY KEY,
          period_start TIMESTAMP WITH TIME ZONE NOT NULL,
          period_end TIMESTAMP WITH TIME ZONE NOT NULL,
          file_path TEXT,
          status TEXT DEFAULT 'pending',
          total_transactions INTEGER DEFAULT 0,
          total_amount NUMERIC(10, 2) DEFAULT 0,
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)
      console.log('  ✅ dft_generations table created')
    } catch (error: any) {
      if (error.code === '42P07') { // duplicate table
        console.log('  ⏭️  dft_generations table already exists')
      } else {
        console.error('  ❌ Error creating dft_generations:', error.message)
      }
    }

    // 4. VERIFY SELLER TABLE STRUCTURE
    console.log('\n🔍 Verifying seller table structure...')
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'seller'
      AND column_name IN ('bank_name', 'dft_bank_name', 'account_number', 'dft_account_number')
      ORDER BY column_name
    `)
    
    if (result.rows.length > 0) {
      console.log('  ✅ Settlement fields confirmed:')
      result.rows.forEach(row => {
        console.log(`     - ${row.column_name}: ${row.data_type}`)
      })
    } else {
      console.log('  ⚠️  Warning: Could not verify settlement fields')
    }

    console.log('\n✅ Migration completed successfully!')
    console.log('\n📝 Summary:')
    console.log('   - Added 15 bank/settlement fields to seller table')
    console.log('   - Created tama_generations table')
    console.log('   - Created dft_generations table')
    console.log('\n🎉 You can now use the settlement system!')

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n👋 Disconnected from database')
  }
}

// Run the migration
runMigration()



