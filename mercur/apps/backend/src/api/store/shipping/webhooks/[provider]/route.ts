import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { MultiVendorShippingService } from '@mercurjs/shipping'

/**
 * Unified webhook handler for all shipping providers
 * Route: /store/shipping/webhooks/[provider]
 */

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const providerId = req.params.provider
    const webhookData = req.body as any

    console.log(`Webhook received from provider: ${providerId}`, webhookData)

    if (!providerId) {
      return res.status(400).json({ message: 'Provider ID is required' })
    }

    const shippingService = new MultiVendorShippingService(req.scope)

    // Process webhook based on provider
    const trackingUpdates = await shippingService.processWebhook(providerId, {
      type: webhookData.type || 'UNKNOWN',
      orderId: webhookData.orderId || webhookData.data?.orderId,
      providerId,
      data: webhookData.data || webhookData,
      timestamp: new Date().toISOString(),
      signature: req.headers['x-signature'] as string
    })

    console.log(`Processed ${trackingUpdates.length} tracking updates for ${providerId}`)

    return res.status(200).json({
      message: 'Webhook processed successfully',
      updatesProcessed: trackingUpdates.length
    })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return res.status(500).json({
      message: 'Webhook processing failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  // Health check endpoint for webhook setup verification
  const providerId = req.params.provider
  
  return res.status(200).json({
    message: `Webhook endpoint active for provider: ${providerId}`,
    timestamp: new Date().toISOString()
  })
}

