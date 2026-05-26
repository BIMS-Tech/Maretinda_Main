import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import VoucherService from "../../../../services/voucher"

/**
 * POST /store/vouchers/collect
 * Body: { promotion_id: string }
 * Collects (saves) a voucher to the authenticated customer's wallet.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id
  if (!customerId) {
    return res.status(401).json({ message: "Authentication required" })
  }

  const { promotion_id } = req.body as { promotion_id: string }
  if (!promotion_id) {
    return res.status(400).json({ message: "promotion_id is required" })
  }

  try {
    const service = new VoucherService(req.scope)
    const voucher = await service.collectVoucher(customerId, promotion_id)
    res.status(200).json({ voucher })
  } catch (error: any) {
    console.error("[Store Vouchers] POST collect error:", error.message)
    const status = error.message === "Promotion not found" ? 404 : 400
    res.status(status).json({ message: error.message })
  }
}

/**
 * DELETE /store/vouchers/collect
 * Body: { promotion_id: string }
 * Removes a voucher from the customer's wallet.
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id
  if (!customerId) {
    return res.status(401).json({ message: "Authentication required" })
  }

  const { promotion_id } = req.body as { promotion_id: string }
  if (!promotion_id) {
    return res.status(400).json({ message: "promotion_id is required" })
  }

  try {
    const service = new VoucherService(req.scope)
    await service.removeCollectedVoucher(customerId, promotion_id)
    res.status(200).json({ success: true })
  } catch (error: any) {
    console.error("[Store Vouchers] DELETE collect error:", error.message)
    res.status(500).json({ message: error.message })
  }
}
