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
import { getFlyingTigersCoveredProvinces } from '../../../services/flyingtigers'

function getPgConnection(req: AuthenticatedMedusaRequest): any {
  try {
    return req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  } catch {
    return (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
  }
}

const flyingTigersCoverage = async (credentials: any): Promise<string[] | undefined> => {
  const creds = typeof credentials === 'string' ? JSON.parse(credentials) : credentials
  if (!creds?.api_key || !creds?.api_secret) return undefined
  return getFlyingTigersCoveredProvinces(creds.api_key, creds.api_secret)
    .then((provinces) => provinces.map((p) => p.provinceLabel))
    .catch(() => undefined)
}

/**
 * GET /vendor/shipping-providers
 * Returns active platform carriers available for vendors to use.
 */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  try {
    const pg = getPgConnection(req)

    let rows: any[] = []
    try {
      rows = await pg('platform_shipping_provider')
        .where({ is_active: true })
        .whereNull('deleted_at')
        .select('provider_id', 'name', 'settings', 'credentials', 'updated_at')
    } catch {
      // Table may not exist yet — return empty list gracefully
    }

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

    const providers = await Promise.all(
      rows.map(async (row: any) => ({
        provider_id: row.provider_id,
        name: row.name,
        is_active: true,
        ...((providerMeta[row.provider_id] as Record<string, any>) ?? {}),
        // Where Flying Tigers delivers, so the panel can warn before booking
        ...(row.provider_id === 'flyingtigers' && { covered_provinces: await flyingTigersCoverage(row.credentials) }),
      }))
    )

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
