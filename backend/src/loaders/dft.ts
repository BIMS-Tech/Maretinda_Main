import { MedusaContainer } from "@medusajs/framework/types"
import DftFileGeneratorService from "../services/dft-file-generator"

export default async function dftLoader(container: MedusaContainer): Promise<void> {
  console.log('[DFT Loader] ========== LOADING DFT FILE GENERATOR SERVICE ==========')
  
  try {
    // Register the DFT service with the container
    container.register({
      dftFileGeneratorService: {
        resolve: () => {
          console.log('[DFT Loader] Creating DFT file generator service instance...')
          return new DftFileGeneratorService(container)
        },
        lifetime: "SINGLETON"
      }
    })
    
    // Initialize tables on startup
    const dftService = new DftFileGeneratorService(container)
    await (dftService as any).initializeTables?.()
    
    console.log('[DFT Loader] ========== DFT SERVICE REGISTERED & TABLES INITIALIZED ==========')
  } catch (error) {
    console.error('[DFT Loader] ========== FAILED TO REGISTER ==========', error)
  }
}

