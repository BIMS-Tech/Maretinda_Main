import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import VoucherService from "../../../services/voucher"

/**
 * GET /store/vouchers
 * Returns all active platform & seller promotions available as vouchers.
 * If customer is authenticated, also marks which ones they've collected.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = new VoucherService(req.scope)
    const customerId = (req as any).auth_context?.actor_id || null

    const vouchers = await service.listAvailablePromotions(customerId)
    res.status(200).json({ vouchers })
  } catch (error: any) {
    console.error("[Store Vouchers] GET error:", error.message)
    res.status(500).json({ message: "Failed to retrieve vouchers", error: error.message })
  }
}
