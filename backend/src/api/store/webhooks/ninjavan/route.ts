import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * Ninja Van webhook status → our internal status mapping
 */
const STATUS_MAP: Record<string, string> = {
  'Pending Pickup': 'pending_pickup',
  'Driver dispatched for Pickup': 'pickup_dispatched',
  'Picked Up, In Transit to Origin Hub': 'picked_up',
  'Arrived at Origin Hub': 'in_transit',
  'Arrived at Transit Hub': 'in_transit',
  'Arrived at Destination Hub': 'in_transit',
  'In Transit to Next Sorting Hub': 'in_transit',
  'On Vehicle for Delivery': 'out_for_delivery',
  'Delivered, Received by Customer': 'delivered',
  'Delivered, Left at Doorstep': 'delivered',
  'Delivered, Collected by Customer': 'delivered',
  'Delivery Exception, Pending Reschedule': 'exception',
  'Delivery Exception, Max Attempts Reached': 'failed',
  'Delivery Exception, Return to Sender Initiated': 'returning',
  'Returned to Sender': 'returned',
  'Cancelled': 'cancelled',
  'Pickup Exception, Max Attempts Reached': 'failed',
}

/**
 * POST /store/webhooks/ninjavan
 * Receives status update webhooks from Ninja Van.
 * No authentication — Ninja Van posts directly to this URL.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    let pg: any
    try {
      pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch {
      pg = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    const payload = req.body as {
      tracking_id: string
      shipper_order_ref_no?: string
      timestamp: string
      event: string
      status: string
    }

    const { tracking_id, event, status, timestamp } = payload

    if (!tracking_id) {
      return res.status(400).json({ message: 'tracking_id is required' })
    }

    console.log(`[NinjaVan Webhook] ${event} for ${tracking_id}`)

    const internalStatus = STATUS_MAP[event] ?? STATUS_MAP[status] ?? 'unknown'

    // Find matching shipping order
    const shippingOrder = await pg('vendor_shipping_order')
      .where({ tracking_number: tracking_id })
      .whereNull('deleted_at')
      .first()

    if (!shippingOrder) {
      // May be a test webhook or untracked order — acknowledge anyway
      console.warn(`[NinjaVan Webhook] No shipping order found for tracking: ${tracking_id}`)
      return res.json({ received: true })
    }

    // Append event to webhook_events array and update status
    const existingEvents: any[] = shippingOrder.webhook_events ?? []
    existingEvents.push({ event, status, timestamp, raw: payload })

    await pg('vendor_shipping_order')
      .where({ id: shippingOrder.id })
      .update({
        status: internalStatus,
        webhook_events: JSON.stringify(existingEvents),
        updated_at: new Date(),
      })

    res.json({ received: true })
  } catch (error) {
    console.error('[NinjaVan Webhook] Error:', error)
    // Always return 200 to prevent Ninja Van from retrying
    res.json({ received: true, error: (error as Error).message })
  }
}
