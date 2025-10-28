import { ExecArgs } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export default async function forceUpdateTaxProvider({ container }: ExecArgs) {
  const logger = container.resolve('logger')
  
  try {
    logger.info('Force updating tax provider in database...')
    
    // Get MikroORM entity manager for direct database access
    const taxModule = container.resolve(Modules.TAX) as any
    const manager = taxModule.__container__.resolve('manager')
    
    // Update all tax regions to use simple-tax provider
    const result = await manager.execute(
      `UPDATE tax_region SET tax_provider_id = 'simple-tax' WHERE country_code = 'ph'`
    )
    
    logger.info(`✓ Database updated: ${result.affectedRows || result.rowCount || 'unknown'} row(s) affected`)
    
    // Verify
    const taxService = container.resolve(Modules.TAX)
    const taxRegions = await taxService.listTaxRegions({})
    
    logger.info('\n=== VERIFICATION ===')
    for (const taxRegion of taxRegions) {
      logger.info(`Tax Region: ${taxRegion.id}`)
      logger.info(`  Country: ${taxRegion.country_code}`)
      logger.info(`  Provider: ${taxRegion.tax_provider_id || 'STILL NOT SET'}`)
    }
    
    logger.info('\n✓ Complete!')
  } catch (error) {
    logger.error('Error updating database:', error)
    throw error
  }
}



