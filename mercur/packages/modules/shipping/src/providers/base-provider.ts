import { 
  IShippingProvider, 
  ShippingProviderConfig, 
  ShippingProviderType,
  UnifiedQuotationRequest,
  UnifiedQuotationResponse,
  UnifiedOrderRequest,
  UnifiedOrderResponse,
  TrackingUpdate,
  WebhookPayload,
  UnifiedLocation,
  UnifiedOrderStatus
} from '../interfaces/shipping-provider.interface'

/**
 * Abstract base class for all shipping providers
 * Provides common functionality and enforces interface implementation
 */
export abstract class BaseShippingProvider implements IShippingProvider {
  protected config!: ShippingProviderConfig
  protected initialized = false

  constructor(
    public readonly providerId: string,
    public readonly name: string,
    public readonly type: ShippingProviderType
  ) {}

  /**
   * Initialize provider with configuration
   */
  async initialize(config: ShippingProviderConfig): Promise<void> {
    this.config = config
    await this.validateConfiguration()
    this.initialized = true
  }

  /**
   * Validate provider-specific configuration
   */
  protected abstract validateConfiguration(): Promise<void>

  /**
   * Ensure provider is initialized before operations
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(`Provider ${this.providerId} not initialized`)
    }
  }

  /**
   * Check if provider is available for given market/service
   */
  async isAvailable(market: string, serviceType?: string): Promise<boolean> {
    this.ensureInitialized()
    
    if (!this.config.enabled) {
      return false
    }

    if (!this.config.supportedMarkets.includes(market)) {
      return false
    }

    if (serviceType && !this.config.supportedServiceTypes.includes(serviceType)) {
      return false
    }

    return this.checkProviderAvailability(market, serviceType)
  }

  /**
   * Provider-specific availability check
   */
  protected abstract checkProviderAvailability(market: string, serviceType?: string): Promise<boolean>

  /**
   * Get available service types for a market
   */
  abstract getServiceTypes(market: string): Promise<string[]>

  /**
   * Get quotation for shipping request
   */
  abstract getQuotation(request: UnifiedQuotationRequest): Promise<UnifiedQuotationResponse>

  /**
   * Place shipping order
   */
  abstract placeOrder(request: UnifiedOrderRequest): Promise<UnifiedOrderResponse>

  /**
   * Get order status and details
   */
  abstract getOrder(orderId: string): Promise<UnifiedOrderResponse>

  /**
   * Track order with real-time updates
   */
  abstract trackOrder(orderId: string): Promise<TrackingUpdate[]>

  /**
   * Cancel order if possible
   */
  abstract cancelOrder(orderId: string, reason?: string): Promise<void>

  /**
   * Default capabilities - override in specific providers
   */
  getCapabilities() {
    return {
      supportsRealTimeTracking: false,
      supportsProofOfDelivery: false,
      supportsScheduledPickup: false,
      supportsMultipleDestinations: false,
      supportsInsurance: false,
      supportsPriorityFee: false,
      supportsOrderModification: false,
      supportsDriverChange: false,
      maxDestinations: 1,
      supportedMarkets: this.config.supportedMarkets || []
    }
  }

  /**
   * Normalize address format across providers
   */
  protected normalizeAddress(location: UnifiedLocation): string {
    const parts = [
      location.address,
      location.city,
      location.state,
      location.postalCode,
      location.country
    ].filter(Boolean)
    
    return parts.join(', ')
  }

