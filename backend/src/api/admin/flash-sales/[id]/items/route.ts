import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import FlashSaleService, { CreateFlashSaleItemInput } from "../../../../../services/flash-sale"

/** POST /admin/flash-sales/:id/items — Add a product to a flash sale */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const service = new FlashSaleService(req.scope as any)
    const sale = await service.retrieve(id)
    if (!sale) return res.status(404).json({ message: "Flash sale not found" })

    if (sale.status === "ended" || sale.status === "cancelled") {
      return res.status(400).json({ message: "Cannot add items to an ended or cancelled flash sale" })
    }

    const item = await service.addItem(id, req.body as CreateFlashSaleItemInput)
    res.status(201).json({ item })
  } catch (error: any) {
    res.status(500).json({ message: "Failed to add item", error: error.message })
  }
}
