/**
 * Admin Shipping Orders — platform-wide oversight & control
 * Route: /admin/shipping-orders
 *
 * Admin sees and manages EVERY seller's shipping order (the seller routes at
 * /vendor/shipping-orders are scoped to a single seller). Actions run against
 * Maretinda's platform-level carrier credentials, so admin can cancel, pull a
 * waybill, or refresh tracking for any order regardless of which seller booked
 * it.
 */

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import {
  getNinjaVanToken,
  cancelNinjaVanOrder,
  getNinjaVanWaybill,
} from '../../../services/ninjavan'
import {
  cancelFlyingTigersOrder,
  getFlyingTigersWaybill,
  trackFlyingTigersOrder,
} from '../../../services/flyingtigers'

function getPgConnection(req: AuthenticatedMedusaRequest): any {
  try {
    return req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  } catch {
    return (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
  }
}

/** Load Maretinda's platform credentials for a given provider. */
async function getPlatformCredentials(pg: any, providerId: string): Promise<Record<string, unknown>> {
  const row = await pg('platform_shipping_provider')
    .where({ provider_id: providerId, is_active: true })
    .whereNull('deleted_at')
    .first()
  if (!row) throw new Error(`Carrier "${providerId}" is not configured or not active on this platform`)
  return (typeof row.credentials === 'string' ? JSON.parse(row.credentials) : row.credentials) ?? {}
}

/**
 * GET /admin/shipping-orders
 * List shipping orders across ALL sellers with a platform-wide summary.
 * Filters: seller_id, provider, status, medusa_order_id, search, date_from, date_to.
 */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  try {
    const pg = getPgConnection(req)
    const {
      seller_id, provider, status, medusa_order_id, search,
      date_from, date_to, limit = '20', offset = '0',
    } = req.query as Record<string, string>

    const applyFilters = (q: any) => {
      if (seller_id) q.where('o.seller_id', seller_id)
      if (provider) q.where('o.provider', provider)
      if (status) q.where('o.status', status)
      if (medusa_order_id) q.where('o.medusa_order_id', medusa_order_id)
      if (search) {
        q.where((b: any) =>
          b.whereILike('o.tracking_number', `%${search}%`)
            .orWhereILike('o.medusa_order_id', `%${search}%`)
            .orWhereILike('o.provider_order_id', `%${search}%`)
        )
      }
      if (date_from) q.where('o.created_at', '>=', new Date(date_from))
      if (date_to) {
        const to = new Date(date_to); to.setHours(23, 59, 59, 999)
        q.where('o.created_at', '<=', to)
      }
      return q
    }

    const rows = await applyFilters(
      pg('seller_shipping_order as o')
        .leftJoin('seller as s', 's.id', 'o.seller_id')
        .whereNull('o.deleted_at')
    )
      .select('o.*', 's.name as seller_name')
      .orderBy('o.created_at', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset))

    const [{ count }] = await applyFilters(
      pg('seller_shipping_order as o').whereNull('o.deleted_at')
    ).count('o.id as count')

    // Platform-wide summary across the full (unpaginated, unfiltered) dataset.
    const allOrders = await pg('seller_shipping_order')
      .whereNull('deleted_at')
      .select('status', 'amount', 'provider', 'seller_id')

    const summary = {
      totalOrders: allOrders.length,
      totalCost: allOrders.reduce((s: number, o: any) => s + (parseFloat(o.amount) || 0), 0),
      delivered: allOrders.filter((o: any) => o.status === 'delivered').length,
      pending: allOrders.filter((o: any) => ['pending', 'pending_pickup', 'processing'].includes(o.status)).length,
      cancelled: allOrders.filter((o: any) => o.status === 'cancelled').length,
      sellerCount: new Set(allOrders.map((o: any) => o.seller_id)).size,
      byProvider: allOrders.reduce((acc: Record<string, number>, o: any) => {
        acc[o.provider] = (acc[o.provider] ?? 0) + 1
        return acc
      }, {}),
    }

    res.json({
      orders: rows,
      count: parseInt(String(count)),
      hasMore: parseInt(offset) + rows.length < parseInt(String(count)),
      summary,
    })
  } catch (error) {
    console.error('[Admin Shipping Orders GET]', error)
    res.status(500).json({ message: 'Failed to fetch shipping orders' })
  }
}

