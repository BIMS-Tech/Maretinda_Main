import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HELD_FLAG, publishHeldProducts } from "../lib/held-products"

export const config = {
  name: "publish-held-products",
  schedule: "15 * * * *", // hourly
}

/**
 * Safety net for lib/held-products: publishes the held products of every shop
 * that has become ready by any route (an admin edit, a migration, a script).
 */
export default async function publishHeld(container: MedusaContainer): Promise<void> {
  try {
    const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const sellers: string[] = await pg("product as p")
      .join("seller_seller_product_product as l", "l.product_id", "p.id")
      .whereNull("l.deleted_at")
      .whereNull("p.deleted_at")
      .where("p.status", "draft")
      .whereRaw(`p.metadata->>'${HELD_FLAG}' = 'true'`)
      .distinct("l.seller_id")
      .pluck("l.seller_id")
    for (const sellerId of sellers) {
      const n = await publishHeldProducts(container, sellerId)
      if (n) console.log(`[publish-held-products] ${n} product(s) live for ${sellerId}`)
    }
  } catch (error) {
    console.error("[publish-held-products] Error:", error)
  }
}
