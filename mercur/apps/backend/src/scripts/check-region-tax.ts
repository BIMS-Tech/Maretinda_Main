import { ExecArgs } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export default async function checkRegionTax({ container }: ExecArgs) {
  const logger = container.resolve('logger')
  const regionService = container.resolve(Modules.REGION)

  const regions = await regionService.listRegions({})
  
  logger.info('Current Region Configuration:')
  for (const region of regions) {
    logger.info(`Region: ${region.name}`)
    logger.info(`  ID: ${region.id}`)
    logger.info(`  Tax Provider ID: ${region.tax_provider_id || 'NOT SET'}`)
    logger.info(`  Automatic Taxes: ${region.automatic_taxes}`)
  }
}



