import {
  IShippingProvider,
  ShippingProviderConfig,
  UnifiedQuotationRequest,
  UnifiedQuotationResponse,
  UnifiedOrderRequest,
  UnifiedOrderResponse,
  TrackingUpdate,
  UnifiedOrderStatus,
  ShippingProviderType
} from '../interfaces/shipping-provider.interface'

/**
 * Ninja Van provider implementation
 * Supports last-mile delivery across Southeast Asia
 */
export class NinjaVanProvider implements IShippingProvider {
  public readonly providerId = 'ninjavan'
  public readonly name = 'Ninja Van'
  public readonly type = ShippingProviderType.SAME_DAY
  private config?: ShippingProviderConfig
  private apiBaseUrl: string = ''
  private apiKey: string = ''
  private clientId: string = ''
  private clientSecret: string = ''

  async initialize(config: ShippingProviderConfig): Promise<void> {
    this.config = config
    
    const environment = config.configuration.environment || 'sandbox'
    this.apiBaseUrl = environment === 'production' 
      ? 'https://api.ninjavan.co'
      : 'https://api-sandbox.ninjavan.co'
    
    this.apiKey = config.configuration.apiKey
    this.clientId = config.configuration.clientId
    this.clientSecret = config.configuration.clientSecret
    
    if (!this.apiKey || !this.clientId || !this.clientSecret) {
      throw new Error('Ninja Van API key, client ID, and client secret are required')
    }
  }

