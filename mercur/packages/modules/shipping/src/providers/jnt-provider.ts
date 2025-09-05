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
 * J&T Express provider implementation
 * Supports domestic and international shipping across Southeast Asia
 */
export class JNTProvider implements IShippingProvider {
  public readonly providerId = 'jnt'
  public readonly name = 'J&T Express'
  public readonly type = ShippingProviderType.EXPRESS
  private config?: ShippingProviderConfig
  private apiBaseUrl: string = ''
  private apiKey: string = ''
  private customerCode: string = ''

  async initialize(config: ShippingProviderConfig): Promise<void> {
    this.config = config
    
    const environment = config.configuration.environment || 'sandbox'
    this.apiBaseUrl = environment === 'production' 
      ? 'https://openapi.jtexpress.com.my'
      : 'https://openapi-uat.jtexpress.com.my'
    
    this.apiKey = config.configuration.apiKey
    this.customerCode = config.configuration.customerCode
    
    if (!this.apiKey || !this.customerCode) {
      throw new Error('J&T Express API key and customer code are required')
    }
  }

  async getQuotation(request: UnifiedQuotationRequest): Promise<UnifiedQuotationResponse> {
    try {
      const destination = request.destinations[0] // For single destination
      const quotationData = {
        customerCode: this.customerCode,
        serviceType: request.serviceType || 'standard',
        sender: {
          name: request.origin.contactName || 'Sender',
          phone: request.origin.contactPhone || '0123456789',
          address: request.origin.address,
          city: request.origin.city || '',
          state: request.origin.state || '',
          postcode: request.origin.postalCode || ''
        },
        receiver: {
          name: destination.contactName || 'Receiver',
          phone: destination.contactPhone || '0123456789',
          address: destination.address,
          city: destination.city || '',
          state: destination.state || '',
          postcode: destination.postalCode || ''
        },
        itemDetails: [{
          itemName: request.shipment.description || 'Package',
          quantity: request.shipment.quantity || 1,
          weight: parseFloat(request.shipment.weight || '1'),
          value: parseFloat(request.shipment.value || '0')
        }],
        totalWeight: parseFloat(request.shipment.weight || '1')
      }

      const response = await this.makeRequest('/api/logistics/getQuotation', quotationData)
      
      const cost = response.totalAmount || this.calculateEstimatedCost(quotationData.totalWeight)
      
      return {
        quotationId: response.quotationId || `jnt_${Date.now()}`,
        providerId: this.providerId,
        providerQuotationId: response.quotationId,
        serviceType: quotationData.serviceType,
        specialRequests: request.specialRequests || [],
        priceBreakdown: {
          base: cost.toString(),
          taxes: '0',
          fees: '0',
          total: cost.toString(),
          currency: 'MYR'
        },
        estimatedDelivery: response.estimatedDeliveryTime || this.getEstimatedDeliveryTime(quotationData.serviceType),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        metadata: {
          quotationId: response.quotationId,
          serviceType: quotationData.serviceType,
          weight: quotationData.totalWeight,
          provider: 'J&T Express'
        }
      }
    } catch (error) {
      console.error('J&T Express quotation error:', error)
      throw new Error(`Failed to get J&T Express quotation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async placeOrder(request: UnifiedOrderRequest): Promise<UnifiedOrderResponse> {
    try {
      const recipient = request.recipients[0] // For single recipient
      const orderData = {
        customerCode: this.customerCode,
        orderNumber: `JNT${Date.now()}`,
        serviceType: 'standard',
        paymentType: 'PREPAID',
        sender: {
          name: request.sender.name,
          phone: request.sender.phone,
          email: request.sender.email || '',
          address: 'Pickup Address', // Will be set from quotation context
          city: 'Kuala Lumpur',
          state: 'Selangor',
          postcode: '50000',
          country: 'MY'
        },
        receiver: {
          name: recipient.name,
          phone: recipient.phone,
          email: recipient.email || '',
          address: 'Delivery Address', // Will be set from quotation context
          city: 'Kuala Lumpur',
          state: 'Selangor',
          postcode: '50000',
          country: 'MY'
        },
        itemDetails: [{
          itemName: 'Package',
          itemType: 'GENERAL',
          quantity: 1,
          weight: 1,
          value: 0,
          currency: 'MYR'
        }],
        specialInstructions: recipient.instructions || '',
        codAmount: 0
      }

      const response = await this.makeRequest('/api/logistics/createOrder', orderData)

      const cost = response.totalAmount || 10.00
      
      return {
        orderId: response.orderId || `jnt_${Date.now()}`,
        providerId: this.providerId,
        providerOrderId: response.awbNumber || response.trackingNumber || `JNT${Date.now()}`,
        quotationId: request.quotationId,
        status: this.mapOrderStatus(response.status || 'pending'),
        trackingNumber: response.trackingNumber || response.awbNumber,
        trackingUrl: `https://www.jtexpress.my/track?trackingNumber=${response.trackingNumber || response.awbNumber}`,
        shareLink: `https://www.jtexpress.my/track?trackingNumber=${response.trackingNumber || response.awbNumber}`,
        priceBreakdown: {
          base: cost.toString(),
          taxes: '0',
          fees: '0',
          total: cost.toString(),
          currency: 'MYR'
        },
        estimatedDelivery: response.estimatedDelivery || this.calculateEstimatedDelivery(orderData.serviceType),
        metadata: {
          awbNumber: response.awbNumber,
          serviceType: orderData.serviceType,
          customerCode: this.customerCode,
          provider: 'J&T Express'
        }
      }
    } catch (error) {
      console.error('J&T Express order creation error:', error)
      throw new Error(`Failed to create J&T Express order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async trackOrder(orderId: string): Promise<TrackingUpdate[]> {
    try {
      const response = await this.makeRequest('/api/logistics/trackOrder', {
        customerCode: this.customerCode,
        trackingNumber: orderId
      })

      return response.trackingHistory?.map((event: any) => ({
        timestamp: new Date(event.timestamp),
        status: this.mapOrderStatus(event.status),
        description: event.description || event.remark,
        location: event.location || '',
        metadata: {
          eventCode: event.eventCode,
          facilityCode: event.facilityCode,
          provider: 'J&T Express'
        }
      })) || []
    } catch (error) {
      console.error('J&T Express tracking error:', error)
      throw new Error(`Failed to track J&T Express order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async cancelOrder(orderId: string, reason?: string): Promise<void> {
    try {
      const response = await this.makeRequest('/api/logistics/cancelOrder', {
        customerCode: this.customerCode,
        trackingNumber: orderId,
        cancelReason: reason || 'Cancelled by vendor'
      })

      if (!(response.success === true || response.status === 'cancelled')) {
        throw new Error('Failed to cancel order')
      }
    } catch (error) {
      console.error('J&T Express cancellation error:', error)
      throw new Error(`Failed to cancel J&T Express order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async makeRequest(endpoint: string, data: any): Promise<any> {
    const url = `${this.apiBaseUrl}${endpoint}`
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Customer-Code': this.customerCode
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`J&T Express API error: ${response.status} ${response.statusText}`)
    }

    const result: any = await response.json()
    
    if (result.code !== '200' && result.success !== true) {
      throw new Error(result.message || 'J&T Express API request failed')
    }

    return result.data || result
  }

  private calculateEstimatedCost(weight: number): number {
    // Basic cost calculation for J&T Express
    const baseRate = 8.00 // RM 8.00 base rate
    const perKgRate = 2.50 // RM 2.50 per kg
    return baseRate + (Math.max(1, Math.ceil(weight)) * perKgRate)
  }

  private getEstimatedDeliveryTime(serviceType: string): string {
    switch (serviceType) {
      case 'express':
        return '1-2 business days'
      case 'economy':
        return '3-5 business days'
      default:
        return '2-3 business days'
    }
  }

  private calculateEstimatedDelivery(serviceType: string): string {
    const days = serviceType === 'express' ? 2 : serviceType === 'economy' ? 5 : 3
    const deliveryDate = new Date()
    deliveryDate.setDate(deliveryDate.getDate() + days)
    return deliveryDate.toISOString()
  }

  private mapOrderStatus(jntStatus: string): UnifiedOrderStatus {
    const statusMap: Record<string, UnifiedOrderStatus> = {
      'pending': UnifiedOrderStatus.PENDING,
      'picked_up': UnifiedOrderStatus.PICKED_UP,
      'in_transit': UnifiedOrderStatus.IN_TRANSIT,
      'out_for_delivery': UnifiedOrderStatus.OUT_FOR_DELIVERY,
      'delivered': UnifiedOrderStatus.DELIVERED,
      'failed_delivery': UnifiedOrderStatus.FAILED,
      'cancelled': UnifiedOrderStatus.CANCELLED,
      'returned': UnifiedOrderStatus.RETURNED
    }

    return statusMap[jntStatus.toLowerCase()] || UnifiedOrderStatus.PENDING
  }

  async isAvailable(market: string, serviceType?: string): Promise<boolean> {
    const supportedMarkets = ['MY', 'SG', 'TH', 'VN', 'PH', 'ID', 'KH']
    return supportedMarkets.includes(market.toUpperCase())
  }

  async getServiceTypes(market: string): Promise<string[]> {
    return ['standard', 'express', 'economy']
  }

  async getOrder(orderId: string): Promise<UnifiedOrderResponse> {
    try {
      const response = await this.makeRequest('/api/logistics/getOrder', {
        customerCode: this.customerCode,
        trackingNumber: orderId
      })

      return {
        orderId: response.orderId || orderId,
        providerId: this.providerId,
        providerOrderId: response.awbNumber || response.trackingNumber || orderId,
        quotationId: 'unknown',
        status: this.mapOrderStatus(response.status || 'pending'),
        trackingNumber: response.trackingNumber || response.awbNumber,
        trackingUrl: `https://www.jtexpress.my/track?trackingNumber=${response.trackingNumber || response.awbNumber}`,
        shareLink: `https://www.jtexpress.my/track?trackingNumber=${response.trackingNumber || response.awbNumber}`,
        priceBreakdown: {
          base: (response.totalAmount || 10).toString(),
          taxes: '0',
          fees: '0',
          total: (response.totalAmount || 10).toString(),
          currency: 'MYR'
        },
        estimatedDelivery: response.estimatedDelivery || this.calculateEstimatedDelivery('standard'),
        metadata: {
          awbNumber: response.awbNumber,
          provider: 'J&T Express'
        }
      }
    } catch (error) {
      console.error('J&T Express get order error:', error)
      throw new Error(`Failed to get J&T Express order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  getCapabilities() {
    return {
      supportsRealTimeTracking: true,
      supportsProofOfDelivery: true,
      supportsScheduledPickup: true,
      supportsMultipleDestinations: false,
      supportsInsurance: true,
      supportsPriorityFee: false,
      supportsOrderModification: false,
      supportsDriverChange: false,
      maxDestinations: 1,
      supportedMarkets: ['MY', 'SG', 'TH', 'VN', 'PH', 'ID', 'KH']
    }
  }
}
