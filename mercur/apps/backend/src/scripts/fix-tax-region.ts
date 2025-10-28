import { ExecArgs } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export default async function fixTaxRegion({ container }: ExecArgs) {
  const logger = container.resolve('logger')
  const taxService = container.resolve(Modules.TAX)

  try {
    logger.info('Updating tax regions with simple-tax provider...')
    
    // Get existing tax regions
    const existingTaxRegions = await taxService.listTaxRegions({})
    logger.info(`Found ${existingTaxRegions.length} existing tax region(s)`)
    
    for (const taxRegion of existingTaxRegions) {
      logger.info(`Updating tax region: ${taxRegion.id}`)
      logger.info(`  Country: ${taxRegion.country_code}`)
      logger.info(`  Current provider: ${taxRegion.tax_provider_id || 'NOT SET'}`)
      
      // Update tax region to use simple-tax provider
      await taxService.updateTaxRegions({
        id: taxRegion.id,
        tax_provider_id: 'simple-tax'
      })
      
      logger.info(`  ✓ Updated to use simple-tax provider`)
    }
    
    // Verify the update
    const updatedTaxRegions = await taxService.listTaxRegions({})
    for (const taxRegion of updatedTaxRegions) {
      logger.info(`\nFinal configuration for ${taxRegion.id}:`)
      logger.info(`  Country: ${taxRegion.country_code}`)
      logger.info(`  Tax Provider: ${taxRegion.tax_provider_id}`)
    }
    
    logger.info('\n✓ Successfully updated all tax regions!')
  } catch (error) {
    logger.error('Error updating tax regions:', error)
    throw error
  }
}



