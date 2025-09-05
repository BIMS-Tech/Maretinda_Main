import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { VendorShippingService, MultiVendorShippingService } from "@mercurjs/shipping"

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
    const vendorShippingService = new VendorShippingService(req.scope)
    const multiVendorShippingService = new MultiVendorShippingService(req.scope)

    // Get vendor's shipping configuration
    const vendorConfig = await vendorShippingService.getVendorConfig(vendorId)
    
    // Get available providers with vendor-specific information
    const availableProviders = multiVendorShippingService.getConfiguredProviders()
    
    // Enhance provider info with vendor-specific details
    const vendorProviders = await Promise.all(
      availableProviders.map(async (provider) => {
        const credentials = await vendorShippingService.getVendorCredentials(vendorId, provider.providerId)
        const hasCredentials = !!credentials
        
        return {
          ...provider,
          hasVendorCredentials: hasCredentials,
          isEnabled: vendorConfig?.enabledProviders.includes(provider.providerId) || false,
          isDefault: vendorConfig?.defaultProvider === provider.providerId,
          credentialsLastUsed: credentials?.lastUsed || null,
          vendorSpecificCapabilities: await vendorShippingService.getVendorCapabilities(vendorId, provider.providerId)
        }
      })
    )

    res.json({
      providers: vendorProviders,
      vendorConfig: vendorConfig || {
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
          paymentMethod: 'marketplace',
          costMarkup: 0,
          handlingFee: 0
        }
      }
    })

  } catch (error) {
    console.error('[Vendor Shipping Providers API] Error:', error)
    res.status(500).json({
      error: 'Failed to fetch shipping providers',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export const POST = async (
  req: MedusaRequest<{
    action: 'configure-credentials' | 'update-config' | 'test-connection' | 'enable-provider' | 'disable-provider'
    providerId: string
    data: any
  }>,
  res: MedusaResponse
) => {
  try {
    const user = req.user
    if (!user?.seller) {
      return res.status(401).json({ error: "Unauthorized - seller required" })
    }

    const { action, providerId, data } = req.body
    const vendorId = user.seller.id
    const vendorShippingService = new VendorShippingService(req.scope)

    switch (action) {
      case 'configure-credentials': {
        const { credentials, metadata } = data
        
        // Validate credentials format
        if (!credentials.apiKey || !credentials.apiSecret) {
          return res.status(400).json({ error: 'API key and secret are required' })
        }

        // Store vendor credentials
        const storedCredentials = await vendorShippingService.storeVendorCredentials({
          vendorId,
          providerId,
          credentials,
          isActive: true,
          metadata
        })

        res.json({
          message: 'Credentials configured successfully',
          credentials: {
            providerId: storedCredentials.providerId,
            hasCredentials: true,
            createdAt: storedCredentials.createdAt,
            environment: credentials.environment || 'sandbox'
          }
        })
        break
      }

      case 'update-config': {
        const { enabledProviders, defaultProvider, preferences, billingConfig } = data
        
        const updatedConfig = await vendorShippingService.updateVendorConfig(vendorId, {
          enabledProviders,
          defaultProvider,
          preferences,
          billingConfig
        })

        res.json({
          message: 'Configuration updated successfully',
          config: updatedConfig
        })
        break
      }

      case 'test-connection': {
        const testResult = await vendorShippingService.testVendorConnection(vendorId, providerId)
        
        res.json({
          message: 'Connection test completed',
          result: testResult
        })
        break
      }

      case 'enable-provider': {
        await vendorShippingService.enableProvider(vendorId, providerId)
        
        res.json({
          message: `Provider ${providerId} enabled successfully`
        })
        break
      }

      case 'disable-provider': {
        await vendorShippingService.disableProvider(vendorId, providerId)
        
        res.json({
          message: `Provider ${providerId} disabled successfully`
        })
        break
      }

      default:
        return res.status(400).json({ error: 'Invalid action' })
    }

  } catch (error) {
    console.error('[Vendor Shipping Providers API] Error:', error)
    res.status(500).json({
      error: 'Failed to process shipping provider action',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}


