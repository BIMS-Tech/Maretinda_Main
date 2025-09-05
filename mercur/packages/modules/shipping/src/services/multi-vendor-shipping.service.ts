import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import {
  IShippingProvider,
  ShippingProviderConfig,
  UnifiedQuotationRequest,
  UnifiedQuotationResponse,
  UnifiedOrderRequest,
  UnifiedOrderResponse,
  TrackingUpdate,
  ProviderSelectionCriteria,
  ProviderComparison,
  WebhookPayload,
  UnifiedOrderStatus
} from '../interfaces/shipping-provider.interface'
import { LalamoveProvider } from '../providers/lalamove-provider'
import { DHLProvider } from '../providers/dhl-provider'
import { JNTProvider } from '../providers/jnt-provider'
import { NinjaVanProvider } from '../providers/ninjavan-provider'

/**
 * Multi-vendor shipping service that manages multiple shipping providers
 * Handles provider selection, quotation comparison, and unified order management
 */
export class MultiVendorShippingService {
  private providers = new Map<string, IShippingProvider>()
  private providerConfigs = new Map<string, ShippingProviderConfig>()
  private container: any

  constructor(container: any) {
    this.container = container
    this.initializeProviders()
  }

  /**
   * Initialize all available shipping providers
   */
  private initializeProviders(): void {
    // Register all available providers
    const availableProviders = [
      new LalamoveProvider(),
      new DHLProvider(),
      new JNTProvider(),
      new NinjaVanProvider()
      // Add more providers here as they're implemented
    ]

    availableProviders.forEach(provider => {
      this.providers.set(provider.providerId, provider)
    })
  }

  /**
   * Configure a shipping provider
   */
  async configureProvider(config: ShippingProviderConfig): Promise<void> {
    const provider = this.providers.get(config.providerId)
    
    if (!provider) {
      throw new Error(`Provider ${config.providerId} not found`)
    }

    try {
      await provider.initialize(config)
      this.providerConfigs.set(config.providerId, config)
      
      // Store configuration in database
      await this.saveProviderConfig(config)
      
      console.log(`Provider ${config.name} configured successfully`)
    } catch (error) {
      console.error(`Failed to configure provider ${config.name}:`, error)
      throw error
    }
  }

  /**
   * Get all configured providers
   */
  getConfiguredProviders(): ShippingProviderConfig[] {
    return Array.from(this.providerConfigs.values())
  }

  /**
   * Get quotations from multiple providers
   */
  async getMultipleQuotations(
    request: UnifiedQuotationRequest,
    criteria?: ProviderSelectionCriteria
  ): Promise<ProviderComparison[]> {
    const availableProviders = await this.selectProviders(criteria || { market: request.market || 'HK' })
    const quotations: ProviderComparison[] = []

    // Get quotations from all available providers in parallel
    const quotationPromises = availableProviders.map(async (providerId) => {
      try {
        const provider = this.providers.get(providerId)
        if (!provider) return null

        const quotation = await provider.getQuotation(request)
        const score = this.calculateProviderScore(quotation, criteria)
        
        return {
          providerId,
          quotation,
          score,
          reasoning: this.generateScoreReasoning(quotation, criteria),
          available: true
        }
      } catch (error) {
        console.warn(`Provider ${providerId} quotation failed:`, error instanceof Error ? error.message : String(error))
        return {
          providerId,
          quotation: null as any,
          score: 0,
          reasoning: [`Error: ${error instanceof Error ? error.message : String(error)}`],
          available: false
        }
      }
    })

    const results = await Promise.all(quotationPromises)
    
    return results
      .filter(result => result !== null)
      .sort((a, b) => b.score - a.score) // Sort by score descending
  }

  /**
   * Get the best quotation based on criteria
   */
  async getBestQuotation(
    request: UnifiedQuotationRequest,
    criteria?: ProviderSelectionCriteria
  ): Promise<UnifiedQuotationResponse> {
    const comparisons = await this.getMultipleQuotations(request, criteria)
    
    const bestProvider = comparisons.find(comp => comp.available)
    
    if (!bestProvider) {
      throw new Error('No available providers for this request')
    }

    return bestProvider.quotation
  }

