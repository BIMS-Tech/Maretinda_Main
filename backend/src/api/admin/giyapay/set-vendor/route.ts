import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * @oas [post] /admin/giyapay/set-seller
 * operationId: "AdminSetGiyaPayseller"
 * summary: "Manually Set seller for GiyaPay Transactions"
 * description: "Manually update seller_id for GiyaPay transactions"
 * x-authenticated: true
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         properties:
 *           seller_id:
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
    const { seller_id, transaction_ids } = req.body as any

    if (!seller_id) {
      res.status(400).json({
        success: false,
        message: 'seller_id is required'
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
        SET seller_id = ?, updated_at = NOW()
        WHERE seller_id IS NULL
      `
      await pgConnection.raw(updateQuery, [seller_id])
      
      const countQuery = `SELECT COUNT(*) as count FROM giyapay_transaction WHERE seller_id = ?`
      const countResult = await pgConnection.raw(countQuery, [seller_id])
      const count = (countResult?.rows?.[0] || countResult?.[0] || {}).count || 0

      console.log(`[GiyaPay Set seller] Updated ALL transactions with seller ${seller_id}`)
      
      res.status(200).json({
        success: true,
        message: `Updated all transactions with seller ${seller_id}`,
        updated_count: parseInt(count)
      })
    } else {
      // Update specific transactions
      const placeholders = transaction_ids.map(() => '?').join(',')
      const updateQuery = `
        UPDATE giyapay_transaction
        SET seller_id = ?, updated_at = NOW()
        WHERE id IN (${placeholders})
      `
      await pgConnection.raw(updateQuery, [seller_id, ...transaction_ids])

      console.log(`[GiyaPay Set seller] Updated ${transaction_ids.length} transactions with seller ${seller_id}`)
      
      res.status(200).json({
        success: true,
        message: `Updated ${transaction_ids.length} transactions`,
        updated_count: transaction_ids.length
      })
    }

  } catch (error) {
    console.error('[GiyaPay Set seller] Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to set seller',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * @oas [get] /admin/giyapay/set-seller
 * operationId: "AdminListSellers"
 * summary: "List Available Sellers"
 * description: "Get list of sellers to choose seller_id"
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
      SELECT id, reference_number, order_id, seller_id, created_at 
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
    console.error('[GiyaPay Set seller] Error:', error)
    res.status(500).json({
      message: 'Failed to list sellers',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}


