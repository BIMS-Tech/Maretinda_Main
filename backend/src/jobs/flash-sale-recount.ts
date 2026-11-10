import type { MedusaContainer } from "@medusajs/framework/types"
import FlashSaleService from "../services/flash-sale"

export const config = {
  name: "flash-sale-recount",
  schedule: "*/10 * * * *", // every 10 minutes
}

/** Hands back flash-sale units claimed by checkouts that never became orders. */
export default async function flashSaleRecount(container: MedusaContainer): Promise<void> {
  try {
    await new FlashSaleService(container as any).recountSold()
  } catch (error) {
    console.error("[FlashSaleRecount] Error:", error)
  }
}