  /**
   * Place order with specific provider
   */
  async placeOrder(
    request: UnifiedOrderRequest,
    providerId?: string
  ): Promise<UnifiedOrderResponse> {
    let selectedProviderId = providerId

    // If no provider specified, try to extract from quotation metadata
    if (!selectedProviderId) {
      const quotationData = await this.getStoredQuotation(request.quotationId)
      selectedProviderId = quotationData?.providerId
    }

    if (!selectedProviderId) {
      throw new Error('Provider ID not specified and could not be determined from quotation')
    }

    const provider = this.providers.get(selectedProviderId)
    if (!provider) {
      throw new Error(`Provider ${selectedProviderId} not found`)
    }

    try {
      const order = await provider.placeOrder(request)
      
      // Store order in database
      await this.storeOrder(order)
      
      return order
    } catch (error) {
      console.error(`Failed to place order with provider ${selectedProviderId}:`, error)
      throw error
    }
  }

  /**
   * Get order details from any provider
   */
  async getOrder(orderId: string, providerId?: string): Promise<UnifiedOrderResponse> {
    if (providerId) {
      const provider = this.providers.get(providerId)
      if (!provider) {
        throw new Error(`Provider ${providerId} not found`)
      }
      return provider.getOrder(orderId)
    }

    // Try to find order in database first
    const storedOrder = await this.getStoredOrder(orderId)
    if (storedOrder) {
      const provider = this.providers.get(storedOrder.providerId)
      if (provider) {
        return provider.getOrder(storedOrder.providerOrderId)
      }
    }

    // Fallback: try all providers (not recommended for production)
    for (const [pid, provider] of this.providers) {
      try {
        return await provider.getOrder(orderId)
      } catch (error) {
        // Continue to next provider
      }
    }

    throw new Error(`Order ${orderId} not found in any provider`)
  }

  /**
   * Track order across providers
   */
  async trackOrder(orderId: string, providerId?: string): Promise<TrackingUpdate[]> {
    if (providerId) {
      const provider = this.providers.get(providerId)
      if (!provider) {
        throw new Error(`Provider ${providerId} not found`)
      }
      return provider.trackOrder(orderId)
    }

    // Get tracking from stored order info
    const storedOrder = await this.getStoredOrder(orderId)
    if (storedOrder) {
      const provider = this.providers.get(storedOrder.providerId)
      if (provider) {
        return provider.trackOrder(storedOrder.providerOrderId)
      }
    }

    throw new Error(`Cannot track order ${orderId} - provider not determined`)
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, reason?: string, providerId?: string): Promise<void> {
    if (providerId) {
      const provider = this.providers.get(providerId)
      if (!provider) {
        throw new Error(`Provider ${providerId} not found`)
      }
      return provider.cancelOrder(orderId, reason)
    }

    // Get provider from stored order
    const storedOrder = await this.getStoredOrder(orderId)
    if (storedOrder) {
      const provider = this.providers.get(storedOrder.providerId)
      if (provider) {
        await provider.cancelOrder(storedOrder.providerOrderId, reason)
        // Update stored order status
        await this.updateStoredOrderStatus(orderId, UnifiedOrderStatus.CANCELLED)
        return
      }
    }

    throw new Error(`Cannot cancel order ${orderId} - provider not determined`)
  }

