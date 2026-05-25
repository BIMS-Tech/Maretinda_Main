import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import FlashSaleService from "../../../services/flash-sale"

function getSellerId(req: AuthenticatedMedusaRequest): string | null {
  return (req as any).auth_context?.actor_id || null
}

let initialized = false

async function getService(req: AuthenticatedMedusaRequest): Promise<FlashSaleService> {
  const service = new FlashSaleService(req.scope as any)
  if (!initialized) {
    await service.initTables()
    initialized = true
  }
  return service
}

/** GET /vendor/flash-sales — list platform events with vendor's application counts */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const sellerId = getSellerId(req)
    if (!sellerId) return res.status(401).json({ message: "Unauthorized" })

    const service = await getService(req)
    const { limit = "20", offset = "0" } = req.query as any
    const { flash_sales, count } = await service.listForVendor(sellerId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
    })

    res.status(200).json({ flash_sales, count, limit: parseInt(limit), offset: parseInt(offset) })
  } catch (error: any) {
    res.status(500).json({ message: "Failed to list flash sales", error: error.message })
  }
}
