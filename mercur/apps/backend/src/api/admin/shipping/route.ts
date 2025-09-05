import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ShippingService, ShippingDatabaseService, LalamoveQuotationRequest, LalamoveOrderRequest } from '../../../services/shipping'

export const POST = async (
  req: AuthenticatedMedusaRequest<{
    action: 'get-quotation' | 'place-order' | 'cancel-order' | 'get-order' | 'add-priority-fee' | 'change-driver'
    data: any
  }>,
  res: MedusaResponse
) => {
  const { action, data } = req.validatedBody

  // Get Lalamove configuration from environment or database
  const config = {
    apiKey: process.env.LALAMOVE_API_KEY || '',
    apiSecret: process.env.LALAMOVE_API_SECRET || '',
    market: process.env.LALAMOVE_MARKET || 'MY',
    environment: (process.env.LALAMOVE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
  }

  if (!config.apiKey || !config.apiSecret) {
    return res.status(400).json({
      message: 'Lalamove API credentials not configured'
    })
  }

  const shippingService = new ShippingService(config)
  const dbService = new ShippingDatabaseService(req.scope)

  try {
    switch (action) {
      case 'get-quotation':
        const quotation = await shippingService.getQuotation(data as LalamoveQuotationRequest)
        return res.json({ quotation })

      case 'place-order':
        const order = await shippingService.placeOrder(data as LalamoveOrderRequest)
        
        // Store order in database
        await dbService.createShippingOrder({
          order_id: data.metadata?.order_id || '',
          lalamove_order_id: order.orderId,
          lalamove_quotation_id: order.quotationId,
          status: order.status,
          pickup_address: order.stops[0]?.address || '',
          pickup_coordinates: order.stops[0]?.coordinates || { lat: '', lng: '' },
          delivery_address: order.stops[1]?.address || '',
          delivery_coordinates: order.stops[1]?.coordinates || { lat: '', lng: '' },
          sender_name: order.stops[0]?.name || '',
          sender_phone: order.stops[0]?.phone || '',
          recipient_name: order.stops[1]?.name || '',
          recipient_phone: order.stops[1]?.phone || '',
          price: parseFloat(order.priceBreakdown.total),
          currency: order.priceBreakdown.currency,
          driver_id: order.driverId,
          share_link: order.shareLink,
          metadata: data.metadata
        })

        return res.json({ order })

      case 'cancel-order':
        await shippingService.cancelOrder(data.orderId)
        await dbService.updateShippingOrder(data.shippingOrderId, { status: 'CANCELED' })
        return res.json({ message: 'Order cancelled successfully' })

      case 'get-order':
        const orderDetails = await shippingService.getOrder(data.orderId)
        return res.json({ order: orderDetails })

      case 'add-priority-fee':
        const updatedOrder = await shippingService.addPriorityFee(data.orderId, data.priorityFee)
        await dbService.updateShippingOrder(data.shippingOrderId, { 
          price: parseFloat(updatedOrder.priceBreakdown.total)
        })
        return res.json({ order: updatedOrder })

      case 'change-driver':
        await shippingService.changeDriver(data.orderId, data.driverId, data.reason)
        return res.json({ message: 'Driver changed successfully' })

      default:
        return res.status(400).json({ message: 'Invalid action' })
    }
  } catch (error) {
    console.error('Shipping API error:', error)
    return res.status(500).json({ 
      message: 'Shipping operation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { limit = 50, offset = 0, status, order_id } = req.query

  const dbService = new ShippingDatabaseService(req.scope)

  try {
    let result

    if (order_id) {
      const orders = await dbService.getShippingOrdersByOrderId(order_id as string)
      result = { orders, total: orders.length }
    } else if (status) {
      result = await dbService.getShippingOrdersByStatus(status as any, parseInt(limit as string), parseInt(offset as string))
    } else {
      result = await dbService.getAllShippingOrders(parseInt(limit as string), parseInt(offset as string))
    }

    return res.json(result)
  } catch (error) {
    console.error('Shipping GET error:', error)
    return res.status(500).json({ 
      message: 'Failed to fetch shipping orders',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
