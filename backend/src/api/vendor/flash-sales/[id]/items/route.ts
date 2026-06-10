import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import FlashSaleService, { CreateFlashSaleItemInput } from "../../../../../services/flash-sale"

/** POST /seller/flash-sales/:id/items — apply a product to this platform flash sale */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const sellerId = (req as any).auth_context?.actor_id
    if (!sellerId) return res.status(401).json({ message: "Unauthorized" })

    const { id } = req.params
    const service = new FlashSaleService(req.scope as any)
    const sale = await service.retrieve(id)

    if (!sale) return res.status(404).json({ message: "Flash sale not found" })
    if (["ended", "cancelled"].includes(sale.status)) {
      return res.status(400).json({ message: "This flash sale is no longer accepting applications" })
    }

    const body = req.body as CreateFlashSaleItemInput
    const item = await service.addItem(id, { ...body, seller_id: sellerId })
    res.status(201).json({ item })
  } catch (error: any) {
    res.status(500).json({ message: "Failed to apply product", error: error.message })
  }
}