  /**
   * Process webhook from any provider
   */
  async processWebhook(providerId: string, payload: WebhookPayload): Promise<TrackingUpdate[]> {
    const provider = this.providers.get(providerId)
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`)
    }

    try {
      const updates = await provider.processWebhook!(payload)
      
      // Store tracking updates
      for (const update of updates) {
        await this.storeTrackingUpdate(update)
      }
      
      return updates
    } catch (error) {
      console.error(`Failed to process webhook for provider ${providerId}:`, error)
      throw error
    }
  }

  /**
   * Get all tracking history for an order
   */
  async getTrackingHistory(orderId: string): Promise<TrackingUpdate[]> {
    return this.getStoredTrackingUpdates(orderId)
  }

  /**
   * Select providers based on criteria
   */
  private async selectProviders(criteria: ProviderSelectionCriteria): Promise<string[]> {
    const availableProviders: string[] = []

    for (const [providerId, config] of this.providerConfigs) {
      if (!config.enabled) continue

      // Check excluded providers
      if (criteria.excludeProviders?.includes(providerId)) continue

      const provider = this.providers.get(providerId)
      if (!provider) continue

      try {
        const isAvailable = await provider.isAvailable(criteria.market, criteria.serviceType)
        if (isAvailable) {
          availableProviders.push(providerId)
        }
      } catch (error) {
        console.warn(`Provider ${providerId} availability check failed:`, error instanceof Error ? error.message : String(error))
      }
    }

    // Sort by preferred providers and priority
    return availableProviders.sort((a, b) => {
      const aPreferred = criteria.preferredProviders?.includes(a) ? 1 : 0
      const bPreferred = criteria.preferredProviders?.includes(b) ? 1 : 0
      
      if (aPreferred !== bPreferred) {
        return bPreferred - aPreferred
      }

      const aConfig = this.providerConfigs.get(a)
      const bConfig = this.providerConfigs.get(b)
      
      return (bConfig?.priority || 0) - (aConfig?.priority || 0)
    })
  }

  /**
   * Calculate provider score based on criteria
   */
  private calculateProviderScore(
    quotation: UnifiedQuotationResponse,
    criteria?: ProviderSelectionCriteria
  ): number {
    let score = 100 // Base score

    if (!criteria) return score

    const price = parseFloat(quotation.priceBreakdown.total)

    // Price scoring
    if (criteria.maxCost) {
      const maxCost = parseFloat(criteria.maxCost)
      if (price > maxCost) {
        score -= 50 // Heavy penalty for exceeding max cost
      } else {
        score += (maxCost - price) / maxCost * 20 // Bonus for being under budget
      }
    }

    // Priority-based scoring
    switch (criteria.priority) {
      case 'cost':
        score += (200 - price) / 10 // Lower price = higher score
        break
      case 'speed':
        // Would need delivery time in quotation to score properly
        score += 10 // Placeholder
        break
      case 'reliability':
        // Would need reliability metrics to score properly
        score += 15 // Placeholder
        break
    }

    // Provider-specific bonuses
    const config = this.providerConfigs.get(quotation.providerId)
    if (config) {
      score += config.priority * 2
    }

    return Math.max(0, score)
  }

  /**
   * Generate reasoning for provider score
   */
  private generateScoreReasoning(
    quotation: UnifiedQuotationResponse,
    criteria?: ProviderSelectionCriteria
  ): string[] {
    const reasons: string[] = []
    
    reasons.push(`Price: ${quotation.priceBreakdown.total} ${quotation.priceBreakdown.currency}`)
    
    if (criteria?.maxCost) {
      const price = parseFloat(quotation.priceBreakdown.total)
      const maxCost = parseFloat(criteria.maxCost)
      if (price <= maxCost) {
        reasons.push(`Within budget (${criteria.maxCost})`)
      } else {
        reasons.push(`Exceeds budget (${criteria.maxCost})`)
      }
    }

    if (quotation.estimatedDelivery) {
      reasons.push(`Estimated delivery: ${quotation.estimatedDelivery}`)
    }

    const config = this.providerConfigs.get(quotation.providerId)
    if (config) {
      reasons.push(`Provider priority: ${config.priority}`)
    }

    return reasons
  }

  // Database operations
  private async getConnection() {
    try {
      return this.container.resolve(ContainerRegistrationKeys.QUERY)
    } catch (error) {
      return this.container.__pg_connection__ || this.container.pgConnection
    }
  }

  private async saveProviderConfig(config: ShippingProviderConfig): Promise<void> {
    const connection = await this.getConnection()
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS shipping_provider_configs (
        provider_id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        enabled BOOLEAN DEFAULT true,
        priority INTEGER DEFAULT 0,
        configuration JSONB NOT NULL,
        supported_markets JSONB NOT NULL,
        supported_service_types JSONB NOT NULL,
        webhook_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await connection.query(`
      INSERT INTO shipping_provider_configs 
      (provider_id, name, type, enabled, priority, configuration, supported_markets, supported_service_types, webhook_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (provider_id) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        enabled = EXCLUDED.enabled,
        priority = EXCLUDED.priority,
        configuration = EXCLUDED.configuration,
        supported_markets = EXCLUDED.supported_markets,
        supported_service_types = EXCLUDED.supported_service_types,
        webhook_url = EXCLUDED.webhook_url,
        updated_at = CURRENT_TIMESTAMP
    `, [
      config.providerId,
      config.name,
      config.type,
      config.enabled,
      config.priority,
      JSON.stringify(config.configuration),
      JSON.stringify(config.supportedMarkets),
      JSON.stringify(config.supportedServiceTypes),
      config.webhookUrl
    ])
  }

  private async storeOrder(order: UnifiedOrderResponse): Promise<void> {
    const connection = await this.getConnection()
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS unified_shipping_orders (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(255) NOT NULL,
        provider_id VARCHAR(255) NOT NULL,
        provider_order_id VARCHAR(255) NOT NULL,
        quotation_id VARCHAR(255) NOT NULL,
        status VARCHAR(100) NOT NULL,
        tracking_number VARCHAR(255),
        tracking_url TEXT,
        share_link TEXT,
        price_breakdown JSONB NOT NULL,
        estimated_delivery TIMESTAMP,
        driver_info JSONB,
        proof_of_delivery JSONB,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await connection.query(`
      INSERT INTO unified_shipping_orders 
      (order_id, provider_id, provider_order_id, quotation_id, status, tracking_number, tracking_url, share_link, price_breakdown, estimated_delivery, driver_info, proof_of_delivery, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      order.orderId,
      order.providerId,
      order.providerOrderId,
      order.quotationId,
      order.status,
      order.trackingNumber,
      order.trackingUrl,
      order.shareLink,
      JSON.stringify(order.priceBreakdown),
      order.estimatedDelivery ? new Date(order.estimatedDelivery) : null,
      JSON.stringify(order.driverInfo || {}),
      JSON.stringify(order.proofOfDelivery || {}),
      JSON.stringify(order.metadata || {})
    ])
  }

