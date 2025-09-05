import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import {
  TrackingUpdate,
  UnifiedOrderStatus,
  UnifiedOrderResponse
} from '../interfaces/shipping-provider.interface'

/**
 * Unified tracking service for managing shipment tracking across all providers
 */
export class TrackingService {
  private container: any

  constructor(container: any) {
    this.container = container
  }

  /**
   * Get comprehensive tracking information for an order
   */
  async getOrderTracking(orderId: string): Promise<{
    order: UnifiedOrderResponse | null
    trackingHistory: TrackingUpdate[]
    currentStatus: UnifiedOrderStatus
    estimatedDelivery: string | null
    lastUpdate: string | null
  }> {
    const connection = await this.getConnection()

    // Get order details
    const orderResult = await connection.query(
      'SELECT * FROM unified_shipping_orders WHERE order_id = $1 OR provider_order_id = $1',
      [orderId]
    )

    const order = orderResult.rows[0] || null

    // Get tracking history
    const trackingHistory = await this.getTrackingHistory(orderId)

    // Determine current status
    const currentStatus = order?.status || UnifiedOrderStatus.PENDING

    // Get estimated delivery
    const estimatedDelivery = order?.estimated_delivery || null

    // Get last update timestamp
    const lastUpdate = trackingHistory.length > 0 
      ? trackingHistory[trackingHistory.length - 1].timestamp 
      : null

    return {
      order: order ? this.mapDatabaseOrderToUnified(order) : null,
      trackingHistory,
      currentStatus,
      estimatedDelivery,
      lastUpdate
    }
  }

  /**
   * Get tracking history for multiple orders
   */
  async getBulkTracking(orderIds: string[]): Promise<Record<string, TrackingUpdate[]>> {
    const connection = await this.getConnection()
    
    const placeholders = orderIds.map((_, index) => `$${index + 1}`).join(',')
    const result = await connection.query(
      `SELECT * FROM shipping_tracking_updates 
       WHERE order_id IN (${placeholders}) 
       ORDER BY order_id, timestamp ASC`,
      orderIds
    )

    const trackingByOrder: Record<string, TrackingUpdate[]> = {}
    
    result.rows.forEach((row: any) => {
      const orderId = row.order_id
      if (!trackingByOrder[orderId]) {
        trackingByOrder[orderId] = []
      }
      
      trackingByOrder[orderId].push(this.mapDatabaseRowToTrackingUpdate(row))
    })

    return trackingByOrder
  }

  /**
   * Add tracking update for an order
   */
  async addTrackingUpdate(update: TrackingUpdate): Promise<void> {
    const connection = await this.getConnection()

    // Check if update already exists to prevent duplicates
    const existingResult = await connection.query(
      `SELECT id FROM shipping_tracking_updates 
       WHERE order_id = $1 AND provider_id = $2 AND timestamp = $3`,
      [update.orderId, update.providerId, new Date(update.timestamp)]
    )

    if (existingResult.rows.length > 0) {
      console.log('Tracking update already exists, skipping:', update)
      return
    }

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

    // Update order status if this is the latest update
    await this.updateOrderStatus(update.orderId, update.status)
  }

