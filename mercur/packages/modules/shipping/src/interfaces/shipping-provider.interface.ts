/**
 * Unified shipping provider interface for multi-vendor shipping system
 * Supports various shipping providers like Lalamove, DHL, FedEx, etc.
 */

export interface ShippingProviderConfig {
  providerId: string
  name: string
  type: ShippingProviderType
  enabled: boolean
  priority: number
  configuration: Record<string, any>
  supportedMarkets: string[]
  supportedServiceTypes: string[]
  webhookUrl?: string
}

export enum ShippingProviderType {
  SAME_DAY = 'same_day',
  EXPRESS = 'express',
  STANDARD = 'standard',
  INTERNATIONAL = 'international',
  CUSTOM = 'custom'
}

export enum UnifiedOrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ASSIGNING_DRIVER = 'ASSIGNING_DRIVER',
  DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
  EXPIRED = 'EXPIRED'
}

export interface UnifiedLocation {
  coordinates?: {
    lat: string
    lng: string
  }
  address: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  contactName?: string
  contactPhone?: string
  instructions?: string
}

export interface UnifiedShipment {
  weight?: string
  dimensions?: {
    length?: string
    width?: string
    height?: string
    unit?: string
  }
  value?: string
  currency?: string
  description?: string
  quantity?: number
  categories?: string[]
  specialInstructions?: string[]
}

export interface UnifiedQuotationRequest {
  origin: UnifiedLocation
  destinations: UnifiedLocation[]
  shipment: UnifiedShipment
  serviceType?: string
  specialRequests?: string[]
  scheduledPickup?: string
  metadata?: Record<string, any>
  market?: string
  language?: string
}

export interface UnifiedQuotationResponse {
  quotationId: string
  providerId: string
  providerQuotationId?: string
  serviceType: string
  specialRequests: string[]
  priceBreakdown: {
    base: string
    taxes: string
    fees: string
    total: string
    currency: string
    [key: string]: string
  }
  estimatedDelivery?: string
  validUntil: string
  distance?: {
    value: string
    unit: string
  }
  metadata?: Record<string, any>
}

export interface UnifiedOrderRequest {
  quotationId: string
  sender: {
    name: string
    phone: string
    email?: string
  }
  recipients: Array<{
    name: string
    phone: string
    email?: string
    instructions?: string
  }>
  specialRequests?: string[]
  proofOfDelivery?: boolean
  insurance?: {
    enabled: boolean
    value?: string
    currency?: string
  }
  metadata?: Record<string, any>
}

export interface UnifiedOrderResponse {
  orderId: string
  providerId: string
  providerOrderId: string
  quotationId: string
  status: UnifiedOrderStatus
  trackingNumber?: string
  trackingUrl?: string
  shareLink?: string
  priceBreakdown: {
    base: string
    taxes: string
    fees: string
    total: string
    currency: string
    [key: string]: string
  }
  estimatedDelivery?: string
  driverInfo?: {
    id?: string
    name?: string
    phone?: string
    vehicle?: string
    coordinates?: {
      lat: string
      lng: string
      updatedAt: string
    }
  }
  proofOfDelivery?: {
    status: 'PENDING' | 'COMPLETED' | 'FAILED'
    images?: string[]
    signature?: string
    deliveredAt?: string
    notes?: string
  }
  metadata?: Record<string, any>
}

export interface TrackingUpdate {
  orderId: string
  providerId: string
  status: UnifiedOrderStatus
  message: string
  timestamp: string
  location?: {
    address?: string
    coordinates?: {
      lat: string
      lng: string
    }
  }
  driverInfo?: {
    id?: string
    name?: string
    phone?: string
    coordinates?: {
      lat: string
      lng: string
    }
  }
  metadata?: Record<string, any>
}

export interface WebhookPayload {
  type: string
  orderId: string
  providerId: string
  data: Record<string, any>
  timestamp: string
  signature?: string
}

/**
 * Abstract interface that all shipping providers must implement
 */
export interface IShippingProvider {
  /**
   * Provider identification
   */
  readonly providerId: string
  readonly name: string
  readonly type: ShippingProviderType

  /**
   * Initialize the provider with configuration
   */
  initialize(config: ShippingProviderConfig): Promise<void>

  /**
   * Check if provider is available for given market/service
   */
  isAvailable(market: string, serviceType?: string): Promise<boolean>

  /**
   * Get available service types for a market
   */
  getServiceTypes(market: string): Promise<string[]>

  /**
   * Get quotation for shipping request
   */
  getQuotation(request: UnifiedQuotationRequest): Promise<UnifiedQuotationResponse>

  /**
   * Place shipping order
   */
  placeOrder(request: UnifiedOrderRequest): Promise<UnifiedOrderResponse>

  /**
   * Get order status and details
   */
  getOrder(orderId: string): Promise<UnifiedOrderResponse>

  /**
   * Track order with real-time updates
   */
  trackOrder(orderId: string): Promise<TrackingUpdate[]>

  /**
   * Cancel order if possible
   */
  cancelOrder(orderId: string, reason?: string): Promise<void>

  /**
   * Update order if supported
   */
  updateOrder?(orderId: string, updates: Partial<UnifiedOrderRequest>): Promise<UnifiedOrderResponse>

  /**
   * Add priority fee or tip
   */
  addPriorityFee?(orderId: string, amount: string): Promise<UnifiedOrderResponse>

  /**
   * Get driver details if available
   */
  getDriverDetails?(orderId: string): Promise<any>

  /**
   * Setup webhook for order updates
   */
  setupWebhook?(url: string): Promise<void>

  /**
   * Process webhook payload
   */
  processWebhook?(payload: WebhookPayload): Promise<TrackingUpdate[]>

  /**
   * Calculate estimated delivery time
   */
  getEstimatedDelivery?(origin: UnifiedLocation, destination: UnifiedLocation, serviceType: string): Promise<string>

  /**
   * Get provider-specific capabilities
   */
  getCapabilities(): {
    supportsRealTimeTracking: boolean
    supportsProofOfDelivery: boolean
    supportsScheduledPickup: boolean
    supportsMultipleDestinations: boolean
    supportsInsurance: boolean
    supportsPriorityFee: boolean
    supportsOrderModification: boolean
    supportsDriverChange: boolean
    maxDestinations: number
    supportedMarkets: string[]
  }
}

/**
 * Provider selection criteria for choosing the best provider
 */
export interface ProviderSelectionCriteria {
  market: string
  serviceType?: string
  priority?: 'cost' | 'speed' | 'reliability'
  maxCost?: string
  requiresRealTimeTracking?: boolean
  requiresProofOfDelivery?: boolean
  excludeProviders?: string[]
  preferredProviders?: string[]
}

/**
 * Provider comparison result for selection
 */
export interface ProviderComparison {
  providerId: string
  quotation: UnifiedQuotationResponse
  score: number
  reasoning: string[]
  available: boolean
}

