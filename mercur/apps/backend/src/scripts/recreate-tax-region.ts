import { ExecArgs } from '@medusajs/framework/types'
import { createTaxRegionsWorkflow } from '@medusajs/medusa/core-flows'

const countries = ['ph']

export default async function recreateTaxRegion({ container }: ExecArgs) {
  const logger = container.resolve('logger')

  try {
    logger.info('Recreating tax regions...')
    
    await createTaxRegionsWorkflow(container).run({
      input: countries.map((country_code) => ({
        country_code
      }))
    })
    
    logger.info('✓ Successfully recreated tax regions for Philippines')
    logger.info('Tax regions will use the configured tax provider: simple-tax')
  } catch (error) {
    logger.error('Error recreating tax regions:', error)
    throw error
  }
}



