import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import FlashSaleService from "../../../../../services/flash-sale"

/**
 * POST /admin/flash-sales/:id/revive
 * Revives an ended or cancelled flash sale.
 *
 * If ends_at is still in the future the sale is restored as-is (scheduled or active).
 * If ends_at has already passed, the admin must supply a new ends_at in the request body.
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const service = new FlashSaleService(req.scope as any)
    const sale = await service.retrieve(id)
    if (!sale) return res.status(404).json({ message: "Flash sale not found" })

    if (!["ended", "cancelled"].includes(sale.status)) {
      return res.status(400).json({ message: `Only ended or cancelled flash sales can be revived (current: '${sale.status}')` })
    }

    const now = new Date()
    let endsAt = new Date(sale.ends_at)

    // If ends_at is in the past, require a new ends_at from the request body
    if (endsAt <= now) {
      const { ends_at } = req.body as any
      if (!ends_at) {
        return res.status(400).json({
          message: "This flash sale has already passed. Provide a new 'ends_at' date to revive it.",
        })
      }
      endsAt = new Date(ends_at)
      if (endsAt <= now) {
        return res.status(400).json({ message: "'ends_at' must be in the future" })
      }
      // Persist the new ends_at
      await service.update(id, { ends_at: endsAt.toISOString() })
    }

    const startsAt = new Date(sale.starts_at)
    const newStatus = startsAt > now ? "scheduled" : "active"

    const updated = await service.updateStatus(id, newStatus)
    res.status(200).json({ flash_sale: updated })
  } catch (error: any) {
    res.status(500).json({ message: "Failed to revive flash sale", error: error.message })
  }
}
