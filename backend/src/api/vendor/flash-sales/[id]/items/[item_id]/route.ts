import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import FlashSaleService, { UpdateFlashSaleItemInput } from "../../../../../../services/flash-sale"

/** PUT /vendor/flash-sales/:id/items/:item_id */
export async function PUT(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const sellerId = (req as any).auth_context?.actor_id
    if (!sellerId) return res.status(401).json({ message: "Unauthorized" })

    const { id, item_id } = req.params
    const service = new FlashSaleService(req.scope as any)
    const sale = await service.retrieve(id)

    if (!sale) return res.status(404).json({ message: "Flash sale not found" })
    if (sale.seller_id !== sellerId) return res.status(403).json({ message: "Forbidden" })

    const item = await service.updateItem(item_id, req.body as UpdateFlashSaleItemInput)
    res.status(200).json({ item })
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update item", error: error.message })
  }
}

/** DELETE /vendor/flash-sales/:id/items/:item_id */
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const sellerId = (req as any).auth_context?.actor_id
    if (!sellerId) return res.status(401).json({ message: "Unauthorized" })

    const { id, item_id } = req.params
    const service = new FlashSaleService(req.scope as any)
    const sale = await service.retrieve(id)

    if (!sale) return res.status(404).json({ message: "Flash sale not found" })
    if (sale.seller_id !== sellerId) return res.status(403).json({ message: "Forbidden" })

    await service.removeItem(item_id)
    res.status(200).json({ id: item_id, deleted: true })
  } catch (error: any) {
    res.status(500).json({ message: "Failed to remove item", error: error.message })
  }
}
