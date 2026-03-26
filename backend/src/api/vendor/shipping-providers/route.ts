import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { randomUUID } from 'crypto'
import { getNinjaVanToken } from '../../../services/ninjavan'

const PROVIDERS = [
  {
    providerId: 'ninjavan',
    name: 'Ninja Van',
    type: 'express',
    supportedMarkets: ['PH', 'MY', 'SG', 'TH', 'VN', 'ID'],
    capabilities: ['Real-time tracking', 'Waybill generation', 'Webhooks', 'Standard & Express'],
    configTemplate: {
      client_id: { type: 'text', required: true, description: 'Client ID from Ninja Dashboard', credentialPath: 'Settings > IT Settings' },
      client_secret: { type: 'password', required: true, description: 'Client Key from Ninja Dashboard', credentialPath: 'Settings > IT Settings' },
      country_code: { type: 'select', required: true, description: 'Your operating country', options: ['PH', 'MY', 'SG', 'TH', 'VN', 'ID'] },
      sandbox: { type: 'boolean', required: false, description: 'Use sandbox environment for testing' },
    },
    credentialLinks: {
      signupUrl: 'https://www.ninjavan.co/en-ph/business-registration',
      dashboardUrl: 'https://dashboard.ninjavan.co',
      apiDocsUrl: 'https://api-docs.ninjavan.co/en',
      sandboxUrl: 'https://dashboard-sandbox.ninjavan.co',
    },
    setupInstructions: [
      'Register a Ninja Van Postpaid Pro account',
      'Log in to your Ninja Dashboard (sandbox or production)',
      'Go to Settings > IT Settings and click "REGENERATE CLIENT ID & KEY"',
      'Copy the Client ID and Client Key into the fields below',
      'Select your country and toggle sandbox mode on for testing',
    ],
  },
  {
    providerId: 'jnt',
    name: 'J&T Express',
    type: 'express',
    supportedMarkets: ['PH', 'MY', 'SG', 'TH', 'VN', 'ID'],
    capabilities: ['Tracking via AfterShip', 'Status webhooks'],
    configTemplate: {
      aftership_api_key: { type: 'password', required: true, description: 'AfterShip API Key (for tracking)', credentialPath: 'AfterShip Dashboard > Settings > API Keys' },
      country_code: { type: 'select', required: true, description: 'Your operating country', options: ['PH', 'MY', 'SG', 'TH', 'VN', 'ID'] },
    },
    credentialLinks: {
      signupUrl: 'https://www.jtexpress.ph/index/signup.html',
      dashboardUrl: 'https://admin.aftership.com',
      apiDocsUrl: 'https://www.aftership.com/docs/tracking/2024-04/overview',
    },
    setupInstructions: [
      'Register a J&T Express shipper account',
      'Sign up for AfterShip (free tier available)',
      'In AfterShip, go to Settings > API Keys and create a new key',
      'Connect your J&T Express account in AfterShip Couriers',
      'Paste the AfterShip API Key below',
    ],
  },
  {
    providerId: 'lalamove',
    name: 'Lalamove',
    type: 'same_day',
    supportedMarkets: ['PH', 'MY', 'SG', 'TH', 'HK', 'VN'],
    capabilities: ['Same-day delivery', 'Real-time tracking', 'Proof of delivery'],
    configTemplate: {
      api_key: { type: 'text', required: true, description: 'Lalamove API Key' },
      api_secret: { type: 'password', required: true, description: 'Lalamove API Secret' },
      market: { type: 'select', required: true, description: 'Your market', options: ['PH', 'MY', 'SG', 'TH', 'HK', 'VN'] },
      sandbox: { type: 'boolean', required: false, description: 'Use sandbox environment' },
    },
    credentialLinks: {
      signupUrl: 'https://www.lalamove.com/en-ph/business',
      dashboardUrl: 'https://driver.lalamove.com',
      apiDocsUrl: 'https://developers.lalamove.com',
    },
    setupInstructions: [
      'Register a Lalamove Business account',
      'Request API access from your account manager',
      'Obtain your API Key and Secret from the developer portal',
      'Enter your credentials below',
    ],
  },
]

