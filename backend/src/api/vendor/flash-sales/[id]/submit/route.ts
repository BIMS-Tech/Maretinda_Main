import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import FlashSaleService from "../../../../../services/flash-sale"

/** POST /vendor/flash-sales/:id/submit — Submit a draft for admin review */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const sellerId = (req as any).auth_context?.actor_id
    if (!sellerId) return res.status(401).json({ message: "Unauthorized" })

    const { id } = req.params
    const service = new FlashSaleService(req.scope as any)
    const sale = await service.retrieve(id, true)

    if (!sale) return res.status(404).json({ message: "Flash sale not found" })
    if (sale.seller_id !== sellerId) return res.status(403).json({ message: "Forbidden" })
    if (sale.status !== "draft") {
      return res.status(400).json({ message: `Only draft flash sales can be submitted (current: '${sale.status}')` })
    }
    if (!sale.items?.length) {
      return res.status(400).json({ message: "Add at least one product before submitting" })
    }

    const updated = await service.updateStatus(id, "pending")
    res.status(200).json({ flash_sale: updated })
  } catch (error: any) {
    res.status(500).json({ message: "Failed to submit flash sale", error: error.message })
  }
}
