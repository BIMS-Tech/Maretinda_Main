import { ExecArgs } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export default async function setupTaxRegions({ container }: ExecArgs) {
  const logger = container.resolve('logger')
  const taxService = container.resolve(Modules.TAX)

  try {
    logger.info('Setting up tax regions with simple-tax provider...')
    
    // Get existing tax regions
    const existingTaxRegions = await taxService.listTaxRegions({})
    logger.info(`Found ${existingTaxRegions.length} existing tax region(s)`)
    
    // Delete existing tax regions to start fresh
    for (const taxRegion of existingTaxRegions) {
      await taxService.deleteTaxRegions([taxRegion.id])
      logger.info(`Deleted existing tax region: ${taxRegion.id}`)
    }
    
    // Create tax region for Philippines with simple-tax provider
    const newTaxRegion = await taxService.createTaxRegions({
      country_code: 'ph',
      province_code: null,
      parent_id: null,
      default_tax_rate: {
        rate: 12,
        name: 'VAT',
        code: 'VAT',
        is_default: true
      },
      tax_provider_id: 'simple-tax'
    })
    
    logger.info(`✓ Created tax region for Philippines with simple-tax provider`)
    logger.info(`  Tax Region ID: ${newTaxRegion.id}`)
    logger.info(`  Country: ${newTaxRegion.country_code}`)
    logger.info(`  Tax Provider: ${newTaxRegion.tax_provider_id}`)
    
    logger.info('Successfully set up tax regions!')
  } catch (error) {
    logger.error('Error setting up tax regions:', error)
    throw error
  }
}



