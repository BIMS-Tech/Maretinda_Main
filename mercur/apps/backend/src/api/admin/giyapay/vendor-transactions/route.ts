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
    const vendorId = query.vendorId as string
    
    if (!vendorId) {
      return res.status(400).json({
        error: "Vendor ID is required"
      })
    }
    
    // Try to resolve the GiyaPay service and get vendor-specific transactions
    try {
      const giyaPayService = container.resolve("giyaPayService") as any
      
      // For now, get all transactions and filter by vendor
      // TODO: Add vendor filtering in the service layer
      const allTransactions = await giyaPayService.getTransactions({
        skip: 0,
        take: 1000, // Get more to filter
        order: { createdAt: "DESC" }
      })
      
      // Filter transactions for this vendor's orders
      // This is a temporary solution - should be done in database query
      const vendorTransactions = allTransactions.filter((transaction: any) => {
        // TODO: Add proper vendor-order relationship check
        // For now, return all transactions as demo
        return true
      })
      
      // Apply pagination to filtered results
      const paginatedTransactions = vendorTransactions.slice(skip, skip + limit)
      
      return res.status(200).json({ 
        transactions: paginatedTransactions,
        pagination: {
          page,
          limit,
          total: vendorTransactions.length
        }
      })
    } catch (serviceError) {
      console.log('[GiyaPay Vendor Transactions] Service not available:', serviceError)
      
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
      error: "Failed to fetch vendor GiyaPay transactions",
      message: (error as Error).message,
    });
  }
}