import type { MedusaContainer } from "@medusajs/framework/types"
import FlashSaleService from "../services/flash-sale"

export const config = {
  name: "flash-sale-scheduler",
  schedule: "* * * * *", // every minute
}

export default async function flashSaleScheduler(container: MedusaContainer): Promise<void> {
  try {
    const service = new FlashSaleService(container)
    await service.initTables()
    const { activated, ended } = await service.processScheduled()

    if (activated > 0 || ended > 0) {
      console.log(`[FlashSaleScheduler] activated=${activated}, ended=${ended}`)
    }
  } catch (error) {
    console.error("[FlashSaleScheduler] Error:", error)
  }
}
