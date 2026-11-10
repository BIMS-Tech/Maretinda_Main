import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import FlashSaleService from "../services/flash-sale"

/** A placed or cancelled order changes how many flash-sale units are sold. */
export default async function flashSaleSoldCount({ container }: SubscriberArgs<unknown>) {
  try {
    await new FlashSaleService(container as any).recountSold()
  } catch (error) {
    console.error("[FlashSaleSoldCount] Error:", error)
  }
}

export const config: SubscriberConfig = {
  event: ["order.placed", "order.canceled"],
}
