import { ExecArgs } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export default async function verifyTaxSetup({ container }: ExecArgs) {
  const logger = container.resolve('logger')
  const taxService = container.resolve(Modules.TAX)

  const taxRegions = await taxService.listTaxRegions({})
  
  logger.info('=== TAX CONFIGURATION VERIFICATION ===')
  logger.info(`\nFound ${taxRegions.length} tax region(s):\n`)
  
  for (const taxRegion of taxRegions) {
    logger.info(`Tax Region: ${taxRegion.id}`)
    logger.info(`  Country: ${taxRegion.country_code}`)
    logger.info(`  Province: ${taxRegion.province_code || 'N/A'}`)
    logger.info(`  Tax Provider ID: ${taxRegion.tax_provider_id || 'NOT SET ⚠️'}`)
    logger.info(`  Parent ID: ${taxRegion.parent_id || 'None (root region)'}`)
    logger.info('')
  }
  
  if (taxRegions.length > 0 && taxRegions[0].tax_provider_id) {
    logger.info('✓ Tax configuration is complete!')
  } else {
    logger.warn('⚠️  Tax provider is not set!')
  }
}



