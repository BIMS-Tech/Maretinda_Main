import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * @oas [post] /admin/giyapay/set-vendor
 * operationId: "AdminSetGiyaPayVendor"
 * summary: "Manually Set Vendor for GiyaPay Transactions"
 * description: "Manually update vendor_id for GiyaPay transactions"
 * x-authenticated: true
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         properties:
 *           vendor_id:
 *             type: string
 *           transaction_ids:
 *             type: array
 *             items:
 *               type: string
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
    const { vendor_id, transaction_ids } = req.body as any

    if (!vendor_id) {
      res.status(400).json({
        success: false,
        message: 'vendor_id is required'
      })
      return
    }

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

    // If no transaction_ids provided, update ALL transactions
    if (!transaction_ids || transaction_ids.length === 0) {
      const updateQuery = `
        UPDATE giyapay_transaction
        SET vendor_id = ?, updated_at = NOW()
        WHERE vendor_id IS NULL
      `
      await pgConnection.raw(updateQuery, [vendor_id])
      
      const countQuery = `SELECT COUNT(*) as count FROM giyapay_transaction WHERE vendor_id = ?`
      const countResult = await pgConnection.raw(countQuery, [vendor_id])
      const count = (countResult?.rows?.[0] || countResult?.[0] || {}).count || 0

      console.log(`[GiyaPay Set Vendor] Updated ALL transactions with vendor ${vendor_id}`)
      
      res.status(200).json({
        success: true,
        message: `Updated all transactions with vendor ${vendor_id}`,
        updated_count: parseInt(count)
      })
    } else {
      // Update specific transactions
      const placeholders = transaction_ids.map(() => '?').join(',')
      const updateQuery = `
        UPDATE giyapay_transaction
        SET vendor_id = ?, updated_at = NOW()
        WHERE id IN (${placeholders})
      `
      await pgConnection.raw(updateQuery, [vendor_id, ...transaction_ids])

      console.log(`[GiyaPay Set Vendor] Updated ${transaction_ids.length} transactions with vendor ${vendor_id}`)
      
      res.status(200).json({
        success: true,
        message: `Updated ${transaction_ids.length} transactions`,
        updated_count: transaction_ids.length
      })
    }

  } catch (error) {
    console.error('[GiyaPay Set Vendor] Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to set vendor',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * @oas [get] /admin/giyapay/set-vendor
 * operationId: "AdminListSellers"
 * summary: "List Available Sellers"
 * description: "Get list of sellers to choose vendor_id"
 * x-authenticated: true
 * responses:
 *   "200":
 *     description: OK
 * tags:
 *   - Admin GiyaPay
 */
export async function GET(
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

    const sellersQuery = `SELECT id, name, email, dft_bank_name FROM seller LIMIT 20`
    const sellersResult = await pgConnection.raw(sellersQuery)
    const sellers = sellersResult?.rows || sellersResult || []

    const txnsQuery = `
      SELECT id, reference_number, order_id, vendor_id, created_at 
      FROM giyapay_transaction 
      ORDER BY created_at DESC 
      LIMIT 10
    `
    const txnsResult = await pgConnection.raw(txnsQuery)
    const transactions = txnsResult?.rows || txnsResult || []

    res.status(200).json({
      sellers,
      transactions
    })

  } catch (error) {
    console.error('[GiyaPay Set Vendor] Error:', error)
    res.status(500).json({
      message: 'Failed to list sellers',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}


