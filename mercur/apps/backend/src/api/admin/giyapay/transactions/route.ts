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
    
    // Try to resolve the GiyaPay service and get transactions from database
    try {
      let giyaPayService
      
    try {
      giyaPayService = container.resolve("giyaPayService") as any
    } catch (serviceError) {
      console.log('[GiyaPay Transactions] Service not registered, creating on-demand...')
      // Register service on-demand
      const GiyaPayService = require("../../../../services/giyapay").default
      giyaPayService = new GiyaPayService(container)
      container.register({
        giyaPayService: { resolve: () => giyaPayService, lifetime: "SINGLETON" }
      })
      console.log('[GiyaPay Transactions] Service registered on-demand')
    }
      const transactions = await giyaPayService.getTransactionsForAPI({
        skip,
        take: limit,
        order: { createdAt: "DESC" }
      })
      
      console.log('[Admin Transactions] Retrieved', transactions.length, 'transactions')
      
      return res.status(200).json({ 
        transactions,
        pagination: {
          page,
          limit,
          total: transactions.length // TODO: Get actual count
        }
      })
    } catch (serviceError) {
      console.log('[GiyaPay Transactions] Service not available:', serviceError)
      
      // Return empty list if service is not available
      return res.status(200).json({ 
        transactions: [],
        pagination: {
          page,
          limit,
          total: 0
        },
        message: "GiyaPay service is not available"
      })
    }
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch GiyaPay transactions",
      message: (error as Error).message,
    });
  }
}