function getPgConnection(req: AuthenticatedMedusaRequest): any {
  try {
    return req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  } catch {
    return (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
  }
}

async function getSellerId(req: AuthenticatedMedusaRequest, pg: any): Promise<string | null> {
  const actorId = (req as any).auth_context?.actor_id
  if (!actorId) return null
  const member = await pg('member').where('id', actorId).first()
  return member?.seller_id ?? null
}

/**
 * GET /vendor/shipping-providers
 * Returns the list of available providers + the vendor's configured status for each.
 */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  try {
    const pg = getPgConnection(req)
    const sellerId = await getSellerId(req, pg)
    if (!sellerId) return res.status(403).json({ message: 'Seller not found' })

    // Load all credentials for this seller
    const credentials = await pg('vendor_shipping_credential')
      .where({ seller_id: sellerId })
      .whereNull('deleted_at')
      .select('provider', 'is_enabled', 'is_default', 'country_code', 'updated_at')

    const credMap = new Map<string, any>(credentials.map((c: any) => [c.provider, c]))

    const providers = PROVIDERS.map((p) => {
      const cred = credMap.get(p.providerId)
      return {
        ...p,
        hasVendorCredentials: !!cred,
        isEnabled: cred?.is_enabled ?? false,
        isDefault: cred?.is_default ?? false,
        credentialsLastUsed: cred?.updated_at ?? null,
      }
    })

    const enabledProviders = providers.filter((p) => p.isEnabled).map((p) => p.providerId)
    const defaultProvider = providers.find((p) => p.isDefault)?.providerId

    res.json({
      providers,
      vendorConfig: {
        vendorId: sellerId,
        enabledProviders,
        defaultProvider,
        preferences: {
          autoSelectBestRate: false,
          preferredServiceTypes: [],
          blacklistedProviders: [],
        },
        billingConfig: {
          paymentMethod: 'vendor-direct',
          costMarkup: 0,
          handlingFee: 0,
        },
      },
    })
  } catch (error) {
    console.error('[Shipping Providers GET]', error)
    res.status(500).json({ message: 'Failed to load shipping providers' })
  }
}

/**
 * POST /vendor/shipping-providers
 * Actions: save-credentials | test-credentials | enable | disable | set-default | remove
 */
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  try {
    const pg = getPgConnection(req)
    const sellerId = await getSellerId(req, pg)
    if (!sellerId) return res.status(403).json({ message: 'Seller not found' })

    const { action, providerId, data } = req.body as {
      action: string
      providerId: string
      data?: Record<string, unknown>
    }

    if (!action || !providerId) {
      return res.status(400).json({ message: 'action and providerId are required' })
    }

    const knownProvider = PROVIDERS.find((p) => p.providerId === providerId)
    if (!knownProvider) {
      return res.status(400).json({ message: `Unknown provider: ${providerId}` })
    }

    const existing = await pg('vendor_shipping_credential')
      .where({ seller_id: sellerId, provider: providerId })
      .whereNull('deleted_at')
      .first()

    switch (action) {
      case 'save-credentials': {
        const { credentials, country_code, sandbox } = (data ?? {}) as {
          credentials?: Record<string, unknown>
          country_code?: string
          sandbox?: boolean
        }

        if (!credentials) return res.status(400).json({ message: 'credentials are required' })

        const stored = {
          ...credentials,
          sandbox: sandbox ?? false,
        }

        if (existing) {
          await pg('vendor_shipping_credential')
            .where({ id: existing.id })
            .update({ credentials: JSON.stringify(stored), country_code, updated_at: new Date() })
        } else {
          await pg('vendor_shipping_credential').insert({
            id: `vsc_${randomUUID().replace(/-/g, '')}`,
            seller_id: sellerId,
            provider: providerId,
            country_code,
            credentials: JSON.stringify(stored),
            is_enabled: false,
            is_default: false,
          })
        }

        return res.json({ success: true, message: 'Credentials saved' })
      }

      case 'test-credentials': {
        if (!existing) {
          return res.status(400).json({ message: 'No credentials saved. Please save credentials first.' })
        }

        const creds = existing.credentials as Record<string, unknown>

        if (providerId === 'ninjavan') {
          await getNinjaVanToken(
            creds.client_id as string,
            creds.client_secret as string,
            existing.country_code ?? 'PH',
            creds.sandbox as boolean
          )
          return res.json({ success: true, message: 'Ninja Van credentials verified successfully' })
        }

        return res.json({ success: true, message: 'Credentials appear valid (connection test not available for this provider)' })
      }

      case 'enable': {
        if (!existing) return res.status(400).json({ message: 'Save credentials first' })
        await pg('vendor_shipping_credential')
          .where({ id: existing.id })
          .update({ is_enabled: true, updated_at: new Date() })
        return res.json({ success: true, message: `${knownProvider.name} enabled` })
      }

      case 'disable': {
        if (!existing) return res.status(400).json({ message: 'Provider not configured' })
        await pg('vendor_shipping_credential')
          .where({ id: existing.id })
          .update({ is_enabled: false, is_default: false, updated_at: new Date() })
        return res.json({ success: true, message: `${knownProvider.name} disabled` })
      }

      case 'set-default': {
        if (!existing?.is_enabled) return res.status(400).json({ message: 'Enable the provider first' })
        // Unset all other defaults for this seller
        await pg('vendor_shipping_credential')
          .where({ seller_id: sellerId })
          .update({ is_default: false, updated_at: new Date() })
        await pg('vendor_shipping_credential')
          .where({ id: existing.id })
          .update({ is_default: true, updated_at: new Date() })
        return res.json({ success: true, message: `${knownProvider.name} set as default` })
      }

      case 'remove': {
        if (!existing) return res.status(400).json({ message: 'Provider not configured' })
        await pg('vendor_shipping_credential')
          .where({ id: existing.id })
          .update({ deleted_at: new Date() })
        return res.json({ success: true, message: 'Provider credentials removed' })
      }

      default:
        return res.status(400).json({ message: `Unknown action: ${action}` })
    }
  } catch (error) {
    console.error('[Shipping Providers POST]', error)
    res.status(500).json({ message: (error as Error).message || 'Internal error' })
  }
}
