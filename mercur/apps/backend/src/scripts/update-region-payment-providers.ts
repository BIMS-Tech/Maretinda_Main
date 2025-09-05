import { MedusaContainer } from "@medusajs/framework/types"
import { ExecArgs } from "@medusajs/framework/types"

export default async function updateRegionPaymentProviders({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const regionService = container.resolve("regionModuleService")

  try {
    // Get the Philippines region
    const regions = await regionService.listRegions({ name: "Philippines" })
    
    if (regions.length === 0) {
      logger.error("Philippines region not found")
      return
    }

    const region = regions[0]
    logger.info(`Found region: ${region.name} (${region.id})`)
    logger.info(`Current payment providers: ${JSON.stringify(region.payment_providers)}`)

    // Add giyapay if not already present
    if (!region.payment_providers.includes('giyapay')) {
      const updatedProviders = [...region.payment_providers, 'giyapay']
      
      await regionService.updateRegions(region.id, {
        payment_providers: updatedProviders
      })
      
      logger.info(`Updated payment providers to: ${JSON.stringify(updatedProviders)}`)
    } else {
      logger.info("GiyaPay already enabled for this region")
    }

  } catch (error) {
    logger.error("Error updating region payment providers:", error)
    throw error
  }
}