  /**
   * Generate unique tracking number
   */
  protected generateTrackingNumber(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${this.providerId.toUpperCase()}-${timestamp}-${random}`
  }

  /**
   * Map provider-specific status to unified status
   */
  protected abstract mapProviderStatus(providerStatus: string): UnifiedOrderStatus

  /**
   * Calculate price breakdown from provider response
   */
  protected calculatePriceBreakdown(
    basePrice: string,
    currency: string,
    additionalFees: Record<string, string> = {}
  ) {
    const base = parseFloat(basePrice)
    const fees = Object.values(additionalFees).reduce((sum, fee) => sum + parseFloat(fee || '0'), 0)
    const taxes = base * 0.1 // Default 10% tax - should be configurable
    const total = base + fees + taxes

    return {
      base: basePrice,
      taxes: taxes.toFixed(2),
      fees: fees.toFixed(2),
      total: total.toFixed(2),
      currency,
      ...additionalFees
    }
  }

  /**
   * Validate quotation request
   */
  protected validateQuotationRequest(request: UnifiedQuotationRequest): void {
    if (!request.origin?.address) {
      throw new Error('Origin address is required')
    }

    if (!request.destinations?.length) {
      throw new Error('At least one destination is required')
    }

    if (!request.shipment) {
      throw new Error('Shipment information is required')
    }

    // Validate coordinates if provided
    if (request.origin.coordinates) {
      this.validateCoordinates(request.origin.coordinates)
    }

    request.destinations.forEach((dest, index) => {
      if (!dest.address) {
        throw new Error(`Destination ${index + 1} address is required`)
      }
      if (dest.coordinates) {
        this.validateCoordinates(dest.coordinates)
      }
    })
  }

  /**
   * Validate coordinates format
   */
  protected validateCoordinates(coordinates: { lat: string; lng: string }): void {
    const lat = parseFloat(coordinates.lat)
    const lng = parseFloat(coordinates.lng)

    if (isNaN(lat) || lat < -90 || lat > 90) {
      throw new Error('Invalid latitude value')
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      throw new Error('Invalid longitude value')
    }
  }

  /**
   * Validate order request
   */
  protected validateOrderRequest(request: UnifiedOrderRequest): void {
    if (!request.quotationId) {
      throw new Error('Quotation ID is required')
    }

    if (!request.sender?.name || !request.sender?.phone) {
      throw new Error('Sender name and phone are required')
    }

    if (!request.recipients?.length) {
      throw new Error('At least one recipient is required')
    }

    request.recipients.forEach((recipient, index) => {
      if (!recipient.name || !recipient.phone) {
        throw new Error(`Recipient ${index + 1} name and phone are required`)
      }
    })
  }

  /**
   * Handle provider API errors
   */
  protected handleApiError(error: any, operation: string): never {
    const message = error?.message || error?.toString() || 'Unknown error'
    const providerError = new Error(`${this.name} ${operation} failed: ${message}`)
    
    // Add provider-specific error context
    if (error?.status) {
      (providerError as any).status = error.status
    }
    
    if (error?.code) {
      (providerError as any).code = error.code
    }

    throw providerError
  }

  /**
   * Log provider operations for debugging
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logData = {
      provider: this.providerId,
      timestamp: new Date().toISOString(),
      message,
      data
    }

    console[level](`[${this.name}]`, logData)
  }
}

/**
 * Utility functions for provider implementations
 */
export class ProviderUtils {
  /**
   * Convert distance between different units
   */
  static convertDistance(value: string, fromUnit: string, toUnit: string): string {
    const meters = this.toMeters(parseFloat(value), fromUnit)
    return this.fromMeters(meters, toUnit).toString()
  }

  private static toMeters(value: number, unit: string): number {
    switch (unit.toLowerCase()) {
      case 'm':
      case 'meter':
      case 'meters':
        return value
      case 'km':
      case 'kilometer':
      case 'kilometers':
        return value * 1000
      case 'mi':
      case 'mile':
      case 'miles':
        return value * 1609.34
      case 'ft':
      case 'feet':
        return value * 0.3048
      default:
        return value
    }
  }

  private static fromMeters(meters: number, toUnit: string): number {
    switch (toUnit.toLowerCase()) {
      case 'm':
      case 'meter':
      case 'meters':
        return meters
      case 'km':
      case 'kilometer':
      case 'kilometers':
        return meters / 1000
      case 'mi':
      case 'mile':
      case 'miles':
        return meters / 1609.34
      case 'ft':
      case 'feet':
        return meters / 0.3048
      default:
        return meters
    }
  }

  /**
   * Format phone number to international format
   */
  static formatPhoneNumber(phone: string, countryCode?: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '')
    
    // If already starts with +, return as is
    if (phone.startsWith('+')) {
      return phone
    }

    // Add country code if provided and not already present
    if (countryCode && !digits.startsWith(countryCode.replace('+', ''))) {
      return `+${countryCode.replace('+', '')}${digits}`
    }

    return `+${digits}`
  }

  /**
   * Calculate estimated delivery time based on distance and service type
   */
  static calculateEstimatedDelivery(
    distanceKm: number, 
    serviceType: ShippingProviderType
  ): string {
    let hoursToAdd = 24 // Default 24 hours

    switch (serviceType) {
      case ShippingProviderType.SAME_DAY:
        hoursToAdd = Math.max(2, distanceKm * 0.1) // Minimum 2 hours, +0.1h per km
        break
      case ShippingProviderType.EXPRESS:
        hoursToAdd = Math.max(4, distanceKm * 0.15) // Minimum 4 hours, +0.15h per km
        break
      case ShippingProviderType.STANDARD:
        hoursToAdd = Math.max(24, distanceKm * 0.5) // Minimum 24 hours, +0.5h per km
        break
      case ShippingProviderType.INTERNATIONAL:
        hoursToAdd = Math.max(72, distanceKm * 1) // Minimum 72 hours, +1h per km
        break
    }

    const deliveryTime = new Date()
    deliveryTime.setHours(deliveryTime.getHours() + hoursToAdd)
    
    return deliveryTime.toISOString()
  }
}

