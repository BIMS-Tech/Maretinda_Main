import { ExecArgs } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export default async function updateRegionTaxProvider({ container }: ExecArgs) {
  const logger = container.resolve('logger')
  const regionService = container.resolve(Modules.REGION)

  try {
    logger.info('Starting tax provider update for regions...')
    
    // Get all regions
    const regions = await regionService.listRegions({})
    
    logger.info(`Found ${regions.length} region(s)`)
    
    for (const region of regions) {
      logger.info(`Updating region: ${region.name} (${region.id})`)
      logger.info(`Current providers: ${JSON.stringify(region.automatic_taxes)}`)
      
      // Update region to use simple-tax provider
      await regionService.updateRegions({
        id: region.id,
        automatic_taxes: true,
        tax_provider_id: 'simple-tax'
      })
      
      logger.info(`✓ Updated region ${region.name} to use simple-tax provider`)
    }
    
    logger.info('Successfully updated all regions with tax provider!')
  } catch (error) {
    logger.error('Error updating region tax providers:', error)
    throw error
  }
}

