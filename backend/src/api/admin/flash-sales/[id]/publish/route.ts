import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import FlashSaleService from "../../../../../services/flash-sale"

/** POST /admin/flash-sales/:id/publish
 * Sets status to 'scheduled' (if starts_at is in the future) or 'active'.
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const service = new FlashSaleService(req.scope as any)
    const sale = await service.retrieve(id)
    if (!sale) return res.status(404).json({ message: "Flash sale not found" })

    const allowedStatuses = ["draft", "scheduled", "pending"]
    if (!allowedStatuses.includes(sale.status)) {
      return res.status(400).json({ message: `Cannot publish a flash sale with status '${sale.status}'` })
    }

    const now = new Date()
    const startsAt = new Date(sale.starts_at)
    const newStatus = startsAt > now ? "scheduled" : "active"

    const updated = await service.updateStatus(id, newStatus)
    res.status(200).json({ flash_sale: updated })
  } catch (error: any) {
    res.status(500).json({ message: "Failed to publish flash sale", error: error.message })
  }
}
