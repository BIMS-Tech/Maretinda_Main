import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const user = req.user
    if (!user?.seller) {
      return res.status(401).json({ error: "Unauthorized - seller required" })
    }

    const vendorId = user.seller.id

    // Mock data for now - in production this would use the shipping service
    const availableProviders = {
      lalamove: {
        name: 'Lalamove',
        description: 'Same-day delivery service across Asia',
        type: 'same_day',
        capabilities: ['Real-time tracking', 'Proof of delivery', 'Multiple destinations'],
        markets: ['HK', 'SG', 'MY', 'TH', 'PH', 'VN'],
        configTemplate: {
          apiKey: { type: 'string', required: true, description: 'Lalamove API key' },
          apiSecret: { type: 'string', required: true, description: 'Lalamove API secret' },
          market: { type: 'string', required: true, description: 'Market code (e.g., MY, SG)' }
        },
        isVendorConfigurable: true,
        requiresCredentials: true,
        setupInstructions: [
          'Sign up for a Lalamove Partner account',
          'Complete business verification',
          'Get API credentials from Partner Portal'
        ]
      },
      jnt: {
        name: 'J&T Express',
        description: 'Leading express delivery service across Southeast Asia',
        type: 'express',
        capabilities: ['Real-time tracking', 'Proof of delivery', 'Cash on delivery', 'Insurance'],
        markets: ['MY', 'SG', 'TH', 'VN', 'PH', 'ID', 'KH'],
        configTemplate: {
          apiKey: { type: 'string', required: true, description: 'J&T Express API key' },
          customerCode: { type: 'string', required: true, description: 'Customer code' },
          region: { type: 'string', required: true, description: 'Operating region' }
        },
        isVendorConfigurable: true,
        requiresCredentials: true,
        setupInstructions: [
          'Register as J&T Express merchant',
          'Complete business verification',
          'Obtain API key and customer code'
        ]
      },
      ninjavan: {
        name: 'Ninja Van',
        description: 'Last-mile delivery platform across Southeast Asia',
        type: 'same_day',
        capabilities: ['Real-time tracking', 'Proof of delivery', 'Same-day delivery', 'Next-day delivery'],
        markets: ['MY', 'SG', 'TH', 'VN', 'PH', 'ID'],
        configTemplate: {
          apiKey: { type: 'string', required: true, description: 'Ninja Van API key' },
          clientId: { type: 'string', required: true, description: 'Client ID' },
          clientSecret: { type: 'string', required: true, description: 'Client secret' },
          region: { type: 'string', required: true, description: 'Operating region' }
        },
        isVendorConfigurable: true,
        requiresCredentials: true,
        setupInstructions: [
          'Sign up as Ninja Van merchant',
          'Complete merchant onboarding',
          'Get API credentials from dashboard'
        ]
      }
    }
    
    // Mock vendor configuration and credentials
    const vendorConfig = {
      vendorId,
      enabledProviders: [],
      defaultProvider: null,
      preferences: {
        autoSelectBestRate: true,
        maxCostThreshold: null,
        preferredServiceTypes: [],
        blacklistedProviders: []
      },
      billingConfig: {
        paymentMethod: 'vendor-direct',
        costMarkup: 0,
        handlingFee: 0
      }
    }
    
    const providerCredentials = Object.keys(availableProviders).map(providerId => ({
      providerId,
      hasCredentials: false,
      isActive: false,
      lastUsed: null,
      environment: 'sandbox'
    }))

    res.json({
      availableProviders: Object.entries(availableProviders).map(([id, provider]) => ({
        providerId: id,
        ...provider,
        isVendorConfigurable: true, // All providers are vendor-configurable
        requiresCredentials: true,
        setupInstructions: getProviderSetupInstructions(id)
      })),
      vendorConfiguration: vendorConfig || {
        vendorId,
        enabledProviders: [],
        defaultProvider: null,
        preferences: {
          autoSelectBestRate: true,
          maxCostThreshold: null,
          preferredServiceTypes: [],
          blacklistedProviders: []
        },
        billingConfig: {
          paymentMethod: 'vendor-direct', // Default to vendor-direct for new setups
          costMarkup: 0,
          handlingFee: 0
        }
      },
      credentials: providerCredentials,
      setupStatus: {
        hasAnyCredentials: providerCredentials.some(p => p.hasCredentials),
        enabledProvidersCount: vendorConfig?.enabledProviders.length || 0,
        recommendedNextSteps: getRecommendedNextSteps(providerCredentials, vendorConfig)
      }
    })

  } catch (error) {
    console.error('[Vendor Shipping Setup API] Error:', error)
    res.status(500).json({
      error: 'Failed to fetch shipping setup information',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export const POST = async (
  req: MedusaRequest<{
    action: 'configure-provider' | 'test-credentials' | 'enable-provider' | 'set-default' | 'update-preferences'
    providerId?: string
    credentials?: any
    preferences?: any
    billingConfig?: any
  }>,
  res: MedusaResponse
) => {
  try {
    const user = req.user
    if (!user?.seller) {
      return res.status(401).json({ error: "Unauthorized - seller required" })
    }

    const { action, providerId, credentials, preferences, billingConfig } = req.body
    const vendorId = user.seller.id

    switch (action) {
      case 'configure-provider': {
        if (!providerId || !credentials) {
          return res.status(400).json({ error: 'Provider ID and credentials are required' })
        }

        // Validate credentials format based on provider
        const validationResult = validateProviderCredentials(providerId, credentials)
        if (!validationResult.isValid) {
          return res.status(400).json({ 
            error: 'Invalid credentials',
            details: validationResult.errors
          })
        }

        // Mock storing credentials (in production this would use the shipping service)
        console.log(`Storing credentials for vendor ${vendorId}, provider ${providerId}:`, credentials)

        res.json({
          message: `${getProviderDisplayName(providerId)} configured successfully`,
          provider: {
            providerId,
            hasCredentials: true,
            isActive: true,
            environment: credentials.environment || 'sandbox'
          },
          nextSteps: [
            'Test your connection',
            'Configure shipping preferences',
            'Enable additional providers if needed'
          ]
        })
        break
      }

      case 'test-credentials': {
        if (!providerId) {
          return res.status(400).json({ error: 'Provider ID is required' })
        }

        // Mock connection test
        const testResult = {
          success: true,
          responseTime: Math.floor(Math.random() * 500) + 100,
          apiVersion: '1.0',
          supportedFeatures: ['quotation', 'booking', 'tracking'],
          details: 'Connection test successful'
        }
        
        res.json({
          message: 'Connection test completed',
          providerId,
          testResult: {
            success: testResult.success,
            responseTime: testResult.responseTime,
            apiVersion: testResult.apiVersion,
            supportedFeatures: testResult.supportedFeatures,
            lastTested: new Date().toISOString(),
            details: testResult.details
          }
        })
        break
      }

      case 'enable-provider': {
        if (!providerId) {
          return res.status(400).json({ error: 'Provider ID is required' })
        }

        // Mock enabling provider
        console.log(`Enabling provider ${providerId} for vendor ${vendorId}`)
        
        res.json({
          message: `${getProviderDisplayName(providerId)} enabled successfully`,
          providerId,
          isEnabled: true
        })
        break
      }

      case 'set-default': {
        if (!providerId) {
          return res.status(400).json({ error: 'Provider ID is required' })
        }

        // Mock setting default provider
        console.log(`Setting ${providerId} as default provider for vendor ${vendorId}`)
        
        res.json({
          message: `${getProviderDisplayName(providerId)} set as default provider`,
          defaultProvider: providerId
        })
        break
      }

      case 'update-preferences': {
        // Mock updating preferences
        console.log(`Updating preferences for vendor ${vendorId}:`, preferences, billingConfig)
        
        res.json({
          message: 'Shipping preferences updated successfully',
          preferences,
          billingConfig
        })
        break
      }

      default:
        return res.status(400).json({ error: 'Invalid action' })
    }

  } catch (error) {
    console.error('[Vendor Shipping Setup API] Error:', error)
    res.status(500).json({
      error: 'Failed to process shipping setup action',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Helper functions
function getProviderSetupInstructions(providerId: string): string[] {
  const instructions: Record<string, string[]> = {
    lalamove: [
      '1. Sign up for a Lalamove Partner account at partner.lalamove.com',
      '2. Complete the business verification process',
      '3. Get your API key and secret from the Partner Portal',
      '4. Choose your operating market (HK, SG, MY, TH, PH, etc.)',
      '5. Configure your pickup locations'
    ],
    jnt: [
      '1. Register as a J&T Express merchant at www.jtexpress.my/merchant',
      '2. Complete the business registration and verification',
      '3. Obtain your API key and customer code from the merchant portal',
      '4. Set up your collection points',
      '5. Configure your shipping preferences'
    ],
    ninjavan: [
      '1. Sign up as a Ninja Van merchant at www.ninjavan.co/merchant',
      '2. Complete the merchant onboarding process',
      '3. Get your API credentials from the merchant dashboard',
      '4. Set up your pickup locations and operating hours',
      '5. Configure your delivery preferences'
    ],
    dhl: [
      '1. Contact DHL Express to open a business account',
      '2. Complete the credit application and verification',
      '3. Obtain your API credentials from DHL Developer Portal',
      '4. Set up your shipping account preferences',
      '5. Configure your pickup and billing details'
    ]
  }

  return instructions[providerId] || [
    '1. Contact the shipping provider to open a business account',
    '2. Complete their verification process',
    '3. Obtain your API credentials',
    '4. Configure your account preferences'
  ]
}

function validateProviderCredentials(providerId: string, credentials: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  switch (providerId) {
    case 'lalamove':
      if (!credentials.apiKey) errors.push('API key is required')
      if (!credentials.apiSecret) errors.push('API secret is required')
      if (!credentials.market) errors.push('Market code is required')
      break
    case 'jnt':
      if (!credentials.apiKey) errors.push('API key is required')
      if (!credentials.customerCode) errors.push('Customer code is required')
      if (!credentials.region) errors.push('Region is required')
      break
    case 'ninjavan':
      if (!credentials.apiKey) errors.push('API key is required')
      if (!credentials.clientId) errors.push('Client ID is required')
      if (!credentials.clientSecret) errors.push('Client secret is required')
      if (!credentials.region) errors.push('Region is required')
      break
    case 'dhl':
      if (!credentials.apiKey) errors.push('API key is required')
      if (!credentials.apiSecret) errors.push('API secret is required')
      if (!credentials.accountNumber) errors.push('Account number is required')
      break
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

function getProviderDisplayName(providerId: string): string {
  const names: Record<string, string> = {
    lalamove: 'Lalamove',
    jnt: 'J&T Express',
    ninjavan: 'Ninja Van',
    dhl: 'DHL Express'
  }
  return names[providerId] || providerId
}

function getRecommendedNextSteps(credentials: any[], vendorConfig: any): string[] {
  const hasCredentials = credentials.some(p => p.hasCredentials)
  const hasEnabledProviders = vendorConfig?.enabledProviders?.length > 0

  if (!hasCredentials) {
    return [
      'Configure your first shipping provider (recommended: Lalamove for local delivery)',
      'Test the connection to ensure everything works',
      'Enable the provider and set it as default'
    ]
  }

  if (!hasEnabledProviders) {
    return [
      'Enable at least one configured provider',
      'Set a default provider for automatic quotations',
      'Configure your shipping preferences'
    ]
  }

  return [
    'Add more shipping providers for better coverage',
    'Optimize your shipping preferences',
    'Review your cost settings and markup'
  ]
}
