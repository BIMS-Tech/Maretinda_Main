import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import FlashSaleService, { CreateFlashSaleItemInput, flashSaleItemError } from "../../../../../services/flash-sale"
import { getSellerId, sellerOwnsProduct } from "../../../../../lib/brand-db"

/** POST /seller/flash-sales/:id/items — apply a product to this platform flash sale */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const sellerId = (req as any).auth_context?.actor_id
    if (!sellerId) return res.status(401).json({ message: "Unauthorized" })

    const { id } = req.params
    const service = new FlashSaleService(req.scope as any)
    const sale = await service.retrieve(id)

    if (!sale) return res.status(404).json({ message: "Flash sale not found" })
    if (["ended", "cancelled"].includes(sale.status)) {
      return res.status(400).json({ message: "This flash sale is no longer accepting applications" })
    }

    const body = req.body as CreateFlashSaleItemInput

    const invalid = flashSaleItemError(body)
    if (invalid) return res.status(400).json({ message: invalid })

    const realSellerId = await getSellerId(req.scope, sellerId)
    if (!realSellerId || !(await sellerOwnsProduct(req.scope, realSellerId, String(body.product_id)))) {
      return res.status(403).json({ message: "You can only apply your own products" })
    }

    const item = await service.addItem(id, {
      product_id: body.product_id,
      variant_id: body.variant_id,
      discount_type: body.discount_type,
      discount_value: body.discount_value,
      stock_limit: body.stock_limit,
      seller_id: sellerId,
    })
    res.status(201).json({ item })
  } catch (error: any) {
    console.error("[Flash Sale Apply]", error)
    res.status(500).json({ message: "Failed to apply product" })
  }
}
