import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import FlashSaleService from "../../../../services/flash-sale"

function getSellerId(req: AuthenticatedMedusaRequest): string | null {
  return (req as any).auth_context?.actor_id || null
}

/** GET /seller/flash-sales/:id — platform event + seller's own applications */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const sellerId = getSellerId(req)
    if (!sellerId) return res.status(401).json({ message: "Unauthorized" })

    const { id } = req.params
    const service = new FlashSaleService(req.scope as any)
    const sale = await service.retrieve(id, true, sellerId)

    if (!sale) return res.status(404).json({ message: "Flash sale not found" })

    res.status(200).json({ flash_sale: sale })
  } catch (error: any) {
    res.status(500).json({ message: "Failed to retrieve flash sale", error: error.message })
  }
}
