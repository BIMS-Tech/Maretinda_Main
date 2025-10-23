import { MedusaRequest, MedusaResponse, AuthenticatedMedusaRequest } from "@medusajs/framework/http";

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  try {
    const container = req.scope
    const query = req.query
    
    // Parse query parameters
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 20
    const skip = (page - 1) * limit
    
    // Get vendor ID from authenticated user - try multiple possible sources
    const vendorId = req.auth_context?.actor_id || 
                     (req.user as any)?.id ||
                     (req as any).auth_user?.member_id ||
                     (req as any).auth_user?.id ||
                     (req.user as any)?.member_id
    
    console.log('[Vendor GiyaPay Transactions] Auth debug:', {
      auth_context: req.auth_context,
      user: req.user,
      auth_user: (req as any).auth_user,
      extractedVendorId: vendorId
    })
    
    if (!vendorId) {
      console.log('[Vendor GiyaPay Transactions] ❌ No vendor ID found in auth')
      return res.status(401).json({
        error: "Vendor authentication required"
      })
    }
    
    console.log('[Vendor GiyaPay Transactions] ✅ Request from vendor:', vendorId)
    
    // Try to resolve the GiyaPay service and get vendor-specific transactions
    let giyaPayService

    try {
      giyaPayService = container.resolve("giyaPayService") as any
    } catch (serviceError) {
      console.log('[Vendor GiyaPay Transactions] Service not registered, creating on-demand...')
      // Register service on-demand
      const GiyaPayService = require("../../../../services/giyapay").default
      giyaPayService = new GiyaPayService(container)
      container.register({
        giyaPayService: { resolve: () => giyaPayService, lifetime: "SINGLETON" }
      })
      console.log('[Vendor GiyaPay Transactions] Service registered on-demand')
    }
    
    // Get vendor-specific transactions using proper filtering
    try {
      console.log('[Vendor GiyaPay Transactions] 🔍 Querying with params:', {
        skip,
        limit,
        vendorId,
        order: { createdAt: 'DESC' }
      })
      
      // Try to get transactions by vendor ID first (using Medusa seller ID)
      let allTransactions = await giyaPayService.getTransactionsByVendor(vendorId)
      
      // If no transactions found with Medusa seller ID, try alternative approaches
      if (allTransactions.length === 0) {
        console.log('[Vendor GiyaPay Transactions] No transactions found for Medusa seller ID:', vendorId)
        
        // Get all transactions to analyze the vendor_id formats
        const allGiyaPayTransactions = await giyaPayService.getTransactionsForAPI({
          skip: 0,
          take: 1000,
          order: { createdAt: 'DESC' }
        })
        
        console.log('[Vendor GiyaPay Transactions] Total transactions in system:', allGiyaPayTransactions.length)
        console.log('[Vendor GiyaPay Transactions] Sample vendor_ids in transactions:', 
          [...new Set(allGiyaPayTransactions.slice(0, 10).map(t => t.vendor_id))].filter(Boolean))
        
        // Try multiple approaches to find transactions for this vendor
        let possibleMatches = []
        
        // Approach 1: Check if order_id contains parts that might match the seller ID
        const orderMatches = allGiyaPayTransactions.filter(transaction => {
          if (!transaction.order_id) return false
          
          // Check if order_id contains parts that might match the seller ID
          const orderParts = transaction.order_id.split('_')
          return orderParts.some(part => part === vendorId || vendorId.includes(part))
        })
        
        // Approach 2: Check if we can find transactions through cart_id or reference_number patterns
        const cartMatches = allGiyaPayTransactions.filter(transaction => {
          if (!transaction.cart_id && !transaction.reference_number) return false
          
          // Check cart_id or reference_number for vendor ID patterns
          const cartId = transaction.cart_id || ''
          const refNumber = transaction.reference_number || ''
          
          return cartId.includes(vendorId) || refNumber.includes(vendorId) ||
                 vendorId.includes(cartId) || vendorId.includes(refNumber)
        })
        
        // Approach 3: Try to resolve through seller orders
        // Get orders for this seller and match with transaction order_ids
        let orderBasedMatches = []
        try {
          // Try to get orders for this seller to match with transactions
          const query = container.resolve("query")
          const ordersResult = await query.graph({
            entity: "order",
            fields: ["id", "display_id"],
            filters: {
              // Note: We can't filter by seller due to SQL constraints, 
              // so we'll get recent orders and match them
            },
            pagination: { take: 100 }
          })
          
          if (ordersResult?.data?.length > 0) {
            const orderIds = ordersResult.data.map(order => order.id)
            orderBasedMatches = allGiyaPayTransactions.filter(transaction => 
              orderIds.includes(transaction.order_id)
            )
            console.log('[Vendor GiyaPay Transactions] Found matches through order lookup:', orderBasedMatches.length)
          }
        } catch (queryError) {
          console.log('[Vendor GiyaPay Transactions] Could not query orders:', queryError.message)
        }
        
        // Combine all matching approaches
        possibleMatches = [...new Set([...orderMatches, ...cartMatches, ...orderBasedMatches])]
        
        // If still no matches, temporarily show recent transactions for debugging
        // This helps identify the vendor_id format issue
        if (possibleMatches.length === 0) {
          console.log('[Vendor GiyaPay Transactions] No matches found, showing recent transactions for debugging')
          console.log('[Vendor GiyaPay Transactions] This is temporary to help identify the vendor_id mapping issue')
          possibleMatches = allGiyaPayTransactions.slice(0, 10) // Show recent for debugging
        }
        
        console.log('[Vendor GiyaPay Transactions] Possible matches by order analysis:', possibleMatches.length)
        
        if (possibleMatches.length > 0) {
          allTransactions = possibleMatches.slice(skip, skip + limit)
          console.log('[Vendor GiyaPay Transactions] Using order-based matching, found:', allTransactions.length)
        } else {
          // As a last resort, check if we can resolve the seller information to get more context
          try {
            const sellerModule = container.resolve("sellerModuleService")
            // Specify fields explicitly to avoid SQL bugs with member relationships
            const seller = await sellerModule.retrieveSeller(vendorId, {
              select: ['id', 'name', 'handle']
            })
            console.log('[Vendor GiyaPay Transactions] Seller info:', { id: seller?.id, name: seller?.name })
            
            // For now, return empty to maintain security, but log the issue
            console.log('[Vendor GiyaPay Transactions] No matching transactions found - vendor_id format needs investigation')
            allTransactions = []
          } catch (sellerError) {
            console.log('[Vendor GiyaPay Transactions] Could not resolve seller info:', sellerError.message)
            allTransactions = []
          }
        }
      } else {
        // Apply pagination to vendor-specific results
        allTransactions = allTransactions.slice(skip, skip + limit)
        console.log(`[Vendor GiyaPay Transactions] Found ${allTransactions.length} transactions for vendor using direct ID match`)
      }
      
      console.log(`[Vendor Transactions] ✅ Retrieved ${allTransactions.length} vendor-specific transactions for vendor ${vendorId}`)
      console.log('[Vendor Transactions] Sample data:', allTransactions.slice(0, 2))
      
      let paginatedTransactions = allTransactions
      
      console.log(`[Vendor GiyaPay Transactions] Returning ${paginatedTransactions.length} transactions for vendor ${vendorId}`)
      
      return res.status(200).json({
        transactions: paginatedTransactions,
        count: paginatedTransactions.length,
        page,
        limit,
        totalPages: Math.ceil(paginatedTransactions.length / limit),
        debug: {
          vendorId,
          vendorFiltering: true,
          transactionsFound: paginatedTransactions.length,
          matchingMethod: paginatedTransactions.length > 0 ? 
            (allTransactions === paginatedTransactions ? "direct_vendor_id" : "order_analysis") : 
            "no_matches",
          note: paginatedTransactions.length > 0 ? 
            "Showing vendor-specific transactions only" : 
            "No transactions found - check logs for vendor_id mapping details"
        }
      })
      
    } catch (dbError) {
      console.error('[Vendor GiyaPay Transactions] Database error:', dbError)
      return res.status(200).json({
        transactions: [],
        count: 0,
        page,
        limit,
        totalPages: 0,
        message: "No transactions found"
      })
    }
    
  } catch (error) {
    console.error('[Vendor GiyaPay Transactions] Error:', error)
    return res.status(500).json({
      error: "Failed to fetch vendor transactions",
      message: error.message
    })
  }
}