import { MedusaContainer } from "@medusajs/framework/types"
import TamaFileGeneratorService from "../services/tama-file-generator"

export default async function tamaLoader(container: MedusaContainer): Promise<void> {
  console.log('[TAMA Loader] ========== LOADING TAMA FILE GENERATOR SERVICE ==========')
  
  try {
    // Register the TAMA service with the container
    container.register({
      tamaFileGeneratorService: {
        resolve: () => {
          console.log('[TAMA Loader] Creating TAMA file generator service instance...')
          return new TamaFileGeneratorService(container)
        },
        lifetime: "SINGLETON"
      }
    })
    
    // Initialize tables on startup
    const tamaService = new TamaFileGeneratorService(container)
    await (tamaService as any).initializeTables?.()
    
    console.log('[TAMA Loader] ========== TAMA SERVICE REGISTERED & TABLES INITIALIZED ==========')
  } catch (error) {
    console.error('[TAMA Loader] ========== FAILED TO REGISTER ==========', error)
  }
}
