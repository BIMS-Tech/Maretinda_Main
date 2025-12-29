import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Settlement Loader
 * Adds bank/settlement fields to seller table on startup if they don't exist
 */
export default async function settlementLoader(container: MedusaContainer): Promise<void> {
  console.log('[Settlement Loader] ========== INITIALIZING SETTLEMENT FIELDS ==========')
  
  try {
    // Get database connection
    let pgConnection: any
    try {
      pgConnection = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch (e) {
      console.error('[Settlement Loader] Failed to resolve PG_CONNECTION:', e)
      return
    }

    if (!pgConnection) {
      console.error('[Settlement Loader] No database connection available')
      return
    }

    // Add settlement fields to seller table (IF NOT EXISTS ensures idempotency)
    await pgConnection.raw(`
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
      ADD COLUMN IF NOT EXISTS "dft_account_number" text
    `)
    
    console.log('[Settlement Loader] ========== SETTLEMENT FIELDS INITIALIZED ==========')
  } catch (error) {
    console.error('[Settlement Loader] ========== FAILED TO INITIALIZE ==========', error)
  }
}




