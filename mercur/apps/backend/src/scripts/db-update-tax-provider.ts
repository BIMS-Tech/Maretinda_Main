import { ExecArgs } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export default async function dbUpdateTaxProvider({ container }: ExecArgs) {
  const logger = container.resolve('logger')
  
  try {
    logger.info('Updating tax provider in database...')
    
    // Get database connection from pg module
    const pg = container.resolve('pg')
    
    // Update all tax regions to use simple-tax provider
    const result = await pg.raw(
      `UPDATE tax_region SET tax_provider_id = ? WHERE country_code = ?`,
      ['simple-tax', 'ph']
    )
    
    logger.info(`✓ Database updated successfully`)
    
    // Clear cache and verify
    const taxService = container.resolve(Modules.TAX)
    const taxRegions = await taxService.listTaxRegions({}, { relations: [] })
    
    logger.info('\n=== VERIFICATION (restart backend to see changes) ===')
    for (const taxRegion of taxRegions) {
      logger.info(`${taxRegion.country_code}: ${taxRegion.tax_provider_id || 'NOT SET'}`)
    }
    
    logger.info('\n⚠️  IMPORTANT: Restart your backend server for changes to take effect!')
  } catch (error) {
    logger.error('Error:', error.message)
    logger.info('\nNote: Tax provider must be set through admin dashboard or restart backend after database update')
  }
}



