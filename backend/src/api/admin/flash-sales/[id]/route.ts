import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import FlashSaleService, { UpdateFlashSaleInput } from "../../../../services/flash-sale"

function getService(req: AuthenticatedMedusaRequest): FlashSaleService {
  return new FlashSaleService(req.scope as any)
}

/** GET /admin/flash-sales/:id */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const sale = await getService(req).retrieve(id, true)
    if (!sale) return res.status(404).json({ message: "Flash sale not found" })
    res.status(200).json({ flash_sale: sale })
  } catch (error: any) {
    res.status(500).json({ message: "Failed to retrieve flash sale", error: error.message })
  }
}

/** PUT /admin/flash-sales/:id */
export async function PUT(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const service = getService(req)
    const existing = await service.retrieve(id)
    if (!existing) return res.status(404).json({ message: "Flash sale not found" })

    const sale = await service.update(id, req.body as UpdateFlashSaleInput)
    const full = await service.retrieve(id, true)
    res.status(200).json({ flash_sale: full })
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update flash sale", error: error.message })
  }
}

/** DELETE /admin/flash-sales/:id */
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const service = getService(req)
    const existing = await service.retrieve(id)
    if (!existing) return res.status(404).json({ message: "Flash sale not found" })

    const nonDeletable = ["active"]
    if (nonDeletable.includes(existing.status)) {
      return res.status(400).json({ message: "Cannot delete an active flash sale. End it first." })
    }

    await service.delete(id)
    res.status(200).json({ id, deleted: true })
  } catch (error: any) {
    res.status(500).json({ message: "Failed to delete flash sale", error: error.message })
  }
}
