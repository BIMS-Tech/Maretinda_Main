import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import FlashSaleService, { CreateFlashSaleInput } from "../../../services/flash-sale"

let initialized = false

async function getService(req: AuthenticatedMedusaRequest): Promise<FlashSaleService> {
  const service = new FlashSaleService(req.scope as any)
  if (!initialized) {
    await service.initTables()
    initialized = true
  }
  return service
}

/** GET /admin/flash-sales */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const service = await getService(req)
    const { status, seller_id, limit = "20", offset = "0" } = req.query as any
    const { flash_sales, count } = await service.list({
      status: status ? (Array.isArray(status) ? status : [status]) : undefined,
      seller_id,
      limit: parseInt(limit),
      offset: parseInt(offset),
    })
    res.status(200).json({ flash_sales, count, limit: parseInt(limit), offset: parseInt(offset) })
  } catch (error: any) {
    console.error("[Admin Flash Sales] GET error:", error.message)
    res.status(500).json({ message: "Failed to list flash sales", error: error.message })
  }
}

/** POST /admin/flash-sales */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const service = await getService(req)
    const body = req.body as CreateFlashSaleInput & { items?: any[] }
    const { items, ...saleInput } = body

    saleInput.created_by = (req as any).auth_context?.actor_id

    const sale = await service.create(saleInput)

    // Optionally add items inline
    if (items?.length) {
      for (const item of items) {
        await service.addItem(sale.id, item)
      }
    }

    const full = await service.retrieve(sale.id, true)
    res.status(201).json({ flash_sale: full })
  } catch (error: any) {
    console.error("[Admin Flash Sales] POST error:", error.message)
    res.status(500).json({ message: "Failed to create flash sale", error: error.message })
  }
}
