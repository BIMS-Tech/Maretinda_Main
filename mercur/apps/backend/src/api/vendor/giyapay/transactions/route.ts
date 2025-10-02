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
      
      // For now, show all transactions since existing ones don't have vendor_id
      // TODO: Re-enable vendor filtering once transactions have proper vendor information
      const allTransactions = await giyaPayService.getTransactionsForAPI({
        skip,
        take: limit,
        order: { createdAt: 'DESC' }
        // Temporarily disabled: vendorId // Filter by vendor ID
      })
      
      console.log('[Vendor Transactions] ✅ Retrieved', allTransactions.length, 'transactions (showing all for now)')
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
          showingAllTransactions: true,
          note: "Vendor filtering temporarily disabled - showing all transactions"
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