/**
 * POST /admin/shipping-orders
 * Actions: cancel-order | get-waybill | get-tracking — operate on ANY seller's order.
 */
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  try {
    const pg = getPgConnection(req)
    const { action, orderId, reason } = req.body as {
      action: string
      orderId?: string
      reason?: string
    }

    if (!action) return res.status(400).json({ message: 'action is required' })
    if (!orderId) return res.status(400).json({ message: 'orderId is required' })

    // Admin is not seller-scoped — look up the order by id alone.
    const order = await pg('seller_shipping_order')
      .where({ id: orderId })
      .whereNull('deleted_at')
      .first()
    if (!order) return res.status(404).json({ message: 'Shipping order not found' })

    const country = order.country_code ?? 'PH'

    if (action === 'cancel-order') {
      if (order.provider === 'ninjavan') {
        const creds = await getPlatformCredentials(pg, 'ninjavan')
        const token = await getNinjaVanToken(creds.client_id as string, creds.client_secret as string, country, (creds.sandbox as boolean) ?? false)
        await cancelNinjaVanOrder(token, country, order.tracking_number, (creds.sandbox as boolean) ?? false)
      } else if (order.provider === 'flyingtigers') {
        const creds = await getPlatformCredentials(pg, 'flyingtigers')
        await cancelFlyingTigersOrder(creds.api_key as string, creds.api_secret as string, order.tracking_number, reason ?? 'Cancelled by admin')
      }

      await pg('seller_shipping_order')
        .where({ id: orderId })
        .update({ status: 'cancelled', updated_at: new Date() })

      return res.json({ success: true, message: 'Shipping order cancelled by admin' })
    }

    if (action === 'get-waybill') {
      let pdfBuffer: Buffer
      if (order.provider === 'ninjavan') {
        const creds = await getPlatformCredentials(pg, 'ninjavan')
        const token = await getNinjaVanToken(creds.client_id as string, creds.client_secret as string, country, (creds.sandbox as boolean) ?? false)
        pdfBuffer = await getNinjaVanWaybill(token, country, order.tracking_number, (creds.sandbox as boolean) ?? false)
      } else if (order.provider === 'flyingtigers') {
        const creds = await getPlatformCredentials(pg, 'flyingtigers')
        pdfBuffer = await getFlyingTigersWaybill(creds.api_key as string, creds.api_secret as string, order.tracking_number)
      } else {
        return res.status(400).json({ message: `Waybill not supported for provider: ${order.provider}` })
      }

      res.set('Content-Type', 'application/pdf')
      res.set('Content-Disposition', `inline; filename="waybill-${order.tracking_number}.pdf"`)
      return res.send(pdfBuffer)
    }

    if (action === 'get-tracking') {
      // Live tracking where the carrier supports it; otherwise fall back to the
      // webhook events we've already persisted for this order.
      if (order.provider === 'flyingtigers') {
        const creds = await getPlatformCredentials(pg, 'flyingtigers')
        const tracking = await trackFlyingTigersOrder(creds.api_key as string, creds.api_secret as string, order.tracking_number)
        return res.json({
          tracking_number: order.tracking_number,
          status: tracking.status ?? order.status,
          tracking_url: order.tracking_url,
          events: tracking.events,
        })
      }
      return res.json({
        tracking_number: order.tracking_number,
        status: order.status,
        tracking_url: order.tracking_url,
        events: order.webhook_events ?? [],
      })
    }

    return res.status(400).json({ message: `Unknown action: ${action}` })
  } catch (error) {
    console.error('[Admin Shipping Orders POST]', error)
    const err = error as any
    const cause = err?.cause
    const dnsCode = cause?.code ?? err?.code
    if (err?.message === 'fetch failed' || dnsCode === 'ENOTFOUND' || dnsCode === 'ECONNREFUSED') {
      return res.status(502).json({ message: `Could not reach the carrier's API. Verify the provider's base URL and credentials.` })
    }
    res.status(500).json({ message: (error as Error).message || 'Internal error' })
  }
}
