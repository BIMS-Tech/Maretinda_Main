import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import FlashSaleService, { UpdateFlashSaleItemInput } from "../../../../../../services/flash-sale"

/** PUT /admin/flash-sales/:id/items/:item_id */
export async function PUT(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const { item_id } = req.params
    const service = new FlashSaleService(req.scope as any)
    const item = await service.updateItem(item_id, req.body as UpdateFlashSaleItemInput)
    res.status(200).json({ item })
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update item", error: error.message })
  }
}

/** DELETE /admin/flash-sales/:id/items/:item_id */
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const { item_id } = req.params
    const service = new FlashSaleService(req.scope as any)
    await service.removeItem(item_id)
    res.status(200).json({ id: item_id, deleted: true })
  } catch (error: any) {
    res.status(500).json({ message: "Failed to remove item", error: error.message })
  }
}