  private async getStoredOrder(orderId: string): Promise<any> {
    const connection = await this.getConnection()
    const result = await connection.query(
      'SELECT * FROM unified_shipping_orders WHERE order_id = $1 OR provider_order_id = $1',
      [orderId]
    )
    return result.rows[0] || null
  }

  private async updateStoredOrderStatus(orderId: string, status: UnifiedOrderStatus): Promise<void> {
    const connection = await this.getConnection()
    await connection.query(
      'UPDATE unified_shipping_orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE order_id = $2 OR provider_order_id = $2',
      [status, orderId]
    )
  }

  private async storeTrackingUpdate(update: TrackingUpdate): Promise<void> {
    const connection = await this.getConnection()
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS shipping_tracking_updates (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(255) NOT NULL,
        provider_id VARCHAR(255) NOT NULL,
        status VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        location JSONB,
        driver_info JSONB,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await connection.query(`
      INSERT INTO shipping_tracking_updates 
      (order_id, provider_id, status, message, timestamp, location, driver_info, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      update.orderId,
      update.providerId,
      update.status,
      update.message,
      new Date(update.timestamp),
      JSON.stringify(update.location || {}),
      JSON.stringify(update.driverInfo || {}),
      JSON.stringify(update.metadata || {})
    ])
  }

  private async getStoredTrackingUpdates(orderId: string): Promise<TrackingUpdate[]> {
    const connection = await this.getConnection()
    const result = await connection.query(
      'SELECT * FROM shipping_tracking_updates WHERE order_id = $1 ORDER BY timestamp ASC',
      [orderId]
    )
    
    return result.rows.map((row: any) => ({
      orderId: row.order_id,
      providerId: row.provider_id,
      status: row.status,
      message: row.message,
      timestamp: row.timestamp.toISOString(),
      location: row.location,
      driverInfo: row.driver_info,
      metadata: row.metadata
    }))
  }

  private async getStoredQuotation(quotationId: string): Promise<any> {
    // Implementation would depend on how quotations are stored
    // For now, return null to indicate quotation not found in storage
    return null
  }
}

