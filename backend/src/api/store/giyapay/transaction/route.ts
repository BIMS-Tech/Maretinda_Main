import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import GiyaPayService from "../../../../services/giyapay"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query: any = req.query || {}
    const reference = query.reference_number || query.refno || query.reference || query.ref
    const orderId = query.order_id || query.orderId

    if (!reference && !orderId) {
      return res.status(400).json({ error: "order_id or reference_number is required" })
    }

    console.log('[GiyaPay Store Transaction] Fetching transaction for:', { orderId, reference })

    // Get GiyaPay service
    const container = req.scope
    let giyaPayService: any
    
    try {
      giyaPayService = container.resolve("giyaPayService") as any
    } catch (error) {
      console.log('[GiyaPay Store Transaction] Creating fallback GiyaPay service')
      giyaPayService = new GiyaPayService(container)
      container.register({
        giyaPayService: { resolve: () => giyaPayService, lifetime: "SINGLETON" }
      })
    }

    // Get all transactions and filter by order_id or reference
    const allTransactions = await giyaPayService.getTransactions()
    
    // Find the matching transaction
    let transaction = allTransactions.find((txn: any) => 
      (orderId && txn.order_id === orderId) || 
      (reference && txn.reference_number === reference) ||
      (orderId && txn.cart_id === orderId) // Also check cart_id
    )

    // If not found directly, try to find via order set
    // Individual order IDs (order_01...) need to be looked up via their order set
    if (!transaction && orderId && orderId.startsWith('order_')) {
      try {
        // Use the links/relations to find order set
        // Query the order to get its order_set relationship
        const query = container.resolve("query")
        
        // First, get the order with its order_set relation
        const orderResult = await query.graph({
          entity: "order",
          fields: ["id", "order_set.*"],
          filters: {
            id: orderId
          }
        })
        
        if (orderResult?.data?.length > 0 && orderResult.data[0].order_set) {
          const orderSetId = orderResult.data[0].order_set.id
          console.log('[GiyaPay Store Transaction] Found order set for order:', orderSetId)
          
          // Find transaction by order set ID
          transaction = allTransactions.find((txn: any) => 
            txn.order_id === orderSetId
          )
        }
      } catch (orderSetError) {
        console.log('[GiyaPay Store Transaction] Could not lookup order set:', orderSetError)
        
        // Fallback: Use remote link query
        try {
          const remoteLink = container.resolve("remoteLink")
          const links: any = await remoteLink.list({
            from: {
              module: "order",
              id: orderId
            },
            to: {
              module: "order_set"
            }
          })
          
          if (links && Array.isArray(links) && links.length > 0) {
            const orderSetId = links[0].toId || links[0].to_id
            console.log('[GiyaPay Store Transaction] Found order set via remote link:', orderSetId)
            
            transaction = allTransactions.find((txn: any) => 
              txn.order_id === orderSetId
            )
          }
        } catch (linkError) {
          console.log('[GiyaPay Store Transaction] Remote link query failed:', linkError)
        }
      }
    }

    if (!transaction) {
      console.log('[GiyaPay Store Transaction] Transaction not found for:', { orderId, reference })
      return res.status(404).json({ error: "Transaction not found" })
    }

    console.log('[GiyaPay Store Transaction] Found transaction:', transaction.reference_number)

    return res.json({
      referenceNumber: transaction.reference_number,
      orderId: transaction.order_id,
      cartId: transaction.cart_id,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      gateway: transaction.gateway,
      description: transaction.description,
      paymentData: transaction.payment_data,
      createdAt: transaction.created_at,
    })
  } catch (error: any) {
    console.error('[GiyaPay Store Transaction] Error:', error)
    return res.status(500).json({ 
      error: 'Failed to fetch transaction', 
      message: error.message 
    })
  }
}
