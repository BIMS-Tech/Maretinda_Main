import { MedusaContainer } from "@medusajs/framework/types"
import settlementLoader from "./settlement"
import giyaPayLoader from "./giyapay"
import tamaLoader from "./tama"
import dftLoader from "./dft"
import fileBackupLoader from "./file-backup"
import subscriptionLoader from "./subscription"
import chatLoader from "./chat"
import promotionsLoader from "./promotions"
import brandLoader from "./brand"
import product3dModelLoader from "./product-3d-model"
import sellerApplicationLoader from "./seller-application"

export default async function customLoader(container: MedusaContainer): Promise<void> {
  console.log('[Custom Loaders] ========== STARTING ==========')

  try {
    await settlementLoader(container)
    await giyaPayLoader(container)
    await tamaLoader(container)
    await dftLoader(container)
    await fileBackupLoader(container)
    await subscriptionLoader(container)
    await chatLoader(container)
    await promotionsLoader(container)
    await brandLoader(container)
    await product3dModelLoader(container)
    await sellerApplicationLoader(container)

    console.log('[Custom Loaders] ========== COMPLETE ==========')
  } catch (error) {
    console.error('[Custom Loaders] ========== FAILED ==========', error)
  }
}
