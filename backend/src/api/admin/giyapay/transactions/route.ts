import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import GiyaPayService from "../../../../services/giyapay"

type AuthenticatedMedusaRequest = MedusaRequest & {
  user?: any
  auth_context?: any
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  try {
    const container = req.scope
    
    // Get optional status filter from query params
    const status = req.query.status as string | undefined
    
    // Try to get transactions from service
    try {
      let giyaPayService
      
      try {
        giyaPayService = container.resolve("giyaPayService") as any
      } catch (serviceError) {
        console.log('[GiyaPay Transactions] Service not registered, creating on-demand...')
        // Register service on-demand
        giyaPayService = new GiyaPayService(container)
        container.register({
          giyaPayService: { resolve: () => giyaPayService, lifetime: "SINGLETON" }
        })
        console.log('[GiyaPay Transactions] Service registered on-demand')
      }

      // Get transactions with optional status filter
      const transactions = await giyaPayService.getTransactions({ status })
      
      // Calculate summary statistics
      const summary = {
        total_count: transactions.length,
        total_amount: transactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
        success_count: transactions.filter((t: any) => t.status === 'SUCCESS').length,
        pending_count: transactions.filter((t: any) => t.status === 'PENDING').length,
        failed_count: transactions.filter((t: any) => t.status === 'FAILED' || t.status === 'ERROR').length,
      }
      
      return res.status(200).json({
        transactions,
        summary,
        filters: { status },
      })
    } catch (serviceError) {
      console.log('[GiyaPay Transactions] Service not available, returning empty array')
      return res.status(200).json({
        transactions: [],
        summary: { total_count: 0, total_amount: 0, success_count: 0, pending_count: 0, failed_count: 0 },
      })
    }
  } catch (error) {
    console.error('[GiyaPay Transactions] Error getting transactions:', error)
    return res.status(500).json({
      error: "Failed to get transactions",
      message: (error as Error).message,
    });
  }
}









