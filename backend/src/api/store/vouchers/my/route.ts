import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import VoucherService from "../../../../services/voucher"

/**
 * GET /store/vouchers/my
 * Returns the authenticated customer's collected vouchers, enriched with promotion details.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id
  if (!customerId) {
    return res.status(401).json({ message: "Authentication required" })
  }

  try {
    const service = new VoucherService(req.scope)
    const vouchers = await service.listMyVouchers(customerId)
    res.status(200).json({ vouchers })
  } catch (error: any) {
    console.error("[Store Vouchers] GET my error:", error.message)
    res.status(500).json({ message: "Failed to retrieve your vouchers", error: error.message })
  }
}
