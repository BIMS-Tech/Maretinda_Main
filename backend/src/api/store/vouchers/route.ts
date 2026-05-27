import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import VoucherService from "../../../services/voucher"

/**
 * GET /store/vouchers
 * Query params:
 *   seller_id — return only that seller's promotions
 *
 * Returns:
 *   - All active platform promotions where metadata.is_public=true (no seller_id filter)
 *   - All active seller promotions (always public) — filtered by seller_id if provided
 *
 * If customer is authenticated, marks which ones they've already collected.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = new VoucherService(req.scope)
    const customerId = (req as any).auth_context?.actor_id || null
    const sellerIdFilter = (req.query.seller_id as string) || undefined

    const vouchers = await service.listAvailablePromotions(customerId, sellerIdFilter)
    res.status(200).json({ vouchers })
  } catch (error: any) {
    console.error("[Store Vouchers] GET error:", error.message)
    res.status(500).json({ message: "Failed to retrieve vouchers", error: error.message })
  }
}
