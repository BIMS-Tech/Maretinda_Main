import { MedusaContainer } from "@medusajs/framework/types"
import GiyaPayService from "../services/giyapay"

export default async function giyaPayLoader(container: MedusaContainer): Promise<void> {
  console.log('[GiyaPay Loader] ========== LOADING GIYAPAY SERVICE ==========')
  
  try {
    // Register the GiyaPay service with the container
    container.register({
      giyaPayService: {
        resolve: () => {
          console.log('[GiyaPay Loader] Creating GiyaPay service instance...')
          return new GiyaPayService(container)
        },
        lifetime: "SINGLETON"
      }
    })
    console.log('[GiyaPay Loader] ========== GIYAPAY SERVICE REGISTERED ==========')
  } catch (error) {
    console.error('[GiyaPay Loader] ========== FAILED TO REGISTER ==========', error)
  }
}