  /**
   * Get tracking statistics for analytics
   */
  async getTrackingStatistics(
    startDate: Date,
    endDate: Date,
    providerId?: string
  ): Promise<{
    totalShipments: number
    statusBreakdown: Record<UnifiedOrderStatus, number>
    averageDeliveryTime: number
    onTimeDeliveryRate: number
    providerPerformance: Record<string, {
      shipments: number
      averageDeliveryTime: number
      onTimeRate: number
    }>
  }> {
    const connection = await this.getConnection()

    let whereClause = 'WHERE created_at BETWEEN $1 AND $2'
    let params: any[] = [startDate, endDate]

    if (providerId) {
      whereClause += ' AND provider_id = $3'
      params.push(providerId)
    }

    // Get total shipments
    const totalResult = await connection.query(
      `SELECT COUNT(*) as total FROM unified_shipping_orders ${whereClause}`,
      params
    )
    const totalShipments = parseInt(totalResult.rows[0].total)

    // Get status breakdown
    const statusResult = await connection.query(
      `SELECT status, COUNT(*) as count 
       FROM unified_shipping_orders 
       ${whereClause} 
       GROUP BY status`,
      params
    )

    const statusBreakdown: Record<UnifiedOrderStatus, number> = {} as any
    statusResult.rows.forEach((row: any) => {
      statusBreakdown[row.status as UnifiedOrderStatus] = parseInt(row.count)
    })

    // Get delivery time statistics
    const deliveryTimeResult = await connection.query(
      `SELECT 
         AVG(EXTRACT(EPOCH FROM (actual_delivery - created_at))/3600) as avg_hours,
         COUNT(*) as delivered_count
       FROM unified_shipping_orders 
       ${whereClause} AND status = 'DELIVERED' AND actual_delivery IS NOT NULL`,
      params
    )

    const averageDeliveryTime = parseFloat(deliveryTimeResult.rows[0]?.avg_hours || '0')

    // Get on-time delivery rate
    const onTimeResult = await connection.query(
      `SELECT 
         COUNT(*) as on_time_count
       FROM unified_shipping_orders 
       ${whereClause} 
       AND status = 'DELIVERED' 
       AND actual_delivery <= estimated_delivery`,
      params
    )

    const onTimeCount = parseInt(onTimeResult.rows[0]?.on_time_count || '0')
    const deliveredCount = parseInt(deliveryTimeResult.rows[0]?.delivered_count || '0')
    const onTimeDeliveryRate = deliveredCount > 0 ? (onTimeCount / deliveredCount) * 100 : 0

    // Get provider performance
    const providerResult = await connection.query(
      `SELECT 
         provider_id,
         COUNT(*) as shipments,
         AVG(EXTRACT(EPOCH FROM (actual_delivery - created_at))/3600) as avg_hours,
         COUNT(CASE WHEN actual_delivery <= estimated_delivery THEN 1 END) as on_time_count,
         COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as delivered_count
       FROM unified_shipping_orders 
       ${whereClause}
       GROUP BY provider_id`,
      params
    )

    const providerPerformance: Record<string, any> = {}
    providerResult.rows.forEach((row: any) => {
      const deliveredCount = parseInt(row.delivered_count)
      providerPerformance[row.provider_id] = {
        shipments: parseInt(row.shipments),
        averageDeliveryTime: parseFloat(row.avg_hours || '0'),
        onTimeRate: deliveredCount > 0 ? (parseInt(row.on_time_count) / deliveredCount) * 100 : 0
      }
    })

    return {
      totalShipments,
      statusBreakdown,
      averageDeliveryTime,
      onTimeDeliveryRate,
      providerPerformance
    }
  }

  /**
   * Get real-time tracking updates for active shipments
   */
  async getActiveShipmentsTracking(): Promise<Array<{
    orderId: string
    providerId: string
    status: UnifiedOrderStatus
    lastUpdate: string
    estimatedDelivery: string | null
    driverInfo?: any
  }>> {
    const connection = await this.getConnection()

    const result = await connection.query(`
      SELECT 
        o.order_id,
        o.provider_id,
        o.status,
        o.estimated_delivery,
        o.driver_info,
        t.timestamp as last_update
      FROM unified_shipping_orders o
      LEFT JOIN LATERAL (
        SELECT timestamp 
        FROM shipping_tracking_updates 
        WHERE order_id = o.order_id 
        ORDER BY timestamp DESC 
        LIMIT 1
      ) t ON true
      WHERE o.status IN ('CONFIRMED', 'DRIVER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY')
      ORDER BY o.created_at DESC
    `)

    return result.rows.map((row: any) => ({
      orderId: row.order_id,
      providerId: row.provider_id,
      status: row.status,
      lastUpdate: row.last_update?.toISOString() || new Date().toISOString(),
      estimatedDelivery: row.estimated_delivery?.toISOString() || null,
      driverInfo: row.driver_info
    }))
  }