  async getQuotation(request: UnifiedQuotationRequest): Promise<UnifiedQuotationResponse> {
    try {
      const destination = request.destinations[0] // For single destination
      const quotationData = {
        service_type: request.serviceType || 'Parcel',
        service_level: 'Standard',
        from: {
          name: request.origin.contactName || 'Sender',
          phone_number: request.origin.contactPhone || '0123456789',
          address1: request.origin.address,
          postcode: request.origin.postalCode || '',
          city: request.origin.city || '',
          state: request.origin.state || '',
          country: 'MY'
        },
        to: {
          name: destination.contactName || 'Receiver',
          phone_number: destination.contactPhone || '0123456789',
          address1: destination.address,
          postcode: destination.postalCode || '',
          city: destination.city || '',
          state: destination.state || '',
          country: 'MY'
        },
        parcel_job: {
          dimensions: {
            weight: parseFloat(request.shipment.weight || '1')
          },
          cash_on_delivery: 0,
          insured_value: parseFloat(request.shipment.value || '0')
        }
      }

      const response = await this.makeRequest('/2.0/pricing', quotationData, 'POST')
      
      const cost = response.total_fees || this.calculateEstimatedCost(quotationData.parcel_job.dimensions.weight)
      
      return {
        quotationId: `nv_${Date.now()}`,
        providerId: this.providerId,
        providerQuotationId: `nv_${Date.now()}`,
        serviceType: quotationData.service_type,
        specialRequests: request.specialRequests || [],
        priceBreakdown: {
          base: cost.toString(),
          taxes: '0',
          fees: '0',
          total: cost.toString(),
          currency: 'MYR'
        },
        estimatedDelivery: this.getEstimatedDeliveryTime(quotationData.service_level),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          serviceType: quotationData.service_type,
          serviceLevel: quotationData.service_level,
          weight: quotationData.parcel_job.dimensions.weight,
          provider: 'Ninja Van'
        }
      }
    } catch (error) {
      console.error('Ninja Van quotation error:', error)
      throw new Error(`Failed to get Ninja Van quotation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async placeOrder(request: UnifiedOrderRequest): Promise<UnifiedOrderResponse> {
    try {
      const recipient = request.recipients[0] // For single recipient
      const orderData = {
        service_type: 'Parcel',
        service_level: 'Standard',
        reference: `NV${Date.now()}`,
        from: {
          name: request.sender.name,
          phone_number: request.sender.phone,
          email: request.sender.email || '',
          address1: 'Pickup Address', // Will be set from quotation context
          postcode: '50000',
          city: 'Kuala Lumpur',
          state: 'Selangor',
          country: 'MY'
        },
        to: {
          name: recipient.name,
          phone_number: recipient.phone,
          email: recipient.email || '',
          address1: 'Delivery Address', // Will be set from quotation context
          postcode: '50000',
          city: 'Kuala Lumpur',
          state: 'Selangor',
          country: 'MY'
        },
                parcel_job: {
          pickup_date: new Date().toISOString().split('T')[0],
          pickup_timeslot: {
            start_time: '09:00',
            end_time: '18:00',
            timezone: 'Asia/Kuala_Lumpur'
          },
          delivery_start_date: new Date().toISOString().split('T')[0],
          delivery_timeslot: {
            start_time: '09:00',
            end_time: '21:00',
            timezone: 'Asia/Kuala_Lumpur'
          },
          dimensions: {
            weight: 1
          },
          cash_on_delivery: 0,
          insured_value: 0,
          items: [{
            item_description: 'Package',
            quantity: 1,
            price_nett: 0
          }],
          special_instructions: recipient.instructions || ''
        }
      }

      const response = await this.makeRequest('/2.0/orders', orderData, 'POST')

      const cost = response.total_fees || 8.00
      
      return {
        orderId: response.tracking_id || `nv_${Date.now()}`,
        providerId: this.providerId,
        providerOrderId: response.tracking_id || `NV${Date.now()}`,
        quotationId: request.quotationId,
        status: this.mapOrderStatus(response.status || 'pending'),
        trackingNumber: response.tracking_id,
        trackingUrl: `https://www.ninjavan.co/en-my/tracking?id=${response.tracking_id}`,
        shareLink: `https://www.ninjavan.co/en-my/tracking?id=${response.tracking_id}`,
        priceBreakdown: {
          base: cost.toString(),
          taxes: '0',
          fees: '0',
          total: cost.toString(),
          currency: 'MYR'
        },
        estimatedDelivery: response.delivery_date || this.calculateEstimatedDelivery(),
        metadata: {
          trackingId: response.tracking_id,
          serviceType: orderData.service_type,
          serviceLevel: orderData.service_level,
          provider: 'Ninja Van'
        }
      }
    } catch (error) {
      console.error('Ninja Van order creation error:', error)
      throw new Error(`Failed to create Ninja Van order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async trackOrder(orderId: string): Promise<TrackingUpdate[]> {
    try {
      const response = await this.makeRequest(`/2.0/orders/${orderId}`, {}, 'GET')

      const trackingEvents = response.tracking_events || []
      
      return trackingEvents.map((event: any) => ({
        timestamp: new Date(event.created_at),
        status: this.mapOrderStatus(event.status),
        description: event.description || event.message,
        location: event.location || '',
        metadata: {
          eventType: event.event_type,
          eventCode: event.event_code,
          provider: 'Ninja Van'
        }
      }))
    } catch (error) {
      console.error('Ninja Van tracking error:', error)
      throw new Error(`Failed to track Ninja Van order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async cancelOrder(orderId: string, reason?: string): Promise<void> {
    try {
      const response = await this.makeRequest(`/2.0/orders/${orderId}/cancel`, {
        reason: reason || 'Cancelled by vendor'
      }, 'POST')

      if (!(response.success === true || response.status === 'cancelled')) {
        throw new Error('Failed to cancel order')
      }
    } catch (error) {
      console.error('Ninja Van cancellation error:', error)
      throw new Error(`Failed to cancel Ninja Van order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async makeRequest(endpoint: string, data: any, method: 'GET' | 'POST' = 'POST'): Promise<any> {
    const url = `${this.apiBaseUrl}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Client-ID': this.clientId
    }

    const config: RequestInit = {
      method,
      headers
    }

    if (method === 'POST' && Object.keys(data).length > 0) {
      config.body = JSON.stringify(data)
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      throw new Error(`Ninja Van API error: ${response.status} ${response.statusText}`)
    }

    const result: any = await response.json()
    
    if (result.error) {
      throw new Error(result.error.message || 'Ninja Van API request failed')
    }

    return result
  }

  private calculateEstimatedCost(weight: number): number {
    // Basic cost calculation for Ninja Van
    const baseRate = 6.00 // RM 6.00 base rate
    const perKgRate = 2.00 // RM 2.00 per kg
    return baseRate + (Math.max(1, Math.ceil(weight)) * perKgRate)
  }

  private getEstimatedDeliveryTime(serviceLevel: string): string {
    switch (serviceLevel.toLowerCase()) {
      case 'express':
      case 'same_day':
        return 'Same day'
      case 'next_day':
        return 'Next day'
      default:
        return '1-3 business days'
    }
  }

  private calculateEstimatedDelivery(): string {
    const deliveryDate = new Date()
    deliveryDate.setDate(deliveryDate.getDate() + 2)
    return deliveryDate.toISOString()
  }

  private mapOrderStatus(ninjaVanStatus: string): UnifiedOrderStatus {
    const statusMap: Record<string, UnifiedOrderStatus> = {
      'pending': UnifiedOrderStatus.PENDING,
      'pickup_pending': UnifiedOrderStatus.PENDING,
      'en_route_to_sorting_facility': UnifiedOrderStatus.PICKED_UP,
      'arrived_at_sorting_facility': UnifiedOrderStatus.IN_TRANSIT,
      'en_route_to_delivery': UnifiedOrderStatus.OUT_FOR_DELIVERY,
      'delivered': UnifiedOrderStatus.DELIVERED,
      'delivery_failed': UnifiedOrderStatus.FAILED,
      'cancelled': UnifiedOrderStatus.CANCELLED,
      'returned_to_sender': UnifiedOrderStatus.RETURNED
    }

    return statusMap[ninjaVanStatus.toLowerCase()] || UnifiedOrderStatus.PENDING
  }

  async isAvailable(market: string, serviceType?: string): Promise<boolean> {
    const supportedMarkets = ['MY', 'SG', 'TH', 'VN', 'PH', 'ID']
    return supportedMarkets.includes(market.toUpperCase())
  }

  async getServiceTypes(market: string): Promise<string[]> {
    return ['Parcel', 'Same Day', 'Next Day']
  }

  async getOrder(orderId: string): Promise<UnifiedOrderResponse> {
    try {
      const response = await this.makeRequest(`/2.0/orders/${orderId}`, {}, 'GET')

      const cost = response.total_fees || 8.00
      
      return {
        orderId: response.tracking_id || orderId,
        providerId: this.providerId,
        providerOrderId: response.tracking_id || orderId,
        quotationId: 'unknown',
        status: this.mapOrderStatus(response.status || 'pending'),
        trackingNumber: response.tracking_id,
        trackingUrl: `https://www.ninjavan.co/en-my/tracking?id=${response.tracking_id}`,
        shareLink: `https://www.ninjavan.co/en-my/tracking?id=${response.tracking_id}`,
        priceBreakdown: {
          base: cost.toString(),
          taxes: '0',
          fees: '0',
          total: cost.toString(),
          currency: 'MYR'
        },
        estimatedDelivery: response.delivery_date || this.calculateEstimatedDelivery(),
        metadata: {
          trackingId: response.tracking_id,
          provider: 'Ninja Van'
        }
      }
    } catch (error) {
      console.error('Ninja Van get order error:', error)
      throw new Error(`Failed to get Ninja Van order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  getCapabilities() {
    return {
      supportsRealTimeTracking: true,
      supportsProofOfDelivery: true,
      supportsScheduledPickup: true,
      supportsMultipleDestinations: false,
      supportsInsurance: false,
      supportsPriorityFee: false,
      supportsOrderModification: false,
      supportsDriverChange: false,
      maxDestinations: 1,
      supportedMarkets: ['MY', 'SG', 'TH', 'VN', 'PH', 'ID']
    }
  }
}
