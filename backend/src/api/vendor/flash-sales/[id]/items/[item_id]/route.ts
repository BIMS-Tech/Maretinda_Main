import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import FlashSaleService, { UpdateFlashSaleItemInput } from "../../../../../../services/flash-sale"

async function getOwnedItem(service: FlashSaleService, itemId: string, sellerId: string) {
  const result = await (service as any).pgConnection.raw(
    `SELECT * FROM "flash_sale_item" WHERE id = ? AND seller_id = ?`,
    [itemId, sellerId]
  )
  return result.rows?.[0] || null
}

/** PUT /vendor/flash-sales/:id/items/:item_id — update a pending application */
export async function PUT(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const sellerId = (req as any).auth_context?.actor_id
    if (!sellerId) return res.status(401).json({ message: "Unauthorized" })

    const { item_id } = req.params
    const service = new FlashSaleService(req.scope as any)
    const existing = await getOwnedItem(service, item_id, sellerId)

    if (!existing) return res.status(404).json({ message: "Item not found" })
    if (existing.item_status !== "pending") {
      return res.status(400).json({ message: "Only pending applications can be edited" })
    }

    const item = await service.updateItem(item_id, req.body as UpdateFlashSaleItemInput)
    res.status(200).json({ item })
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update item", error: error.message })
  }
}

/** DELETE /vendor/flash-sales/:id/items/:item_id — withdraw a pending application */
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const sellerId = (req as any).auth_context?.actor_id
    if (!sellerId) return res.status(401).json({ message: "Unauthorized" })

    const { item_id } = req.params
    const service = new FlashSaleService(req.scope as any)
    const existing = await getOwnedItem(service, item_id, sellerId)

    if (!existing) return res.status(404).json({ message: "Item not found" })
    if (existing.item_status === "approved") {
      return res.status(400).json({ message: "Cannot withdraw an approved application — contact admin" })
    }

    await service.removeItem(item_id)
    res.status(200).json({ id: item_id, deleted: true })
  } catch (error: any) {
    res.status(500).json({ message: "Failed to withdraw application", error: error.message })
  }
}
