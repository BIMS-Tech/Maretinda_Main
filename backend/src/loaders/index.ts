import { MedusaContainer } from "@medusajs/framework/types"
import settlementLoader from "./settlement"
import giyaPayLoader from "./giyapay"
import tamaLoader from "./tama"
import dftLoader from "./dft"
import fileBackupLoader from "./file-backup"

export default async function customLoader(container: MedusaContainer): Promise<void> {
  console.log('[Custom Loaders] ========== STARTING ==========')
  
  try {
    // Run settlement loader first to add bank fields to seller table
    await settlementLoader(container)
    await giyaPayLoader(container)
    await tamaLoader(container)
    await dftLoader(container)
    await fileBackupLoader(container)
    
    console.log('[Custom Loaders] ========== COMPLETE ==========')
  } catch (error) {
    console.error('[Custom Loaders] ========== FAILED ==========', error)
  }
}
