import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import FlashSaleService from "../../../../../services/flash-sale"

/** POST /admin/flash-sales/:id/reject — Reject a vendor-submitted flash sale */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const service = new FlashSaleService(req.scope as any)
    const sale = await service.retrieve(id)
    if (!sale) return res.status(404).json({ message: "Flash sale not found" })

    if (sale.status !== "pending") {
      return res.status(400).json({ message: `Only pending flash sales can be rejected (current: '${sale.status}')` })
    }

    const updated = await service.updateStatus(id, "cancelled")
    res.status(200).json({ flash_sale: updated })
  } catch (error: any) {
    res.status(500).json({ message: "Failed to reject flash sale", error: error.message })
  }
}
