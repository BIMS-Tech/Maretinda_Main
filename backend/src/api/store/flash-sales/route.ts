import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import FlashSaleService from "../../../services/flash-sale"

let initialized = false

async function getService(req: MedusaRequest): Promise<FlashSaleService> {
  const service = new FlashSaleService(req.scope as any)
  if (!initialized) {
    await service.initTables()
    initialized = true
  }
  return service
}

/**
 * GET /store/flash-sales
 * Returns the currently active flash sale with product details.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = await getService(req)
    const sale = await service.getActive()

    if (!sale) {
      return res.status(200).json({ flash_sale: null })
    }

    // Enrich items with product data if items exist
    if (sale.items?.length) {
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const productIds = [...new Set(sale.items.map((i) => i.product_id))]

      const { data: products } = await query.graph({
        entity: "product",
        fields: [
          "id",
          "title",
          "handle",
          "thumbnail",
          "variants.*",
          "variants.prices.*",
        ],
        filters: { id: productIds },
      })

      const productMap = new Map(products.map((p: any) => [p.id, p]))

      sale.items = sale.items.map((item) => ({
        ...item,
        product: productMap.get(item.product_id) || null,
      }))
    }

    res.status(200).json({ flash_sale: sale })
  } catch (error: any) {
    console.error("[Store Flash Sales] GET error:", error.message)
    res.status(500).json({ message: "Failed to retrieve flash sale", error: error.message })
  }
}
