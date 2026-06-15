/**
 * Vendor Shipping Providers — READ ONLY
 * Route: /vendor/shipping-providers
 *
 * Returns which carriers are available on the platform (admin-managed).
 * Vendors cannot configure credentials — that's Maretinda's job.
 * Vendors use this to know which carriers they can book with.
 */

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

function getPgConnection(req: AuthenticatedMedusaRequest): any {
  try {
    return req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  } catch {
    return (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
  }
}

/**
 * GET /vendor/shipping-providers
 * Returns active platform carriers available for vendors to use.
 */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  try {
    const pg = getPgConnection(req)

    const rows = await pg('platform_shipping_provider')
      .where({ is_active: true })
      .whereNull('deleted_at')
      .select('provider_id', 'name', 'settings', 'updated_at')

    // Provider metadata (public info only — no credentials)
    const providerMeta: Record<string, any> = {
      ninjavan: {
        type: 'express',
        markets: ['PH', 'MY', 'SG', 'TH', 'VN', 'ID'],
        capabilities: ['Standard', 'Express', 'Same-day', 'Next-day', 'Webhooks', 'Waybill PDF'],
        supports_cod: false,
        tracking_url_template: 'https://www.ninjavan.co/en-ph/tracking?id={tracking_no}',
      },
      flyingtigers: {
        type: 'standard',
        markets: ['PH'],
        capabilities: ['Standard', 'Express', 'Same-day', 'Next-day', 'COD', 'Door-to-door', 'Waybill PDF'],
        supports_cod: true,
        tracking_url_template: 'https://www.flyingtigersexpress.com/tracking?tracking_no={tracking_no}',
      },
    }

    const providers = rows.map((row: any) => ({
      provider_id: row.provider_id,
      name: row.name,
      is_active: true,
      ...((providerMeta[row.provider_id] as Record<string, any>) ?? {}),
    }))

    res.json({
      providers,
      message: providers.length
        ? `${providers.length} carrier${providers.length > 1 ? 's' : ''} available`
        : 'No carriers are active yet. Contact Maretinda support.',
    })
  } catch (error) {
    console.error('[Vendor Shipping Providers GET]', error)
    res.status(500).json({ message: 'Failed to load shipping providers' })
  }
}
