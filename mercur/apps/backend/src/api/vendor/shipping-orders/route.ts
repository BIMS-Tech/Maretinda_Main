import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { VendorShippingService } from "@mercurjs/shipping"

export const POST = async (
  req: MedusaRequest<{
    action: 'place-order' | 'cancel-order' | 'track-order' | 'update-order'
    orderData?: any
    orderId?: string
    providerId?: string
    reason?: string
  }>,
  res: MedusaResponse
) => {
  try {
    const user = req.user
    if (!user?.seller) {
      return res.status(401).json({ error: "Unauthorized - seller required" })
    }

    const { action, orderData, orderId, providerId, reason } = req.body
    const vendorId = user.seller.id
    const vendorShippingService = new VendorShippingService(req.scope)

    switch (action) {
      case 'place-order': {
        if (!orderData) {
          return res.status(400).json({ error: 'Order data is required' })
        }

        // Add vendor context to order
        const vendorOrderData = {
          ...orderData,
          vendorId,
          vendorContext: {
            vendorId,
            storeId: user.seller.id,
            storeName: user.seller.name,
            region: orderData.region || 'PH',
            market: orderData.market || 'PH'
          }
        }

        const order = await vendorShippingService.placeVendorOrder(vendorOrderData)
        
        res.json({
          order,
          billing: {
            vendorCost: order.vendorCost,
            marketplaceCost: order.marketplaceCost,
            billingResponsibility: order.billingResponsibility,
            credentialsSource: order.credentialsSource
          },
          timeline: order.estimatedTimeline,
          tracking: {
            trackingNumber: order.trackingNumber,
            trackingUrl: order.trackingUrl,
            shareLink: order.shareLink
          }
        })
        break
      }

      case 'cancel-order': {
        if (!orderId) {
          return res.status(400).json({ error: 'Order ID is required' })
        }

        const cancellation = await vendorShippingService.cancelVendorOrder(
          vendorId,
          orderId,
          reason || 'Cancelled by vendor'
        )
        
        res.json({
          message: 'Order cancelled successfully',
          cancellation,
          refund: cancellation.refundDetails
        })
        break
      }

      case 'track-order': {
        if (!orderId) {
          return res.status(400).json({ error: 'Order ID is required' })
        }

        const tracking = await vendorShippingService.trackVendorOrder(vendorId, orderId)
        
        res.json({
          tracking,
          realTimeUpdates: tracking.realTimeUpdates,
          driverInfo: tracking.driverInfo,
          estimatedArrival: tracking.estimatedArrival
        })
        break
      }

      case 'update-order': {
        if (!orderId || !orderData) {
          return res.status(400).json({ error: 'Order ID and update data are required' })
        }

        const updatedOrder = await vendorShippingService.updateVendorOrder(
          vendorId,
          orderId,
          orderData
        )
        
        res.json({
          message: 'Order updated successfully',
          order: updatedOrder
        })
        break
      }

      default:
        return res.status(400).json({ error: 'Invalid action' })
    }

  } catch (error) {
    console.error('[Vendor Shipping Orders API] Error:', error)
    res.status(500).json({
      error: 'Failed to process shipping order action',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

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

    const {
      order_id,
      provider_id,
      status,
      limit = 50,
      offset = 0,
      date_from,
      date_to
    } = req.query

    if (order_id) {
      // Get specific order details
      const order = await vendorShippingService.getVendorOrder(vendorId, order_id as string)
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' })
      }

      // Include real-time tracking if order is in transit
      if (order.status === 'in_transit' || order.status === 'out_for_delivery') {
        const tracking = await vendorShippingService.trackVendorOrder(vendorId, order_id as string)
        order.realTimeTracking = tracking
      }

      res.json({ order })
    } else {
      // Get vendor's shipping orders with filters
      const orders = await vendorShippingService.getVendorOrders(vendorId, {
        providerId: provider_id as string,
        status: status as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        dateFrom: date_from as string,
        dateTo: date_to as string
      })

      // Add summary statistics
      const summary = await vendorShippingService.getVendorOrdersSummary(vendorId, {
        dateFrom: date_from as string,
        dateTo: date_to as string
      })

      res.json({
        orders: orders.data,
        count: orders.count,
        hasMore: orders.hasMore,
        summary: {
          totalOrders: summary.totalOrders,
          totalCost: summary.totalCost,
          successfulDeliveries: summary.successfulDeliveries,
          averageDeliveryTime: summary.averageDeliveryTime,
          topProviders: summary.topProviders
        }
      })
    }

  } catch (error) {
    console.error('[Vendor Shipping Orders API] Error:', error)
    res.status(500).json({
      error: 'Failed to fetch shipping orders',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}


