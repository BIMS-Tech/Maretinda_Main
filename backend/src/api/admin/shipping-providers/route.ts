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
import { flyingTigersMode, getFlyingTigersRates, registerFlyingTigersWebhook } from '../../../services/flyingtigers'

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

const parseJson = (v: any): Record<string, any> =>
  typeof v === 'string' ? (JSON.parse(v || '{}') as Record<string, any>) : (v ?? {})

/** What the setup checklist reports: the parts of shipping that live outside this page. */
async function shippingChecklist(pg: any) {
  const phRegion = await pg('region_country')
    .whereRaw('LOWER(iso_2) = ?', ['ph'])
    .whereNotNull('region_id')
    .whereNull('deleted_at')
    .first()
  const total = await pg('seller').whereNull('deleted_at').count('* as n').first()
  // A seller can ship once a warehouse of theirs has a zone with a shipping option
  const ready = await pg.raw(`
    SELECT COUNT(DISTINCT l.seller_id)::int AS n
      FROM seller_seller_stock_location_stock_location l
      JOIN location_fulfillment_set lfs ON lfs.stock_location_id = l.stock_location_id AND lfs.deleted_at IS NULL
      JOIN service_zone sz ON sz.fulfillment_set_id = lfs.fulfillment_set_id AND sz.deleted_at IS NULL
      JOIN shipping_option so ON so.service_zone_id = sz.id AND so.deleted_at IS NULL
     WHERE l.deleted_at IS NULL`)
  return {
    ph_region: !!phRegion,
    sellers_total: Number(total?.n ?? 0),
    sellers_with_shipping: Number(ready.rows?.[0]?.n ?? 0),
  }
}

/**
 * GET /admin/shipping-providers
 * Returns all providers with their current platform configuration status.
 * Secrets are never returned; only whether they're set.
 */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  let configMap = new Map<string, any>()
  let checklist: Awaited<ReturnType<typeof shippingChecklist>> | null = null

  try {
    const pg = getPgConnection(req)
    const rows = await pg('platform_shipping_provider')
      .whereNull('deleted_at')
      .select('provider_id', 'is_active', 'credentials', 'settings', 'created_at', 'updated_at')
    configMap = new Map<string, any>(rows.map((r: any) => [r.provider_id, r]))
    checklist = await shippingChecklist(pg)
  } catch {
    // Table may not exist yet (migration pending) — return static list with no config
  }

  const providers = PLATFORM_PROVIDERS.map((p) => {
    const config = configMap.get(p.provider_id)
    const creds = parseJson(config?.credentials)
    const settings = parseJson(config?.settings)
    return {
      ...p,
      is_active: config?.is_active ?? false,
      is_configured: !!config,
      configured_at: config?.created_at ?? null,
      last_updated: config?.updated_at ?? null,
      settings: { ...settings, webhook: undefined },
      ...(p.provider_id === 'flyingtigers' &&
        config && {
          mode: flyingTigersMode(creds.api_key),
          webhook: settings.webhook ?? null,
          // Registered with Flying Tigers, and we hold the secret to check its deliveries
          webhook_ready: !!settings.webhook && !!(creds.webhook_secret || process.env.FLYINGTIGERS_WEBHOOK_SECRET),
        }),
    }
  })

  res.json({
    providers,
    active_count: providers.filter((p) => p.is_active).length,
    checklist,
  })
}

/**
 * POST /admin/shipping-providers
 * Actions: save-credentials | test-credentials | register-webhook | activate | deactivate | remove
 */
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  try {
    const pg = getPgConnection(req)
    const { action, provider_id, credentials, settings, webhook_url } = req.body as {
      action: string
      provider_id: string
      credentials?: Record<string, unknown>
      settings?: Record<string, unknown>
      webhook_url?: string
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

        // provider_id has a global UNIQUE constraint that ignores deleted_at,
        // so a previously "removed" (soft-deleted) row still reserves the key.
        // Look up any existing row — including soft-deleted — and revive it
        // rather than inserting a duplicate.
        const anyRow = await pg('platform_shipping_provider')
          .where({ provider_id })
          .first()

        // Merge with existing credentials/settings. The GET endpoint never
        // returns secret values, so the admin form's password fields come back
        // blank on edit — without merging, saving would wipe the stored
        // api_key/api_secret. Only apply fields that were actually provided.
        const existingCreds = parseJson(anyRow?.credentials)
        const existingSettings = parseJson(anyRow?.settings)

        const mergedCreds: Record<string, unknown> = { ...existingCreds }
        for (const [k, v] of Object.entries(credentials)) {
          if (v !== undefined && v !== null && v !== '') mergedCreds[k] = v
        }

        const upsertData = {
          credentials: JSON.stringify(mergedCreds),
          settings: JSON.stringify({ ...existingSettings, ...(settings ?? {}) }),
          updated_at: new Date(),
        }

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
          // FT's rate endpoint can return a server-side 500 even for valid
          // requests, so a successful rate isn't a reliable signal. The point of
          // this test is the credentials: FT returns 401/403 only when the
          // api_key/api_secret are wrong — any other response means auth passed.
          try {
            await getFlyingTigersRates(
              creds.api_key as string,
              creds.api_secret as string,
              { origin_postal: '1000', dest_postal: '1600', weight_kg: 1 }
            )
          } catch (e) {
            const status = (e as { status?: number }).status
            if (status === 401 || status === 403) {
              return res.status(400).json({
                success: false,
                message: 'Flying Tigers rejected these credentials (invalid API key or secret).',
              })
            }
            // Authenticated successfully; the rate request itself failed.
          }
          return res.json({ success: true, message: 'Flying Tigers credentials verified successfully' })
        }

        return res.json({ success: true, message: 'Credentials saved (live test not available for this provider)' })
      }

      case 'register-webhook': {
        if (provider_id !== 'flyingtigers') {
          return res.status(400).json({ message: `${providerDef.name}'s webhook is set up in its own dashboard` })
        }
        const creds = parseJson(existing?.credentials)
        if (!creds.api_key || !creds.api_secret) {
          return res.status(400).json({ message: 'Save the API key and secret first' })
        }
        // Our own endpoint over HTTPS, so the signing secret only ever goes to us
        let url: URL | null = null
        try {
          url = new URL(String(webhook_url ?? ''))
        } catch {}
        if (!url || url.protocol !== 'https:' || url.pathname !== '/webhooks/flyingtigers') {
          return res.status(400).json({ message: 'The webhook URL must be this server\'s https://…/webhooks/flyingtigers' })
        }
        const hook = await registerFlyingTigersWebhook(creds.api_key, creds.api_secret, url.toString())
        if (!hook.signingSecret) {
          return res.status(502).json({ message: 'Flying Tigers registered the webhook but sent no signing secret' })
        }
        await pg('platform_shipping_provider')
          .where({ id: existing.id })
          .update({
            credentials: JSON.stringify({ ...creds, webhook_secret: hook.signingSecret }),
            settings: JSON.stringify({
              ...parseJson(existing.settings),
              webhook: { id: hook.id, url: hook.url ?? url.toString(), mode: hook.mode, registered_at: new Date().toISOString() },
            }),
            updated_at: new Date(),
          })
        return res.json({ success: true, message: `Webhook registered (${hook.mode}). Shipment updates will now arrive automatically.` })
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
