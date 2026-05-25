import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import FlashSaleService from "../../../../../services/flash-sale"

/** POST /admin/flash-sales/:id/end — Force-end an active or scheduled flash sale */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const service = new FlashSaleService(req.scope as any)
    const sale = await service.retrieve(id)
    if (!sale) return res.status(404).json({ message: "Flash sale not found" })

    if (!["active", "scheduled"].includes(sale.status)) {
      return res.status(400).json({ message: `Cannot end a flash sale with status '${sale.status}'` })
    }

    const updated = await service.updateStatus(id, "ended")
    res.status(200).json({ flash_sale: updated })
  } catch (error: any) {
    res.status(500).json({ message: "Failed to end flash sale", error: error.message })
  }
}
