import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { SubscriberArgs } from '@medusajs/medusa'
import crypto from 'crypto'

export interface LalamoveConfig {
  apiKey: string
  apiSecret: string
  market: string
  environment: 'sandbox' | 'production'
  webhookUrl?: string
}

export interface LalamoveQuotationRequest {
  serviceType: string
  specialRequests?: string[]
  language: string
  stops: LalamoveStop[]
  scheduleAt?: string
  isRouteOptimized?: boolean
  item?: {
    quantity?: string
    weight?: string
    categories?: string[]
    handlingInstructions?: string[]
  }
}

export interface LalamoveStop {
  coordinates: {
    lat: string
    lng: string
  }
  address: string
}

export interface LalamoveQuotationResponse {
  quotationId: string
  scheduleAt: string
  expiresAt: string
  serviceType: string
  specialRequests: string[]
  language: string
  stops: LalamoveStopWithId[]
  isRouteOptimized: boolean
  priceBreakdown: {
    base: string
    total: string
    currency: string
    [key: string]: string
  }
  distance: {
    value: string
    unit: string
  }
}

export interface LalamoveStopWithId extends LalamoveStop {
  stopId: string
}

export interface LalamoveOrderRequest {
  quotationId: string
  sender: {
    stopId: string
    name: string
    phone: string
  }
  recipients: {
    stopId: string
    name: string
    phone: string
    remarks?: string
  }[]
  isPODEnabled?: boolean
  partner?: string
  metadata?: Record<string, any>
}

export interface LalamoveOrderResponse {
  orderId: string
  quotationId: string
  priceBreakdown: {
    base: string
    total: string
    currency: string
    priorityFee?: string
    [key: string]: string
  }
  driverId: string
  shareLink: string
  status: LalamoveOrderStatus
  distance: {
    value: string
    unit: string
  }
  stops: LalamoveStopWithDetails[]
  metadata?: Record<string, any>
}

export interface LalamoveStopWithDetails extends LalamoveStopWithId {
  name: string
  phone: string
  remarks?: string
  POD?: {
    status: 'PENDING' | 'DELIVERED' | 'SIGNED' | 'FAILED'
    image?: string
    deliveredAt?: string
  }
}

export type LalamoveOrderStatus = 
  | 'ASSIGNING_DRIVER'
  | 'ON_GOING'
  | 'PICKED_UP'
  | 'COMPLETED'
  | 'CANCELED'
  | 'REJECTED'
  | 'EXPIRED'

export interface ShippingOrder {
  id: string
  order_id: string
  lalamove_order_id: string
  lalamove_quotation_id: string
  status: LalamoveOrderStatus
  pickup_address: string
  pickup_coordinates: { lat: string; lng: string }
  delivery_address: string
  delivery_coordinates: { lat: string; lng: string }
  sender_name: string
  sender_phone: string
  recipient_name: string
  recipient_phone: string
  price: number
  currency: string
  driver_id?: string
  driver_name?: string
  driver_phone?: string
  share_link?: string
  tracking_url?: string
  estimated_delivery?: string
  actual_delivery?: string
  pod_status?: string
  pod_image?: string
  metadata?: Record<string, any>
  created_at: Date
  updated_at: Date
}

export class ShippingService {
  private config: LalamoveConfig
  private baseUrl: string

  constructor(config: LalamoveConfig) {
    this.config = config
    this.baseUrl = config.environment === 'sandbox' 
      ? 'https://rest.sandbox.lalamove.com/v3'
      : 'https://rest.lalamove.com/v3'
  }

