import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import GiyaPayService from "../../../../services/giyapay"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const memberId = (req as any).auth_context?.actor_id || (req as any).user?.id

    if (!memberId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    // Resolve vendor's seller_id from member
    let vendorId: string | null = null
    try {
      const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
      const memberResult = await pgConnection.raw(
        `SELECT seller_id FROM "member" WHERE id = ? LIMIT 1`,
        [memberId]
      )
      const rows = memberResult?.rows || memberResult || []
      vendorId = rows[0]?.seller_id || null
    } catch (e) {
      console.warn('[Vendor GiyaPay Transactions] Could not resolve seller_id:', e)
    }

    const page = parseInt((req.query.page as string) || "1", 10)
    const limit = parseInt((req.query.limit as string) || "20", 10)
    const status = req.query.status as string | undefined
    const gateway = req.query.gateway as string | undefined
    const search = req.query.search as string | undefined
    const dateFrom = req.query.date_from as string | undefined
    const dateTo = req.query.date_to as string | undefined

    // Resolve GiyaPayService
    let giyaPayService: any
    try {
      giyaPayService = req.scope.resolve("giyaPayService") as any
    } catch {
      giyaPayService = new GiyaPayService(req.scope)
    }

    const allTransactions = await giyaPayService.getTransactions({ status })

    // Filter by vendor_id
    let filtered = vendorId
      ? allTransactions.filter((t: any) => t.vendor_id === vendorId)
      : allTransactions

    // Gateway filter
    if (gateway) {
      filtered = filtered.filter((t: any) =>
        (t.gateway || '').toUpperCase() === gateway.toUpperCase()
      )
    }

    // Search filter (reference number or order id)
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter((t: any) =>
        (t.reference_number || '').toLowerCase().includes(q) ||
        (t.order_id || '').toLowerCase().includes(q)
      )
    }

    // Date range filter
    if (dateFrom) {
      const from = new Date(dateFrom).getTime()
      filtered = filtered.filter((t: any) => new Date(t.created_at).getTime() >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      filtered = filtered.filter((t: any) => new Date(t.created_at).getTime() <= to.getTime())
    }

    // Summary on filtered set
    const summary = {
      total_count: filtered.length,
      total_amount: filtered.reduce((s: number, t: any) => s + (t.amount || 0), 0),
      success_count: filtered.filter((t: any) => t.status === 'SUCCESS').length,
      pending_count: filtered.filter((t: any) => t.status === 'PENDING').length,
      failed_count: filtered.filter((t: any) => ['FAILED', 'ERROR'].includes(t.status)).length,
      cancelled_count: filtered.filter((t: any) => t.status === 'CANCELLED').length,
    }

    const total = filtered.length
    const offset = (page - 1) * limit
    const transactions = filtered.slice(offset, offset + limit).map((t: any) => ({
      ...t,
      vendor_id: t.vendor_id ?? vendorId,
      vendor_name: t.vendor_name ?? "",
    }))

    return res.status(200).json({
      transactions,
      summary,
      count: total,
      page,
      limit,
      vendor_id: vendorId,
    })
  } catch (error) {
    console.error('[Vendor GiyaPay Transactions] Error:', error)
    return res.status(500).json({
      error: "Failed to get transactions",
      message: (error as Error).message,
    })
  }
}
