import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { MultiVendorShippingService } from '@mercurjs/shipping'

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const shippingService = new MultiVendorShippingService(req.scope)
    
    const { 
      limit = 50, 
      offset = 0, 
      status, 
      provider_id,
      order_id 
    } = req.query

    // Get tracking history for specific order
    if (order_id) {
      const trackingHistory = await shippingService.getTrackingHistory(order_id as string)
      return res.json({ trackingHistory })
    }

    // For now, return configured providers and their status
    const configuredProviders = shippingService.getConfiguredProviders()
    
    return res.json({ 
      providers: configuredProviders,
      message: 'Multi-vendor shipping system active'
    })
  } catch (error) {
    console.error('Error fetching vendor shipping information:', error)
    return res.status(500).json({
      message: 'Failed to fetch shipping information',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export const POST = async (
  req: AuthenticatedMedusaRequest<{
    action: 'get-quotations' | 'get-best-quotation' | 'place-order' | 'cancel-order' | 'track-order' | 'configure-provider'
    data: any
    providerId?: string
    criteria?: any
  }>,
  res: MedusaResponse
) => {
  try {
    const { action, data, providerId, criteria } = req.validatedBody
    const shippingService = new MultiVendorShippingService(req.scope)

    switch (action) {
      case 'get-quotations':
        // Get quotations from all available providers
        const quotations = await shippingService.getMultipleQuotations(data, criteria)
        return res.json({ quotations })

      case 'get-best-quotation':
        // Get the best quotation based on criteria
        const bestQuotation = await shippingService.getBestQuotation(data, criteria)
        return res.json({ quotation: bestQuotation })

      case 'place-order':
        // Place order with specified provider or auto-select best
        const order = await shippingService.placeOrder(data, providerId)
        return res.json({ order })

      case 'cancel-order':
        // Cancel order
        const { orderId, reason } = data
        await shippingService.cancelOrder(orderId, reason, providerId)
        return res.json({ message: 'Order cancelled successfully' })

      case 'track-order':
        // Track order across all providers
        const { orderId: trackingOrderId } = data
        const trackingUpdates = await shippingService.trackOrder(trackingOrderId, providerId)
        return res.json({ tracking: trackingUpdates })

      case 'configure-provider':
        // Configure a shipping provider
        await shippingService.configureProvider(data)
        return res.json({ message: 'Provider configured successfully' })

      default:
        return res.status(400).json({
          message: 'Invalid action'
        })
    }
  } catch (error) {
    console.error('Error in vendor shipping action:', error)
    return res.status(500).json({
      message: 'Failed to process shipping action',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}