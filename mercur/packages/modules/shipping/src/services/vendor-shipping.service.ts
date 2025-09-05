/**
 * Service for managing vendor-specific shipping provider credentials and configurations
 */
import { 
  VendorShippingCredentials, 
  VendorShippingConfig, 
  VendorShippingContext,
  ProviderAvailability,
  VendorShippingQuotationRequest,
  VendorShippingQuotationResponse,
  IShippingProvider,
  UnifiedQuotationResponse
} from '../interfaces/vendor-shipping.interface'

export class VendorShippingService {
  private container: any
  private providers: Map<string, IShippingProvider> = new Map()

  constructor(container: any) {
    this.container = container
  }

  /**
   * Store vendor-specific credentials for a shipping provider
   */
  async storeVendorCredentials(credentials: Omit<VendorShippingCredentials, 'createdAt' | 'updatedAt'>): Promise<VendorShippingCredentials> {
    try {
      // Encrypt sensitive credentials before storing
      const encryptedCredentials = await this.encryptCredentials(credentials.credentials)
      
      const vendorCredentials: VendorShippingCredentials = {
        ...credentials,
        credentials: encryptedCredentials,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Store in database
      const query = `
        INSERT INTO vendor_shipping_credentials 
        (vendor_id, provider_id, credentials, is_active, created_at, updated_at, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `
      
      const values = [
        vendorCredentials.vendorId,
        vendorCredentials.providerId,
        JSON.stringify(vendorCredentials.credentials),
        vendorCredentials.isActive,
        vendorCredentials.createdAt,
        vendorCredentials.updatedAt,
        JSON.stringify(vendorCredentials.metadata || {})
      ]

      const result = await this.container.query(query, values)
      return result.rows[0]

    } catch (error) {
      console.error('Error storing vendor credentials:', error)
      throw new Error('Failed to store vendor shipping credentials')
    }
  }

  /**
   * Get vendor's credentials for a specific provider
   */
  async getVendorCredentials(vendorId: string, providerId: string): Promise<VendorShippingCredentials | null> {
    try {
      const query = `
        SELECT * FROM vendor_shipping_credentials 
        WHERE vendor_id = $1 AND provider_id = $2 AND is_active = true
      `
      
      const result = await this.container.query(query, [vendorId, providerId])
      
      if (result.rows.length === 0) {
        return null
      }

      const row = result.rows[0]
      const decryptedCredentials = await this.decryptCredentials(JSON.parse(row.credentials))

      return {
        vendorId: row.vendor_id,
        providerId: row.provider_id,
        credentials: decryptedCredentials,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastUsed: row.last_used,
        metadata: JSON.parse(row.metadata || '{}')
      }

    } catch (error) {
      console.error('Error retrieving vendor credentials:', error)
      return null
    }
  }

  /**
   * Get vendor's shipping configuration
   */
  async getVendorConfig(vendorId: string): Promise<VendorShippingConfig | null> {
    try {
      const query = `
        SELECT * FROM vendor_shipping_config 
        WHERE vendor_id = $1
      `
      
      const result = await this.container.query(query, [vendorId])
      
      if (result.rows.length === 0) {
        // Return default config
        return this.createDefaultVendorConfig(vendorId)
      }

      const row = result.rows[0]
      return {
        vendorId: row.vendor_id,
        enabledProviders: JSON.parse(row.enabled_providers || '[]'),
        defaultProvider: row.default_provider,
        preferences: JSON.parse(row.preferences || '{}'),
        billingConfig: JSON.parse(row.billing_config || '{}')
      }

    } catch (error) {
      console.error('Error retrieving vendor config:', error)
      return null
    }
  }

  /**
   * Update vendor's shipping configuration
   */
  async updateVendorConfig(config: VendorShippingConfig): Promise<void> {
    try {
      const query = `
        INSERT INTO vendor_shipping_config 
        (vendor_id, enabled_providers, default_provider, preferences, billing_config, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (vendor_id) DO UPDATE SET
          enabled_providers = EXCLUDED.enabled_providers,
          default_provider = EXCLUDED.default_provider,
          preferences = EXCLUDED.preferences,
          billing_config = EXCLUDED.billing_config,
          updated_at = EXCLUDED.updated_at
      `
      
      const values = [
        config.vendorId,
        JSON.stringify(config.enabledProviders),
        config.defaultProvider,
        JSON.stringify(config.preferences),
        JSON.stringify(config.billingConfig),
        new Date().toISOString()
      ]

      await this.container.query(query, values)

    } catch (error) {
      console.error('Error updating vendor config:', error)
      throw new Error('Failed to update vendor shipping configuration')
    }
  }

  /**
   * Get quotations using vendor-specific or marketplace credentials
   */
  async getVendorQuotations(request: VendorShippingQuotationRequest): Promise<VendorShippingQuotationResponse[]> {
    try {
      const vendorConfig = await this.getVendorConfig(request.vendorContext.vendorId)
      if (!vendorConfig) {
        throw new Error('Vendor shipping configuration not found')
      }

      const quotations: VendorShippingQuotationResponse[] = []

      for (const providerId of vendorConfig.enabledProviders) {
        try {
          // Check if vendor has their own credentials
          const vendorCredentials = await this.getVendorCredentials(request.vendorContext.vendorId, providerId)
          
          let quotation: UnifiedQuotationResponse
          let credentialsSource: 'vendor' | 'marketplace'

          if (vendorCredentials) {
            // Use vendor's credentials
            quotation = await this.getQuotationWithVendorCredentials(request, providerId, vendorCredentials)
            credentialsSource = 'vendor'
          } else {
            // Fall back to marketplace credentials
            quotation = await this.getQuotationWithMarketplaceCredentials(request, providerId)
            credentialsSource = 'marketplace'
          }

          // Calculate costs based on billing configuration
          const costs = this.calculateVendorCosts(quotation, vendorConfig.billingConfig, credentialsSource)

          quotations.push({
            ...quotation,
            vendorCost: costs.vendorCost,
            marketplaceCost: costs.marketplaceCost,
            markup: costs.markup,
            billingResponsibility: costs.billingResponsibility,
            credentialsSource
          })

        } catch (error) {
          console.warn(`Failed to get quotation from ${providerId}:`, error)
          // Continue with other providers
        }
      }

      return quotations

    } catch (error) {
      console.error('Error getting vendor quotations:', error)
      throw new Error('Failed to get shipping quotations for vendor')
    }
  }

  /**
   * Get available providers for a vendor
   */
  async getAvailableProviders(vendorContext: VendorShippingContext): Promise<ProviderAvailability[]> {
    // This would check which providers are available based on:
    // - Vendor's market/region
    // - Business type and requirements
    // - Whether they have credentials set up
    
    const allProviders = ['lalamove', 'dhl', 'fedex', 'ups'] // From your provider registry
    const availableProviders: ProviderAvailability[] = []

    for (const providerId of allProviders) {
      const hasCredentials = await this.getVendorCredentials(vendorContext.vendorId, providerId) !== null
      
      availableProviders.push({
        providerId,
        isAvailableForVendor: true, // You'd implement actual availability logic
        requiresCredentials: true,
        supportedMarkets: ['PH', 'MY', 'SG'], // From provider config
        minimumRequirements: {
          businessRegistration: providerId === 'dhl', // DHL might require business registration
          minimumVolume: providerId === 'fedex' ? 10 : undefined
        }
      })
    }

    return availableProviders
  }

  // Private helper methods

  private async encryptCredentials(credentials: any): Promise<any> {
    // Implement encryption logic
    // For now, return as-is (you'd use proper encryption in production)
    return credentials
  }

  private async decryptCredentials(encryptedCredentials: any): Promise<any> {
    // Implement decryption logic
    return encryptedCredentials
  }

  private createDefaultVendorConfig(vendorId: string): VendorShippingConfig {
    return {
      vendorId,
      enabledProviders: [],
      preferences: {
        autoSelectBestRate: true,
        preferredServiceTypes: ['standard'],
        blacklistedProviders: []
      },
      billingConfig: {
        paymentMethod: 'marketplace',
        costMarkup: 0
      }
    }
  }

  private async getQuotationWithVendorCredentials(
    request: VendorShippingQuotationRequest, 
    providerId: string, 
    credentials: VendorShippingCredentials
  ): Promise<UnifiedQuotationResponse> {
    // Initialize provider with vendor's credentials
    const provider = this.providers.get(providerId)
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`)
    }

    // Temporarily configure provider with vendor credentials
    await provider.initialize({
      providerId,
      name: providerId,
      type: 'same_day' as any,
      enabled: true,
      priority: 1,
      configuration: credentials.credentials,
      supportedMarkets: ['PH'],
      supportedServiceTypes: ['standard'],
      capabilities: {
        sameDay: true,
        express: true,
        international: false,
        realTimeTracking: true,
        proofOfDelivery: true,
        multipleDestinations: true
      }
    })

    return await provider.getQuotation(request)
  }

  private async getQuotationWithMarketplaceCredentials(
    request: VendorShippingQuotationRequest, 
    providerId: string
  ): Promise<UnifiedQuotationResponse> {
    // Use the existing multi-vendor service with marketplace credentials
    const multiVendorService = this.container.resolve('multiVendorShipping')
    const quotations = await multiVendorService.getMultipleQuotations(request)
    
    const providerQuotation = quotations.find((q: any) => q.providerId === providerId)
    if (!providerQuotation) {
      throw new Error(`No quotation available from ${providerId}`)
    }

    return providerQuotation
  }

  private calculateVendorCosts(
    quotation: UnifiedQuotationResponse, 
    billingConfig: any,
    credentialsSource: 'vendor' | 'marketplace'
  ) {
    const basePrice = parseFloat(quotation.priceBreakdown.total)
    
    if (credentialsSource === 'vendor') {
      // Vendor pays directly to shipping provider
      return {
        vendorCost: basePrice,
        marketplaceCost: 0,
        markup: 0,
        billingResponsibility: 'vendor' as const
      }
    } else {
      // Marketplace pays, then charges vendor with possible markup
      const markup = billingConfig.costMarkup || 0
      const markupAmount = basePrice * (markup / 100)
      const vendorCost = basePrice + markupAmount + (billingConfig.handlingFee || 0)
      
      return {
        vendorCost,
        marketplaceCost: basePrice,
        markup: markupAmount,
        billingResponsibility: 'marketplace' as const
      }
    }
  }
}







