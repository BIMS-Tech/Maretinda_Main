import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { Modules, ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { updateRegionsWorkflow } from '@medusajs/medusa/core-flows'

/**
 * POST /admin/regions/giyapay
 * Adds GiyaPay payment provider to all regions (or specified region)
 */
export async function POST(
  req: MedusaRequest<{ region_id?: string }>,
  res: MedusaResponse
) {
  const regionModuleService = req.scope.resolve(Modules.REGION)
  const paymentModuleService = req.scope.resolve(Modules.PAYMENT)
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  try {
    // Check if GiyaPay provider is available
    const providers = await paymentModuleService.listPaymentProviders()
    const giyaPayProvider = providers.find(p => p.id === 'pp_giyapay_giyapay')

    if (!giyaPayProvider) {
      return res.status(404).json({
        message: 'GiyaPay payment provider not found. Make sure the module is installed and the backend is running.'
      })
    }

    if (!giyaPayProvider.is_enabled) {
      return res.status(400).json({
        message: 'GiyaPay payment provider is not enabled. Please enable it first through the admin panel.'
      })
    }

    // Get region to update
    let regionId = req.body?.region_id
    if (!regionId) {
      // Find Philippines region
      const regions = await regionModuleService.listRegions({ name: 'Philippines' })
      if (regions.length === 0) {
        return res.status(404).json({
          message: 'No Philippines region found'
        })
      }
      regionId = regions[0].id
    }

    const region = await regionModuleService.retrieveRegion(regionId)

    // Get current payment providers for this region from database
    const linkResult = await pgConnection.raw(`
      SELECT payment_provider_id
      FROM region_payment_provider
      WHERE region_id = ?
    `, [regionId])

    const currentProviderIds = (linkResult.rows || []).map((row: any) => row.payment_provider_id)

    // Check if GiyaPay is already added
    const hasGiyaPay = currentProviderIds.includes('pp_giyapay_giyapay')

    if (hasGiyaPay) {
      return res.status(200).json({
        message: 'GiyaPay is already registered for this region',
        region: {
          id: region.id,
          name: region.name,
          payment_providers: currentProviderIds
        }
      })
    }

    // Add GiyaPay to the region
    const providerIds = [...currentProviderIds, 'pp_giyapay_giyapay']

    await updateRegionsWorkflow(req.scope).run({
      input: {
        selector: { id: regionId },
        update: {
          payment_providers: providerIds
        }
      }
    })

    // Fetch updated providers from database
    const updatedLinkResult = await pgConnection.raw(`
      SELECT payment_provider_id
      FROM region_payment_provider
      WHERE region_id = ?
    `, [regionId])

    const updatedProviderIds = (updatedLinkResult.rows || []).map((row: any) => row.payment_provider_id)

    return res.status(200).json({
      message: 'Successfully added GiyaPay to region',
      region: {
        id: region.id,
        name: region.name,
        payment_providers: updatedProviderIds
      }
    })
  } catch (error) {
    console.error('Error adding GiyaPay to region:', error)
    return res.status(500).json({
      message: error.message || 'Failed to add GiyaPay to region'
    })
  }
}
