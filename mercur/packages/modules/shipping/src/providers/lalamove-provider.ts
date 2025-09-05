import crypto from 'crypto'
import { BaseShippingProvider } from './base-provider'
import {
  ShippingProviderType,
  UnifiedQuotationRequest,
  UnifiedQuotationResponse,
  UnifiedOrderRequest,
  UnifiedOrderResponse,
  TrackingUpdate,
  UnifiedOrderStatus,
  WebhookPayload,
  UnifiedLocation
} from '../interfaces/shipping-provider.interface'

/**
 * Lalamove shipping provider implementation
 * Integrates with Lalamove API v3 for same-day delivery services
 */
export class LalamoveProvider extends BaseShippingProvider {
  private apiKey!: string
  private apiSecret!: string
  private market!: string
  private environment!: 'sandbox' | 'production'
  private baseUrl!: string

  constructor() {
    super('lalamove', 'Lalamove', ShippingProviderType.SAME_DAY)
  }

  protected async validateConfiguration(): Promise<void> {
    const config = this.config.configuration

    if (!config.apiKey || !config.apiSecret) {
      throw new Error('Lalamove API key and secret are required')
    }

    if (!config.market) {
      throw new Error('Lalamove market is required')
    }

    this.apiKey = config.apiKey
    this.apiSecret = config.apiSecret
    this.market = config.market
    this.environment = config.environment || 'sandbox'
    this.baseUrl = this.environment === 'sandbox'
      ? 'https://rest.sandbox.lalamove.com/v3'
      : 'https://rest.lalamove.com/v3'

    // Test API connection
    try {
      await this.getCities()
      this.log('info', 'Lalamove provider initialized successfully')
    } catch (error) {
      throw new Error(`Failed to connect to Lalamove API: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  protected async checkProviderAvailability(market: string, serviceType?: string): Promise<boolean> {
    try {
      const cities = await this.getCities()
      return cities.some(city => city.locode?.includes(market))
    } catch (error) {
      this.log('warn', 'Failed to check Lalamove availability', { market, error: error instanceof Error ? error.message : String(error) })
      return false
    }
  }

  async getServiceTypes(market: string): Promise<string[]> {
    try {
      const cities = await this.getCities()
      const cityData = cities.find(city => city.locode?.includes(market))
      
      if (!cityData?.services) {
        return []
      }

      return cityData.services.map((service: any) => service.key)
    } catch (error) {
      this.log('error', 'Failed to get Lalamove service types', { market, error: error instanceof Error ? error.message : String(error) })
      return []
    }
  }

  async getQuotation(request: UnifiedQuotationRequest): Promise<UnifiedQuotationResponse> {
    this.ensureInitialized()
    this.validateQuotationRequest(request)

    try {
      const lalamoveRequest = this.convertToLalamoveQuotationRequest(request)
      const response = await this.makeRequest<{ data: any }>('POST', '/quotations', { data: lalamoveRequest })
      
      return this.convertFromLalamoveQuotationResponse(response.data, request)
    } catch (error) {
      this.handleApiError(error, 'quotation')
    }
  }

  async placeOrder(request: UnifiedOrderRequest): Promise<UnifiedOrderResponse> {
    this.ensureInitialized()
    this.validateOrderRequest(request)

    try {
      const lalamoveRequest = this.convertToLalamoveOrderRequest(request)
      const response = await this.makeRequest<{ data: any }>('POST', '/orders', { data: lalamoveRequest })
      
      return this.convertFromLalamoveOrderResponse(response.data)
    } catch (error) {
      this.handleApiError(error, 'place order')
    }
  }

  async getOrder(orderId: string): Promise<UnifiedOrderResponse> {
    this.ensureInitialized()

    try {
      const response = await this.makeRequest<{ data: any }>('GET', `/orders/${orderId}`)
      return this.convertFromLalamoveOrderResponse(response.data)
    } catch (error) {
      this.handleApiError(error, 'get order')
    }
  }

  async trackOrder(orderId: string): Promise<TrackingUpdate[]> {
    this.ensureInitialized()

    try {
      const order = await this.getOrder(orderId)
      
      return [{
        orderId: order.orderId,
        providerId: this.providerId,
        status: order.status,
        message: `Order status: ${order.status}`,
        timestamp: new Date().toISOString(),
        driverInfo: order.driverInfo,
        metadata: order.metadata
      }]
    } catch (error) {
      this.handleApiError(error, 'track order')
    }
  }

  async cancelOrder(orderId: string, reason?: string): Promise<void> {
    this.ensureInitialized()

    try {
      await this.makeRequest('DELETE', `/orders/${orderId}`)
      this.log('info', 'Order cancelled successfully', { orderId, reason })
    } catch (error) {
      this.handleApiError(error, 'cancel order')
    }
  }

  async addPriorityFee(orderId: string, amount: string): Promise<UnifiedOrderResponse> {
    this.ensureInitialized()

    try {
      const response = await this.makeRequest<{ data: any }>(
        'POST',
        `/orders/${orderId}/priority-fee`,
        { data: { priorityFee: amount } }
      )
      
      return this.convertFromLalamoveOrderResponse(response.data)
    } catch (error) {
      this.handleApiError(error, 'add priority fee')
    }
  }

  async getDriverDetails(orderId: string): Promise<any> {
    this.ensureInitialized()

    try {
      // First get order to get driver ID
      const order = await this.getOrder(orderId)
      
      if (!order.driverInfo?.id) {
        throw new Error('No driver assigned to this order')
      }

      const response = await this.makeRequest<{ data: any }>(
        'GET',
        `/orders/${orderId}/drivers/${order.driverInfo.id}`
      )
      
      return response.data
    } catch (error) {
      this.handleApiError(error, 'get driver details')
    }
  }

  async setupWebhook(url: string): Promise<void> {
    this.ensureInitialized()

    try {
      await this.makeRequest('PATCH', '/webhook', { data: { url } })
      this.log('info', 'Webhook setup successfully', { url })
    } catch (error) {
      this.handleApiError(error, 'setup webhook')
    }
  }

  async processWebhook(payload: WebhookPayload): Promise<TrackingUpdate[]> {
    try {
      const updates: TrackingUpdate[] = []

      switch (payload.type) {
        case 'ORDER_STATUS_CHANGED':
          updates.push({
            orderId: payload.data.orderId,
            providerId: this.providerId,
            status: this.mapProviderStatus(payload.data.status),
            message: `Order status changed to ${payload.data.status}`,
            timestamp: payload.timestamp,
            metadata: payload.data
          })
          break

        case 'DRIVER_ASSIGNED':
          updates.push({
            orderId: payload.data.orderId,
            providerId: this.providerId,
            status: UnifiedOrderStatus.DRIVER_ASSIGNED,
            message: `Driver ${payload.data.driverName} assigned`,
            timestamp: payload.timestamp,
            driverInfo: {
              id: payload.data.driverId,
              name: payload.data.driverName,
              phone: payload.data.driverPhone
            },
            metadata: payload.data
          })
          break

        case 'ORDER_AMOUNT_CHANGED':
          updates.push({
            orderId: payload.data.orderId,
            providerId: this.providerId,
            status: UnifiedOrderStatus.CONFIRMED,
            message: `Order amount updated to ${payload.data.priceBreakdown.total} ${payload.data.priceBreakdown.currency}`,
            timestamp: payload.timestamp,
            metadata: payload.data
          })
          break

        default:
          this.log('warn', 'Unknown webhook type received', { type: payload.type, data: payload.data })
      }

      return updates
    } catch (error) {
      this.log('error', 'Failed to process webhook', { error: error instanceof Error ? error.message : String(error), payload })
      return []
    }
  }

  getCapabilities() {
    return {
      supportsRealTimeTracking: true,
      supportsProofOfDelivery: true,
      supportsScheduledPickup: true,
      supportsMultipleDestinations: true,
      supportsInsurance: false,
      supportsPriorityFee: true,
      supportsOrderModification: true,
      supportsDriverChange: true,
      maxDestinations: 16,
      supportedMarkets: this.config.supportedMarkets || ['HK', 'SG', 'MY', 'TH', 'PH', 'VN', 'TW', 'ID', 'BR', 'MX']
    }
  }

  protected mapProviderStatus(providerStatus: string): UnifiedOrderStatus {
    switch (providerStatus) {
      case 'ASSIGNING_DRIVER':
        return UnifiedOrderStatus.ASSIGNING_DRIVER
      case 'ON_GOING':
        return UnifiedOrderStatus.DRIVER_ASSIGNED
      case 'PICKED_UP':
        return UnifiedOrderStatus.PICKED_UP
      case 'COMPLETED':
        return UnifiedOrderStatus.DELIVERED
      case 'CANCELED':
        return UnifiedOrderStatus.CANCELLED
      case 'REJECTED':
        return UnifiedOrderStatus.FAILED
      case 'EXPIRED':
        return UnifiedOrderStatus.EXPIRED
      default:
        return UnifiedOrderStatus.PENDING
    }
  }

  private convertToLalamoveQuotationRequest(request: UnifiedQuotationRequest): any {
    const stops = [
      {
        coordinates: request.origin.coordinates,
        address: this.normalizeAddress(request.origin)
      },
      ...request.destinations.map(dest => ({
        coordinates: dest.coordinates,
        address: this.normalizeAddress(dest)
      }))
    ]

    return {
      serviceType: request.serviceType || 'MOTORCYCLE',
      specialRequests: request.specialRequests || [],
      language: request.language || 'en_HK',
      stops,
      scheduleAt: request.scheduledPickup,
      isRouteOptimized: request.destinations.length > 1,
      item: request.shipment ? {
        quantity: request.shipment.quantity?.toString(),
        weight: request.shipment.weight,
        categories: request.shipment.categories,
        handlingInstructions: request.shipment.specialInstructions
      } : undefined
    }
  }

  private convertFromLalamoveQuotationResponse(response: any, originalRequest: UnifiedQuotationRequest): UnifiedQuotationResponse {
    return {
      quotationId: response.quotationId,
      providerId: this.providerId,
      providerQuotationId: response.quotationId,
      serviceType: response.serviceType,
      specialRequests: response.specialRequests || [],
      priceBreakdown: this.calculatePriceBreakdown(
        response.priceBreakdown.total,
        response.priceBreakdown.currency,
        {
          base: response.priceBreakdown.base,
          specialRequests: response.priceBreakdown.specialRequests,
          vat: response.priceBreakdown.vat
        }
      ),
      estimatedDelivery: response.scheduleAt,
      validUntil: response.expiresAt,
      distance: response.distance,
      metadata: {
        lalamoveData: response,
        originalRequest
      }
    }
  }

  private convertToLalamoveOrderRequest(request: UnifiedOrderRequest): any {
    // Extract quotation metadata to get original stops
    const quotationData = request.metadata?.lalamoveData || {}
    
    return {
      quotationId: request.quotationId,
      sender: {
        stopId: quotationData.stops?.[0]?.stopId || '1',
        name: request.sender.name,
        phone: request.sender.phone
      },
      recipients: request.recipients.map((recipient, index) => ({
        stopId: quotationData.stops?.[index + 1]?.stopId || (index + 2).toString(),
        name: recipient.name,
        phone: recipient.phone,
        remarks: recipient.instructions
      })),
      isPODEnabled: request.proofOfDelivery || false,
      partner: 'Maretinda Marketplace',
      metadata: request.metadata
    }
  }

  private convertFromLalamoveOrderResponse(response: any): UnifiedOrderResponse {
    return {
      orderId: response.orderId,
      providerId: this.providerId,
      providerOrderId: response.orderId,
      quotationId: response.quotationId,
      status: this.mapProviderStatus(response.status),
      trackingNumber: response.orderId,
      trackingUrl: response.shareLink,
      shareLink: response.shareLink,
      priceBreakdown: this.calculatePriceBreakdown(
        response.priceBreakdown.total,
        response.priceBreakdown.currency,
        {
          base: response.priceBreakdown.base,
          priorityFee: response.priceBreakdown.priorityFee,
          specialRequests: response.priceBreakdown.specialRequests
        }
      ),
      driverInfo: response.driverId ? {
        id: response.driverId,
        name: response.driverName,
        phone: response.driverPhone,
        vehicle: response.plateNumber
      } : undefined,
      proofOfDelivery: response.stops?.[1]?.POD ? {
        status: response.stops[1].POD.status === 'DELIVERED' ? 'COMPLETED' : 'PENDING',
        images: response.stops[1].POD.image ? [response.stops[1].POD.image] : undefined,
        deliveredAt: response.stops[1].POD.deliveredAt,
        notes: response.stops[1].POD.notes
      } : undefined,
      metadata: {
        lalamoveData: response,
        distance: response.distance
      }
    }
  }

  private async getCities(): Promise<any[]> {
    const response = await this.makeRequest<{ data: any[] }>('GET', '/cities')
    return response.data
  }

  private generateSignature(method: string, path: string, body: string = ''): {
    timestamp: string
    signature: string
    token: string
  } {
    const timestamp = Date.now().toString()
    const rawSignature = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${body}`
    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(rawSignature)
      .digest('hex')
    
    const token = `${this.apiKey}:${timestamp}:${signature}`
    
    return { timestamp, signature, token }
  }

  private async makeRequest<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<T> {
    const { token } = this.generateSignature(
      method,
      path,
      body ? JSON.stringify(body) : ''
    )

    const headers = {
      'Authorization': `hmac ${token}`,
      'Market': this.market,
      'Request-ID': crypto.randomUUID(),
      'Content-Type': 'application/json'
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(`Lalamove API error: ${response.status} - ${JSON.stringify(errorData)}`)
    }

    return response.json() as T
  }
}

