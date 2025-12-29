import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * @oas [post] /admin/giyapay/fix-table
 * operationId: "AdminFixGiyaPayTable"
 * summary: "Fix GiyaPay Transaction Table"
 * description: "Add vendor_id column if missing and populate it"
 * x-authenticated: true
 * responses:
 *   "200":
 *     description: OK
 * tags:
 *   - Admin GiyaPay
 */
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    let pgConnection: any
    try {
      pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch (e) {
      pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    if (!pgConnection) {
      res.status(500).json({
        message: 'Database connection not available'
      })
      return
    }

    console.log('[GiyaPay Fix] Checking table structure...')

    // Check if vendor_id column exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'giyapay_transaction' 
        AND column_name = 'vendor_id'
    `
    const columnCheck = await pgConnection.raw(checkColumnQuery)
    const columnExists = (columnCheck?.rows || columnCheck || []).length > 0

    if (!columnExists) {
      console.log('[GiyaPay Fix] vendor_id column does NOT exist. Adding it...')
      
      // Add the column
      await pgConnection.raw(`
        ALTER TABLE giyapay_transaction 
        ADD COLUMN IF NOT EXISTS vendor_id text
      `)
      
      console.log('[GiyaPay Fix] ✅ vendor_id column added!')
    } else {
      console.log('[GiyaPay Fix] vendor_id column already exists')
    }

    // Now check the data
    const dataQuery = `SELECT id, vendor_id, order_id FROM giyapay_transaction LIMIT 5`
    const dataResult = await pgConnection.raw(dataQuery)
    const rows = dataResult?.rows || dataResult || []
    
    console.log('[GiyaPay Fix] Current transaction data:')
    rows.forEach((row: any) => {
      console.log(`  - ${row.id}: vendor_id=${row.vendor_id}, order_id=${row.order_id}`)
    })

    res.status(200).json({
      success: true,
      message: 'Table structure fixed',
      column_existed: columnExists,
      sample_data: rows
    })

  } catch (error) {
    console.error('[GiyaPay Fix] Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fix table',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}


