import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * @oas [post] /admin/giyapay/backfill-vendors
 * operationId: "AdminBackfillGiyaPayVendors"
 * summary: "Backfill Vendor IDs for GiyaPay Transactions"
 * description: "Updates existing GiyaPay transactions with vendor_id from their orders"
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

    console.log('[GiyaPay Backfill] Starting vendor_id backfill...')

    // Get all transactions without vendor_id
    const transactionsQuery = `
      SELECT 
        gt.id,
        gt.reference_number,
        gt.order_id,
        gt.cart_id
      FROM giyapay_transaction gt
      WHERE gt.vendor_id IS NULL
        AND gt.order_id IS NOT NULL
      ORDER BY gt.created_at DESC
    `
    
    const transactionResults = await pgConnection.raw(transactionsQuery)
    const transactions = transactionResults?.rows || transactionResults || []
    
    console.log(`[GiyaPay Backfill] Found ${transactions.length} transactions without vendor_id`)

    let updated = 0
    let failed = 0

    for (const txn of transactions) {
      try {
        let vendorId = null

        // First, let's discover the order structure
        console.log(`[GiyaPay Backfill] 🔍 Inspecting order ${txn.order_id}...`)
        
        const discoverQuery = `
          SELECT 
            o.id,
            o.sales_channel_id,
            o.metadata as order_metadata
          FROM "order" o
          WHERE o.id = ?
          LIMIT 1
        `
        const discoverResults = await pgConnection.raw(discoverQuery, [txn.order_id])
        const discoverRows = discoverResults?.rows || discoverResults || []
        
        if (discoverRows.length > 0) {
          const order = discoverRows[0]
          console.log(`[GiyaPay Backfill] Order info:`, {
            id: order.id,
            sales_channel_id: order.sales_channel_id,
            metadata: order.order_metadata
          })
          
          // Strategy 1: Try sales_channel_id as vendor_id
          if (order.sales_channel_id) {
            const sellerCheckQuery = `SELECT id FROM seller WHERE id = ? LIMIT 1`
            const sellerResults = await pgConnection.raw(sellerCheckQuery, [order.sales_channel_id])
            const sellerRows = sellerResults?.rows || sellerResults || []
            
            if (sellerRows.length > 0) {
              vendorId = order.sales_channel_id
              console.log(`[GiyaPay Backfill] ✅ Found vendor via sales_channel_id: ${vendorId}`)
            }
          }
          
          // Strategy 2: Try to get from order metadata
          if (!vendorId && order.order_metadata) {
            const metadata = typeof order.order_metadata === 'string' 
              ? JSON.parse(order.order_metadata) 
              : order.order_metadata
            
            if (metadata?.owner_id || metadata?.vendor_id || metadata?.seller_id) {
              vendorId = metadata.owner_id || metadata.vendor_id || metadata.seller_id
              console.log(`[GiyaPay Backfill] ✅ Found vendor via order metadata: ${vendorId}`)
            }
          }
        }

        // Strategy 3: Try to get line items and check their metadata
        if (!vendorId) {
          const lineItemsQuery = `
            SELECT 
              id,
              detail_id,
              metadata
            FROM order_line_item
            WHERE order_id = ?
            LIMIT 5
          `
          const lineResults = await pgConnection.raw(lineItemsQuery, [txn.order_id])
          const lineRows = lineResults?.rows || lineResults || []
          
          console.log(`[GiyaPay Backfill] Found ${lineRows.length} line items`)
          
          for (const line of lineRows) {
            if (line.metadata) {
              const metadata = typeof line.metadata === 'string' 
                ? JSON.parse(line.metadata) 
                : line.metadata
              
              if (metadata?.owner_id || metadata?.vendor_id || metadata?.seller_id) {
                vendorId = metadata.owner_id || metadata.vendor_id || metadata.seller_id
                console.log(`[GiyaPay Backfill] ✅ Found vendor via line item metadata: ${vendorId}`)
                break
              }
            }
          }
        }
        
        if (vendorId) {
          // Update the transaction
          await pgConnection.raw(
            'UPDATE giyapay_transaction SET vendor_id = ?, updated_at = NOW() WHERE id = ?',
            [vendorId, txn.id]
          )
          
          console.log(`[GiyaPay Backfill] ✅ Updated transaction ${txn.id} with vendor ${vendorId}`)
          updated++
        } else {
          console.log(`[GiyaPay Backfill] ⚠️ No vendor found for order ${txn.order_id}`)
          failed++
        }
      } catch (error) {
        console.error(`[GiyaPay Backfill] ❌ Failed to update transaction ${txn.id}:`, error)
        failed++
      }
    }

    console.log('[GiyaPay Backfill] Complete:', {
      total: transactions.length,
      updated,
      failed
    })

    res.status(200).json({
      success: true,
      message: 'Vendor ID backfill completed',
      total: transactions.length,
      updated,
      failed
    })

  } catch (error) {
    console.error('[GiyaPay Backfill] Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to backfill vendor IDs',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

