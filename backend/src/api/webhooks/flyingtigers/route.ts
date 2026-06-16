/**
 * Flying Tigers Express — Webhook Handler
 * POST /webhooks/flyingtigers
 *
 * Hosted outside the /store prefix on purpose: /store routes require a
 * publishable API key, which Flying Tigers does not send. Root paths are
 * unauthenticated, so the carrier can POST directly here.
 *
 * Security (per FT portal):
 *   - Each delivery includes headers:
 *       x-fte-webhook-timestamp : the timestamp that was signed
 *       x-fte-webhook-signature : "v1=<hex>"  (HMAC-SHA256)
 *   - Verify by computing HMAC-SHA256 over `${timestamp}.${rawBody}` with the
 *     signing secret, then constant-time comparing to the hex after "v1=".
 *   - Secret is stored in FLYINGTIGERS_WEBHOOK_SECRET (never hard-code it).
 */

import crypto from 'crypto'
import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { FT_STATUS_MAP } from '../../../services/flyingtigers'

/**
 * Verify the HMAC-SHA256 signature on a Flying Tigers webhook delivery.
 * Returns true when valid, false when invalid. When no secret is configured
 * it returns true but logs a warning, so the endpoint still works before the
 * secret is wired up (do configure it in production).
 */
function verifySignature(req: MedusaRequest): boolean {
  const secret = process.env.FLYINGTIGERS_WEBHOOK_SECRET
  if (!secret) {
    console.warn(
      '[FlyingTigers Webhook] FLYINGTIGERS_WEBHOOK_SECRET not set — skipping signature verification',
    )
    return true
  }

  const timestamp = req.headers['x-fte-webhook-timestamp']
  const signatureHeader = req.headers['x-fte-webhook-signature']
  if (typeof timestamp !== 'string' || typeof signatureHeader !== 'string') {
    return false
  }

  // The raw body is preserved by the bodyParser middleware for this route.
  const raw = (req as any).rawBody
  const rawBody = Buffer.isBuffer(raw)
    ? raw.toString('utf8')
    : typeof raw === 'string'
      ? raw
      : JSON.stringify(req.body ?? {})

  const provided = signatureHeader.replace(/^v1=/, '').trim()
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  const a = Buffer.from(provided, 'hex')
  const b = Buffer.from(expected, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    if (!verifySignature(req)) {
      console.warn('[FlyingTigers Webhook] Invalid signature — rejecting')
      return res.status(401).json({ message: 'Invalid signature' })
    }

    let pg: any
    try {
      pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch {
      pg = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    const payload = req.body as {
      tracking_no?: string
      tracking_number?: string
      trackingNumber?: string
      waybill_no?: string
      shipment_id?: string
      id?: string
      order_id?: string
      event?: string
      event_type?: string
      type?: string
      status?: string
      timestamp?: string
      remarks?: string
    }

    // Accept the various field spellings the API may use for the tracking number.
    const trackingNo =
      payload.tracking_no ??
      payload.tracking_number ??
      payload.trackingNumber ??
      payload.waybill_no
    const event = payload.event ?? payload.event_type ?? payload.type ?? payload.status ?? ''
    const timestamp = payload.timestamp ?? new Date().toISOString()

    if (!trackingNo) {
      // Could be a transaction/wallet event or a test ping — acknowledge.
      console.log('[FlyingTigers Webhook] Event without tracking number:', event || payload)
      return res.json({ received: true })
    }

    console.log(`[FlyingTigers Webhook] ${event} for ${trackingNo}`)

    const internalStatus = FT_STATUS_MAP[event] ?? 'unknown'

    // Tracking numbers are matched case-insensitively per FT docs.
    const shippingOrder = await pg('seller_shipping_order')
      .whereRaw('LOWER(tracking_number) = LOWER(?)', [trackingNo])
      .where({ provider: 'flyingtigers' })
      .whereNull('deleted_at')
      .first()

    if (!shippingOrder) {
      console.warn(`[FlyingTigers Webhook] No order found for tracking: ${trackingNo}`)
      return res.json({ received: true })
    }

    const existingEvents: any[] = shippingOrder.webhook_events ?? []
    existingEvents.push({ event, status: internalStatus, timestamp, raw: payload })

    // Only move the status forward to a known mapping; keep the existing
    // status if the event isn't one we recognize.
    const nextStatus = internalStatus === 'unknown' ? shippingOrder.status : internalStatus

    await pg('seller_shipping_order')
      .where({ id: shippingOrder.id })
      .update({
        status: nextStatus,
        webhook_events: JSON.stringify(existingEvents),
        updated_at: new Date(),
      })

    res.json({ received: true })
  } catch (error) {
    console.error('[FlyingTigers Webhook] Error:', error)
    // Acknowledge with 200 so FT doesn't hammer retries on a transient error.
    res.json({ received: true, error: (error as Error).message })
  }
}
