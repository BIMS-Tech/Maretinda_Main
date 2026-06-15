/**
 * Admin Shipping Providers — Platform Credential Management
 * Route: /admin/shipping-providers
 *
 * Admin manages Maretinda's ONE central account per carrier.
 * Vendors never touch credentials — they just pick a carrier when booking.
 */

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { randomUUID } from 'crypto'
import { getNinjaVanToken } from '../../../services/ninjavan'
import { getFlyingTigersRates } from '../../../services/flyingtigers'

// Canonical provider definitions — what Maretinda supports
export const PLATFORM_PROVIDERS = [
  {
    provider_id: 'ninjavan',
    name: 'Ninja Van',
    type: 'express',
    markets: ['PH', 'MY', 'SG', 'TH', 'VN', 'ID'],
    capabilities: ['Standard', 'Express', 'Same-day', 'Next-day', 'Real-time tracking', 'Waybill PDF', 'Webhooks'],
    credential_fields: [
      { key: 'client_id', label: 'Client ID', type: 'text', required: true, help: 'From Ninja Dashboard → Settings → IT Settings' },
      { key: 'client_secret', label: 'Client Secret', type: 'password', required: true, help: 'From Ninja Dashboard → Settings → IT Settings' },
      { key: 'country_code', label: 'Country', type: 'select', required: true, options: ['PH', 'MY', 'SG', 'TH', 'VN', 'ID'] },
      { key: 'sandbox', label: 'Sandbox Mode', type: 'boolean', required: false },
    ],
    logo_url: 'https://www.ninjavan.co/favicon.ico',
    dashboard_url: 'https://dashboard.ninjavan.co',
    docs_url: 'https://api-docs.ninjavan.co/en',
  },
  {
    provider_id: 'flyingtigers',
    name: 'Flying Tigers Express',
    type: 'standard',
    markets: ['PH'],
    capabilities: ['Standard', 'Express', 'Same-day', 'Next-day', 'COD', 'Door-to-door', 'Real-time tracking', 'Waybill PDF'],
    credential_fields: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true, help: 'From Flying Tigers Portal → Settings → API Key Management (starts with fte_...)' },
      { key: 'api_secret', label: 'API Secret', type: 'password', required: true, help: 'From Flying Tigers Portal → Settings → API Key Management (only shown once at creation — revoke and regenerate if lost)' },
    ],
    logo_url: 'https://www.flyingtigersexpress.com/favicon.ico',
    dashboard_url: 'https://www.flyingtigersexpress.com',
    docs_url: 'https://www.flyingtigersexpress.com',
  },
]

function getPgConnection(req: AuthenticatedMedusaRequest): any {
  try {
    return req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  } catch {
    return (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
  }
}

/**
 * GET /admin/shipping-providers
 * Returns all providers with their current platform configuration status.
 */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  let configMap = new Map<string, any>()

  try {
    const pg = getPgConnection(req)
    const rows = await pg('platform_shipping_provider')
      .whereNull('deleted_at')
      .select('provider_id', 'is_active', 'settings', 'created_at', 'updated_at')
    configMap = new Map<string, any>(rows.map((r: any) => [r.provider_id, r]))
  } catch {
    // Table may not exist yet (migration pending) — return static list with no config
  }

  const providers = PLATFORM_PROVIDERS.map((p) => {
    const config = configMap.get(p.provider_id)
    return {
      ...p,
      is_active: config?.is_active ?? false,
      is_configured: !!config,
      configured_at: config?.created_at ?? null,
      last_updated: config?.updated_at ?? null,
      settings: config?.settings ?? {},
    }
  })

  res.json({
    providers,
    active_count: providers.filter((p) => p.is_active).length,
  })
}

/**
 * POST /admin/shipping-providers
 * Actions: save-credentials | test-credentials | activate | deactivate | remove
 */
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  try {
    const pg = getPgConnection(req)
    const { action, provider_id, credentials, settings } = req.body as {
      action: string
      provider_id: string
      credentials?: Record<string, unknown>
      settings?: Record<string, unknown>
    }

    if (!action || !provider_id) {
      return res.status(400).json({ message: 'action and provider_id are required' })
    }

    const providerDef = PLATFORM_PROVIDERS.find((p) => p.provider_id === provider_id)
    if (!providerDef) {
      return res.status(400).json({ message: `Unknown provider: ${provider_id}` })
    }

    const existing = await pg('platform_shipping_provider')
      .where({ provider_id })
      .whereNull('deleted_at')
      .first()

    switch (action) {
      case 'save-credentials': {
        if (!credentials) return res.status(400).json({ message: 'credentials are required' })

        const upsertData = {
          credentials: JSON.stringify(credentials),
          settings: JSON.stringify(settings ?? {}),
          updated_at: new Date(),
        }

        // provider_id has a global UNIQUE constraint that ignores deleted_at,
        // so a previously "removed" (soft-deleted) row still reserves the key.
        // Look up any existing row — including soft-deleted — and revive it
        // rather than inserting a duplicate.
        const anyRow = await pg('platform_shipping_provider')
          .where({ provider_id })
          .first()

        if (anyRow) {
          await pg('platform_shipping_provider')
            .where({ id: anyRow.id })
            .update({ ...upsertData, deleted_at: null })
        } else {
          await pg('platform_shipping_provider').insert({
            id: `psp_${randomUUID().replace(/-/g, '')}`,
            provider_id,
            name: providerDef.name,
            is_active: false,
            ...upsertData,
          })
        }

        return res.json({ success: true, message: `${providerDef.name} credentials saved` })
      }

      case 'test-credentials': {
        if (!existing) {
          return res.status(400).json({ message: 'No credentials saved. Save credentials first.' })
        }
        const creds = existing.credentials as Record<string, unknown>

        if (provider_id === 'ninjavan') {
          await getNinjaVanToken(
            creds.client_id as string,
            creds.client_secret as string,
            (creds.country_code as string) ?? 'PH',
            (creds.sandbox as boolean) ?? false
          )
          return res.json({ success: true, message: 'Ninja Van credentials verified — OAuth token obtained successfully' })
        }

        if (provider_id === 'flyingtigers') {
          await getFlyingTigersRates(
            creds.api_key as string,
            creds.api_secret as string,
            { origin_postal: '1000', dest_postal: '1600', weight_kg: 1 }
          )
          return res.json({ success: true, message: 'Flying Tigers credentials verified successfully' })
        }

        return res.json({ success: true, message: 'Credentials saved (live test not available for this provider)' })
      }

      case 'activate': {
        if (!existing) return res.status(400).json({ message: 'Save and test credentials first' })
        await pg('platform_shipping_provider').where({ id: existing.id }).update({ is_active: true, updated_at: new Date() })
        return res.json({ success: true, message: `${providerDef.name} is now active for all sellers` })
      }

      case 'deactivate': {
        if (!existing) return res.status(400).json({ message: 'Provider not configured' })
        await pg('platform_shipping_provider').where({ id: existing.id }).update({ is_active: false, updated_at: new Date() })
        return res.json({ success: true, message: `${providerDef.name} deactivated` })
      }

      case 'remove': {
        if (!existing) return res.status(404).json({ message: 'Provider not found' })
        await pg('platform_shipping_provider').where({ id: existing.id }).update({ deleted_at: new Date() })
        return res.json({ success: true, message: `${providerDef.name} credentials removed` })
      }

      default:
        return res.status(400).json({ message: `Unknown action: ${action}` })
    }
  } catch (error) {
    console.error('[Admin Shipping Providers POST]', error)
    res.status(500).json({ message: (error as Error).message || 'Internal error' })
  }
}