  /**
   * Generate tracking notifications for status changes
   */
  async generateTrackingNotifications(orderId: string, newStatus: UnifiedOrderStatus): Promise<{
    customerNotification?: {
      type: string
      message: string
      data: any
    }
    vendorNotification?: {
      type: string
      message: string
      data: any
    }
  }> {
    const notifications: any = {}

    const statusMessages: Record<UnifiedOrderStatus, string> = {
      [UnifiedOrderStatus.PENDING]: 'Your shipment is pending processing.',
      [UnifiedOrderStatus.CONFIRMED]: 'Your shipment has been confirmed and is being prepared.',
      [UnifiedOrderStatus.ASSIGNING_DRIVER]: 'We are assigning a driver to your shipment.',
      [UnifiedOrderStatus.DRIVER_ASSIGNED]: 'A driver has been assigned to your shipment.',
      [UnifiedOrderStatus.PICKED_UP]: 'Your package has been picked up and is on its way.',
      [UnifiedOrderStatus.IN_TRANSIT]: 'Your package is in transit to the destination.',
      [UnifiedOrderStatus.OUT_FOR_DELIVERY]: 'Your package is out for delivery and will arrive soon.',
      [UnifiedOrderStatus.DELIVERED]: 'Your package has been successfully delivered.',
      [UnifiedOrderStatus.FAILED]: 'There was an issue with your delivery. Please contact support.',
      [UnifiedOrderStatus.CANCELLED]: 'Your shipment has been cancelled.',
      [UnifiedOrderStatus.RETURNED]: 'Your package has been returned.',
      [UnifiedOrderStatus.EXPIRED]: 'Your shipment has expired.'
    }

    const message = statusMessages[newStatus] || 'Your shipment status has been updated.'

    // Customer notification
    if ([
      UnifiedOrderStatus.CONFIRMED,
      UnifiedOrderStatus.PICKED_UP,
      UnifiedOrderStatus.OUT_FOR_DELIVERY,
      UnifiedOrderStatus.DELIVERED,
      UnifiedOrderStatus.FAILED
    ].includes(newStatus)) {
      notifications.customerNotification = {
        type: 'shipping_update',
        message,
        data: {
          orderId,
          status: newStatus,
          timestamp: new Date().toISOString()
        }
      }
    }

    // Vendor notification
    if ([
      UnifiedOrderStatus.DELIVERED,
      UnifiedOrderStatus.FAILED,
      UnifiedOrderStatus.CANCELLED
    ].includes(newStatus)) {
      notifications.vendorNotification = {
        type: 'shipping_update',
        message: `Order ${orderId} status: ${newStatus}`,
        data: {
          orderId,
          status: newStatus,
          timestamp: new Date().toISOString()
        }
      }
    }

    return notifications
  }

  private async getTrackingHistory(orderId: string): Promise<TrackingUpdate[]> {
    const connection = await this.getConnection()
    const result = await connection.query(
      'SELECT * FROM shipping_tracking_updates WHERE order_id = $1 ORDER BY timestamp ASC',
      [orderId]
    )
    
    return result.rows.map(this.mapDatabaseRowToTrackingUpdate)
  }

  private async updateOrderStatus(orderId: string, status: UnifiedOrderStatus): Promise<void> {
    const connection = await this.getConnection()
    
    // Only update if this is a more recent status
    await connection.query(
      `UPDATE unified_shipping_orders 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE (order_id = $2 OR provider_order_id = $2)
       AND updated_at < CURRENT_TIMESTAMP`,
      [status, orderId]
    )

    // Update actual delivery time if delivered
    if (status === UnifiedOrderStatus.DELIVERED) {
      await connection.query(
        `UPDATE unified_shipping_orders 
         SET actual_delivery = CURRENT_TIMESTAMP 
         WHERE (order_id = $1 OR provider_order_id = $1) 
         AND actual_delivery IS NULL`,
        [orderId]
      )
    }
  }

  private mapDatabaseRowToTrackingUpdate(row: any): TrackingUpdate {
    return {
      orderId: row.order_id,
      providerId: row.provider_id,
      status: row.status,
      message: row.message,
      timestamp: row.timestamp.toISOString(),
      location: row.location,
      driverInfo: row.driver_info,
      metadata: row.metadata
    }
  }

  private mapDatabaseOrderToUnified(orderRow: any): UnifiedOrderResponse {
    return {
      orderId: orderRow.order_id,
      providerId: orderRow.provider_id,
      providerOrderId: orderRow.provider_order_id,
      quotationId: orderRow.quotation_id,
      status: orderRow.status,
      trackingNumber: orderRow.tracking_number,
      trackingUrl: orderRow.tracking_url,
      shareLink: orderRow.share_link,
      priceBreakdown: orderRow.price_breakdown,
      estimatedDelivery: orderRow.estimated_delivery?.toISOString(),
      driverInfo: orderRow.driver_info,
      proofOfDelivery: orderRow.proof_of_delivery,
      metadata: orderRow.metadata
    }
  }

  private async getConnection() {
    try {
      return this.container.resolve(ContainerRegistrationKeys.QUERY)
    } catch (error) {
      return this.container.__pg_connection__ || this.container.pgConnection
    }
  }
}
