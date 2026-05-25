import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import FlashSaleService, { UpdateFlashSaleInput } from "../../../../services/flash-sale"

function getSellerId(req: AuthenticatedMedusaRequest): string | null {
  return (req as any).auth_context?.actor_id || null
}

/** GET /vendor/flash-sales/:id */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const sellerId = getSellerId(req)
    if (!sellerId) return res.status(401).json({ message: "Unauthorized" })

    const { id } = req.params
    const service = new FlashSaleService(req.scope as any)
    const sale = await service.retrieve(id, true)

    if (!sale) return res.status(404).json({ message: "Flash sale not found" })
    if (sale.seller_id !== sellerId) return res.status(403).json({ message: "Forbidden" })

    res.status(200).json({ flash_sale: sale })
  } catch (error: any) {
    res.status(500).json({ message: "Failed to retrieve flash sale", error: error.message })
  }
}

/** PUT /vendor/flash-sales/:id — Only editable when draft or pending */
export async function PUT(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const sellerId = getSellerId(req)
    if (!sellerId) return res.status(401).json({ message: "Unauthorized" })

    const { id } = req.params
    const service = new FlashSaleService(req.scope as any)
    const sale = await service.retrieve(id)

    if (!sale) return res.status(404).json({ message: "Flash sale not found" })
    if (sale.seller_id !== sellerId) return res.status(403).json({ message: "Forbidden" })

    const editableStatuses = ["draft", "pending"]
    if (!editableStatuses.includes(sale.status)) {
      return res.status(400).json({ message: `Flash sale with status '${sale.status}' cannot be edited` })
    }

    const updated = await service.update(id, req.body as UpdateFlashSaleInput)
    const full = await service.retrieve(id, true)
    res.status(200).json({ flash_sale: full })
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update flash sale", error: error.message })
  }
}

/** DELETE /vendor/flash-sales/:id — Only deletable when draft or pending */
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const sellerId = getSellerId(req)
    if (!sellerId) return res.status(401).json({ message: "Unauthorized" })

    const { id } = req.params
    const service = new FlashSaleService(req.scope as any)
    const sale = await service.retrieve(id)

    if (!sale) return res.status(404).json({ message: "Flash sale not found" })
    if (sale.seller_id !== sellerId) return res.status(403).json({ message: "Forbidden" })

    const deletableStatuses = ["draft", "pending", "cancelled"]
    if (!deletableStatuses.includes(sale.status)) {
      return res.status(400).json({ message: `Cannot delete a flash sale with status '${sale.status}'` })
    }

    await service.delete(id)
    res.status(200).json({ id, deleted: true })
  } catch (error: any) {
    res.status(500).json({ message: "Failed to delete flash sale", error: error.message })
  }
}
