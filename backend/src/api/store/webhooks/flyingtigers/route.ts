/**
 * Flying Tigers Express — Webhook Handler
 * POST /store/webhooks/flyingtigers
 *
 * No authentication — Flying Tigers posts directly to this URL.
 * Register this URL in your Flying Tigers merchant portal.
 *
 * VERIFY: confirm the webhook payload shape with Flying Tigers docs.
 * The field names below are based on common PH courier webhook patterns.
 */

import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { FT_STATUS_MAP } from '../../../../services/flyingtigers'

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    let pg: any
    try {
      pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch {
      pg = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    // VERIFY: exact field names from Flying Tigers webhook docs
    const payload = req.body as {
      tracking_no?: string
      tracking_number?: string
      waybill_no?: string
      order_id?: string
      event?: string
      status?: string
      timestamp?: string
      remarks?: string
    }

    // Support multiple possible tracking field names
    const trackingNo = payload.tracking_no ?? payload.tracking_number ?? payload.waybill_no
    const event = payload.event ?? payload.status ?? ''
    const timestamp = payload.timestamp ?? new Date().toISOString()

    if (!trackingNo) {
      console.warn('[FlyingTigers Webhook] No tracking number in payload:', payload)
      return res.json({ received: true })
    }

    console.log(`[FlyingTigers Webhook] ${event} for ${trackingNo}`)

    const internalStatus = FT_STATUS_MAP[event] ?? 'unknown'

    const shippingOrder = await pg('seller_shipping_order')
      .where({ tracking_number: trackingNo, provider: 'flyingtigers' })
      .whereNull('deleted_at')
      .first()

    if (!shippingOrder) {
      console.warn(`[FlyingTigers Webhook] No order found for tracking: ${trackingNo}`)
      return res.json({ received: true })
    }

    const existingEvents: any[] = shippingOrder.webhook_events ?? []
    existingEvents.push({ event, status: internalStatus, timestamp, raw: payload })

    await pg('seller_shipping_order')
      .where({ id: shippingOrder.id })
      .update({
        status: internalStatus,
        webhook_events: JSON.stringify(existingEvents),
        updated_at: new Date(),
      })

    res.json({ received: true })
  } catch (error) {
    console.error('[FlyingTigers Webhook] Error:', error)
    // Always return 200 to prevent Flying Tigers from retrying
    res.json({ received: true, error: (error as Error).message })
  }
}
