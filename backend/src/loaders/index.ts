import { MedusaContainer } from "@medusajs/framework/types"
import settlementLoader from "./settlement"
import giyaPayLoader from "./giyapay"
import tamaLoader from "./tama"
import dftLoader from "./dft"
import fileBackupLoader from "./file-backup"
import subscriptionLoader from "./subscription"
import chatLoader from "./chat"

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

    console.log('[Custom Loaders] ========== COMPLETE ==========')
  } catch (error) {
    console.error('[Custom Loaders] ========== FAILED ==========', error)
  }
}
