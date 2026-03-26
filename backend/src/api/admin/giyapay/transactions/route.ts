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

    const status = req.query.status as string | undefined
    const gateway = req.query.gateway as string | undefined
    const search = req.query.search as string | undefined
    const dateFrom = req.query.date_from as string | undefined
    const dateTo = req.query.date_to as string | undefined
    const page = parseInt((req.query.page as string) || "1", 10)
    const limit = parseInt((req.query.limit as string) || "20", 10)

    let giyaPayService: any
    try {
      giyaPayService = container.resolve("giyaPayService") as any
    } catch {
      giyaPayService = new GiyaPayService(container)
      container.register({
        giyaPayService: { resolve: () => giyaPayService, lifetime: "SINGLETON" }
      })
    }

    let transactions = await giyaPayService.getTransactions({ status })

    // Gateway filter
    if (gateway) {
      transactions = transactions.filter((t: any) =>
        (t.gateway || '').toUpperCase() === gateway.toUpperCase()
      )
    }

    // Search filter (reference number, order id, or vendor name)
    if (search) {
      const q = search.toLowerCase()
      transactions = transactions.filter((t: any) =>
        (t.reference_number || '').toLowerCase().includes(q) ||
        (t.order_id || '').toLowerCase().includes(q) ||
        (t.vendor_name || '').toLowerCase().includes(q)
      )
    }

    // Date range filter
    if (dateFrom) {
      const from = new Date(dateFrom).getTime()
      transactions = transactions.filter((t: any) => new Date(t.created_at).getTime() >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      transactions = transactions.filter((t: any) => new Date(t.created_at).getTime() <= to.getTime())
    }

    const summary = {
      total_count: transactions.length,
      total_amount: transactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
      success_count: transactions.filter((t: any) => t.status === 'SUCCESS').length,
      pending_count: transactions.filter((t: any) => t.status === 'PENDING').length,
      failed_count: transactions.filter((t: any) => ['FAILED', 'ERROR'].includes(t.status)).length,
      cancelled_count: transactions.filter((t: any) => t.status === 'CANCELLED').length,
    }

    const total = transactions.length
    const offset = (page - 1) * limit
    const paginated = transactions.slice(offset, offset + limit)

    return res.status(200).json({
      transactions: paginated,
      summary,
      count: total,
      page,
      limit,
      filters: { status, gateway, search, date_from: dateFrom, date_to: dateTo },
    })
  } catch (error) {
    console.error('[GiyaPay Admin Transactions] Error:', error)
    return res.status(500).json({
      error: "Failed to get transactions",
      message: (error as Error).message,
    })
  }
}
