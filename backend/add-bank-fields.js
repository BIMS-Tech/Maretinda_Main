#!/usr/bin/env node

/**
 * Script to add bank fields to seller table
 * Run with: node add-bank-fields.js
 */

require('dotenv').config()
const { Client } = require('pg')

async function addBankFields() {
  console.log('🔄 Adding bank fields to seller table...')
  console.log('📍 Database:', process.env.DATABASE_URL ? 'Connected' : 'No DATABASE_URL found')
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })
  
  try {
    await client.connect()
    console.log('✅ Connected to database')
    
    // Add bank fields
    const result = await client.query(`
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
    `)
    
    console.log('✅ Successfully added bank fields to seller table!')
    console.log('✅ You can now save bank settings in the vendor panel.')
    console.log('✅ Please restart your backend server for changes to take effect.')
    
    await client.end()
    process.exit(0)
    
  } catch (error) {
    console.error('❌ Error adding bank fields:', error.message)
    console.error('\n💡 Alternative: Run this SQL file manually:')
    console.error('   psql $DATABASE_URL -f add_bank_fields.sql')
    await client.end()
    process.exit(1)
  }
}

addBankFields()

