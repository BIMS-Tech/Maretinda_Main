import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { addToCartWorkflow } from "@medusajs/core-flows"
import FlashSaleService from "../../../services/flash-sale"

/**
 * POST /store/flash-sale-cart-items
 * Adds a product to the cart at the flash sale discounted price.
 * The discount is calculated server-side — the client cannot manipulate the price.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = (req as any).auth_context?.actor_id
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const { variant_id, quantity = 1, flash_sale_item_id, cart_id } = req.body as any

    if (!variant_id || !flash_sale_item_id || !cart_id) {
      return res.status(400).json({ message: "variant_id, flash_sale_item_id, and cart_id are required" })
    }

    const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    // Validate the flash sale item is still active and approved
    const fsResult = await pg.raw(
      `SELECT fsi.id, fsi.product_id, fsi.discount_type, fsi.discount_value, fsi.item_status,
              fs.status as sale_status, fs.ends_at
       FROM flash_sale_item fsi
       JOIN flash_sale fs ON fsi.flash_sale_id = fs.id
       WHERE fsi.id = ?
         AND fsi.item_status = 'approved'
         AND fs.status = 'active'
         AND fs.deleted_at IS NULL`,
      [flash_sale_item_id]
    )
    const fsItem = fsResult.rows?.[0]
    if (!fsItem) {
      return res.status(404).json({ message: "Flash sale item not found or no longer active" })
    }

    // Validate the variant belongs to the flash sale's product
    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: ["id", "product_id", "title", "prices.*", "product.title", "product.thumbnail"],
      filters: { id: variant_id },
    })
    const variant = variants?.[0] as any
    if (!variant) {
      return res.status(404).json({ message: "Variant not found" })
    }
    if (variant.product_id !== fsItem.product_id) {
      return res.status(400).json({ message: "Variant does not belong to the flash sale product" })
    }

    // Get the cart's currency to find the right price
    const { data: carts } = await query.graph({
      entity: "cart",
      fields: ["id", "currency_code"],
      filters: { id: cart_id },
    })
    const cart = carts?.[0] as any
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" })
    }

    // Find the variant price for the cart's currency
    const variantPrice = variant.prices?.find(
      (p: any) => p.currency_code === cart.currency_code
    )
    const basePrice: number = variantPrice?.amount ?? 0
    if (!basePrice) {
      return res.status(400).json({
        message: `No price found for currency ${cart.currency_code}`,
      })
    }

    // Calculate discounted price (server-side — same formula as the storefront display)
    let discountedPrice: number
    if (fsItem.discount_type === "percentage") {
      discountedPrice = Math.round(basePrice * (1 - Number(fsItem.discount_value) / 100))
    } else {
      discountedPrice = Math.max(0, basePrice - Number(fsItem.discount_value))
    }

    // Use the official addToCartWorkflow with unit_price override
    await addToCartWorkflow(req.scope).run({
      input: {
        cart_id,
        items: [
          {
            variant_id,
            quantity: Number(quantity),
            unit_price: discountedPrice,
            compare_at_unit_price: basePrice,
            metadata: {
              flash_sale_item_id,
              flash_sale_discount_type: fsItem.discount_type,
              flash_sale_discount_value: Number(fsItem.discount_value),
            },
          },
        ],
      },
    })

    // Increment sold count
    const flashSaleService = new FlashSaleService(req.scope as any)
    await flashSaleService.incrementSoldCount(flash_sale_item_id, Number(quantity))

    res.status(200).json({
      message: "Added to cart at flash sale price",
      discounted_price: discountedPrice,
      original_price: basePrice,
    })
  } catch (error: any) {
    console.error("[Flash Sale Cart] POST error:", error.message)
    res.status(500).json({ message: "Failed to add to cart", error: error.message })
  }
}
