import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import FlashSaleService, { CreateFlashSaleItemInput } from "../../../../../services/flash-sale"

/** POST /vendor/flash-sales/:id/items */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const sellerId = (req as any).auth_context?.actor_id
    if (!sellerId) return res.status(401).json({ message: "Unauthorized" })

    const { id } = req.params
    const service = new FlashSaleService(req.scope as any)
    const sale = await service.retrieve(id)

    if (!sale) return res.status(404).json({ message: "Flash sale not found" })
    if (sale.seller_id !== sellerId) return res.status(403).json({ message: "Forbidden" })

    const editableStatuses = ["draft", "pending"]
    if (!editableStatuses.includes(sale.status)) {
      return res.status(400).json({ message: "Cannot modify items on this flash sale" })
    }

    const item = await service.addItem(id, req.body as CreateFlashSaleItemInput)
    res.status(201).json({ item })
  } catch (error: any) {
    res.status(500).json({ message: "Failed to add item", error: error.message })
  }
}