  private generateSignature(method: string, path: string, body: string = ''): {
    timestamp: string
    signature: string
    token: string
  } {
    const timestamp = Date.now().toString()
    const rawSignature = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${body}`
    const signature = crypto
      .createHmac('sha256', this.config.apiSecret)
      .update(rawSignature)
      .digest('hex')
    
    const token = `${this.config.apiKey}:${timestamp}:${signature}`
    
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
      'Market': this.config.market,
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

    return response.json()
  }

  async getQuotation(request: LalamoveQuotationRequest): Promise<LalamoveQuotationResponse> {
    const response = await this.makeRequest<{ data: LalamoveQuotationResponse }>(
      'POST',
      '/quotations',
      { data: request }
    )
    return response.data
  }

  async placeOrder(request: LalamoveOrderRequest): Promise<LalamoveOrderResponse> {
    const response = await this.makeRequest<{ data: LalamoveOrderResponse }>(
      'POST',
      '/orders',
      { data: request }
    )
    return response.data
  }

  async getOrder(orderId: string): Promise<LalamoveOrderResponse> {
    const response = await this.makeRequest<{ data: LalamoveOrderResponse }>(
      'GET',
      `/orders/${orderId}`
    )
    return response.data
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.makeRequest('DELETE', `/orders/${orderId}`)
  }

  async getDriverDetails(orderId: string, driverId: string): Promise<{
    driverId: string
    name: string
    phone: string
    plateNumber: string
    photo?: string
    coordinates?: {
      lat: string
      lng: string
      updatedAt: string
    }
  }> {
    const response = await this.makeRequest<{ data: any }>(
      'GET',
      `/orders/${orderId}/drivers/${driverId}`
    )
    return response.data
  }

  async addPriorityFee(orderId: string, priorityFee: string): Promise<LalamoveOrderResponse> {
    const response = await this.makeRequest<{ data: LalamoveOrderResponse }>(
      'POST',
      `/orders/${orderId}/priority-fee`,
      { data: { priorityFee } }
    )
    return response.data
  }

  async changeDriver(orderId: string, driverId: string, reason: string): Promise<void> {
    await this.makeRequest(
      'DELETE',
      `/orders/${orderId}/drivers/${driverId}`,
      { reason }
    )
  }

  async getCities(): Promise<any[]> {
    const response = await this.makeRequest<{ data: any[] }>('GET', '/cities')
    return response.data
  }

  async setupWebhook(url: string): Promise<void> {
    await this.makeRequest('PATCH', '/webhook', { data: { url } })
  }
}

export class ShippingDatabaseService {
  private container: any

  constructor(container: any) {
    this.container = container
  }

  private async getConnection() {
    try {
      return this.container.resolve(ContainerRegistrationKeys.QUERY)
    } catch (error) {
      // Fallback to direct connection
      return this.container.__pg_connection__ || this.container.pgConnection
    }
  }

  async createShippingOrder(orderData: Omit<ShippingOrder, 'id' | 'created_at' | 'updated_at'>): Promise<ShippingOrder> {
    const connection = await this.getConnection()
    
    // Create shipping_orders table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS shipping_orders (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(255) NOT NULL,
        lalamove_order_id VARCHAR(255) NOT NULL,
        lalamove_quotation_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        pickup_address TEXT NOT NULL,
        pickup_coordinates JSONB NOT NULL,
        delivery_address TEXT NOT NULL,
        delivery_coordinates JSONB NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        sender_phone VARCHAR(50) NOT NULL,
        recipient_name VARCHAR(255) NOT NULL,
        recipient_phone VARCHAR(50) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        driver_id VARCHAR(255),
        driver_name VARCHAR(255),
        driver_phone VARCHAR(50),
        share_link TEXT,
        tracking_url TEXT,
        estimated_delivery TIMESTAMP,
        actual_delivery TIMESTAMP,
        pod_status VARCHAR(50),
        pod_image TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    const result = await connection.query(`
      INSERT INTO shipping_orders (
        order_id, lalamove_order_id, lalamove_quotation_id, status,
        pickup_address, pickup_coordinates, delivery_address, delivery_coordinates,
        sender_name, sender_phone, recipient_name, recipient_phone,
        price, currency, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      orderData.order_id,
      orderData.lalamove_order_id,
      orderData.lalamove_quotation_id,
      orderData.status,
      orderData.pickup_address,
      JSON.stringify(orderData.pickup_coordinates),
      orderData.delivery_address,
      JSON.stringify(orderData.delivery_coordinates),
      orderData.sender_name,
      orderData.sender_phone,
      orderData.recipient_name,
      orderData.recipient_phone,
      orderData.price,
      orderData.currency,
      JSON.stringify(orderData.metadata || {})
    ])

    return result.rows[0]
  }

  async updateShippingOrder(id: string, updates: Partial<ShippingOrder>): Promise<ShippingOrder> {
    const connection = await this.getConnection()
    
    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at')
    const values = Object.values(updates).filter((_, index) => fields[index])
    
    if (fields.length === 0) {
      throw new Error('No fields to update')
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ')
    const query = `
      UPDATE shipping_orders 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `

    const result = await connection.query(query, [id, ...values])
    return result.rows[0]
  }

  async getShippingOrder(id: string): Promise<ShippingOrder | null> {
    const connection = await this.getConnection()
    const result = await connection.query('SELECT * FROM shipping_orders WHERE id = $1', [id])
    return result.rows[0] || null
  }

  async getShippingOrderByLalamoveId(lalamoveOrderId: string): Promise<ShippingOrder | null> {
    const connection = await this.getConnection()
    const result = await connection.query('SELECT * FROM shipping_orders WHERE lalamove_order_id = $1', [lalamoveOrderId])
    return result.rows[0] || null
  }

  async getShippingOrdersByOrderId(orderId: string): Promise<ShippingOrder[]> {
    const connection = await this.getConnection()
    const result = await connection.query('SELECT * FROM shipping_orders WHERE order_id = $1 ORDER BY created_at DESC', [orderId])
    return result.rows
  }

  async getAllShippingOrders(limit = 50, offset = 0): Promise<{ orders: ShippingOrder[], total: number }> {
    const connection = await this.getConnection()
    
    const countResult = await connection.query('SELECT COUNT(*) FROM shipping_orders')
    const total = parseInt(countResult.rows[0].count)
    
    const result = await connection.query(
      'SELECT * FROM shipping_orders ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    )
    
    return { orders: result.rows, total }
  }

  async getShippingOrdersByStatus(status: LalamoveOrderStatus, limit = 50, offset = 0): Promise<{ orders: ShippingOrder[], total: number }> {
    const connection = await this.getConnection()
    
    const countResult = await connection.query('SELECT COUNT(*) FROM shipping_orders WHERE status = $1', [status])
    const total = parseInt(countResult.rows[0].count)
    
    const result = await connection.query(
      'SELECT * FROM shipping_orders WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [status, limit, offset]
    )
    
    return { orders: result.rows, total }
  }
}































