import { MedusaContainer } from "@medusajs/framework/types"
import giyaPayLoader from "./giyapay"

export default async function loadersIndex(container: MedusaContainer): Promise<void> {
  console.log('[Loaders] ========== LOADING CUSTOM LOADERS ==========')
  
  try {
    await giyaPayLoader(container)
    console.log('[Loaders] ========== ALL CUSTOM LOADERS LOADED ==========')
  } catch (error) {
    console.error('[Loaders] ========== FAILED TO LOAD LOADERS ==========', error)
  }
}