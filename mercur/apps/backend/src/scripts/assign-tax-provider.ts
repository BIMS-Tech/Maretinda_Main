import { ExecArgs } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export default async function assignTaxProvider({ container }: ExecArgs) {
  const logger = container.resolve('logger')
  const taxService = container.resolve(Modules.TAX)

  try {
    logger.info('Assigning simple-tax provider to tax regions...')
    
    const taxRegions = await taxService.listTaxRegions({})
    logger.info(`Found ${taxRegions.length} tax region(s)`)
    
    for (const taxRegion of taxRegions) {
      logger.info(`\nUpdating tax region: ${taxRegion.id}`)
      logger.info(`  Country: ${taxRegion.country_code}`)
      
      await taxService.updateTaxRegions({
        id: taxRegion.id,
        tax_provider_id: 'simple-tax'
      })
      
      logger.info(`  ✓ Assigned simple-tax provider`)
    }
    
    // Verify
    const updated = await taxService.listTaxRegions({})
    logger.info('\n=== VERIFICATION ===')
    for (const taxRegion of updated) {
      logger.info(`${taxRegion.country_code}: provider = ${taxRegion.tax_provider_id}`)
    }
    
    logger.info('\n✓ Successfully assigned tax provider to all regions!')
  } catch (error) {
    logger.error('Error assigning tax provider:', error)
    throw error
  }
}



