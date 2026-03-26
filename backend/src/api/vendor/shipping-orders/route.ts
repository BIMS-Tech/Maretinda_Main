import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { randomUUID } from 'crypto'
import {
  getNinjaVanToken,
  createNinjaVanOrder,
  cancelNinjaVanOrder,
  getNinjaVanWaybill,
  buildNinjaVanOrderPayload,
} from '../../../services/ninjavan'

function getPgConnection(req: AuthenticatedMedusaRequest): any {
  try {
    return req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  } catch {
    return (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
  }
}

async function getSellerId(req: AuthenticatedMedusaRequest, pg: any): Promise<string | null> {
  const actorId = (req as any).auth_context?.actor_id
  if (!actorId) return null
  const member = await pg('member').where('id', actorId).first()
  return member?.seller_id ?? null
}

async function getCredentials(pg: any, sellerId: string, providerId: string) {
  return pg('vendor_shipping_credential')
    .where({ seller_id: sellerId, provider: providerId })
    .whereNull('deleted_at')
    .first()
}

/**
 * GET /vendor/shipping-orders
 * List all shipping orders for the vendor.
 */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  try {
    const pg = getPgConnection(req)
    const sellerId = await getSellerId(req, pg)
    if (!sellerId) return res.status(403).json({ message: 'Seller not found' })

    const { provider, status, medusa_order_id, limit = '20', offset = '0' } = req.query as Record<string, string>

    let query = pg('vendor_shipping_order')
      .where({ seller_id: sellerId })
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset))

    if (provider) query = query.where({ provider })
    if (status) query = query.where({ status })
    if (medusa_order_id) query = query.where({ medusa_order_id })

    const orders = await query

    const countQuery = pg('vendor_shipping_order')
      .where({ seller_id: sellerId })
      .whereNull('deleted_at')
      .count('id as count')
    if (provider) countQuery.where({ provider })
    if (status) countQuery.where({ status })

    const [{ count }] = await countQuery

    // Simple analytics summary
    const allOrders = await pg('vendor_shipping_order')
      .where({ seller_id: sellerId })
      .whereNull('deleted_at')
      .select('status', 'amount')

    const summary = {
      totalOrders: allOrders.length,
      totalCost: allOrders.reduce((s: number, o: any) => s + (parseFloat(o.amount) || 0), 0),
      successfulDeliveries: allOrders.filter((o: any) => o.status === 'delivered').length,
      pendingOrders: allOrders.filter((o: any) => ['pending', 'processing'].includes(o.status)).length,
    }

    res.json({ orders, count: parseInt(String(count)), hasMore: parseInt(offset) + orders.length < parseInt(String(count)), summary })
  } catch (error) {
    console.error('[Shipping Orders GET]', error)
    res.status(500).json({ message: 'Failed to fetch shipping orders' })
  }
}

/**
 * POST /vendor/shipping-orders
 * Actions: create-order | cancel-order | get-waybill
 */
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  try {
    const pg = getPgConnection(req)
    const sellerId = await getSellerId(req, pg)
    if (!sellerId) return res.status(403).json({ message: 'Seller not found' })

    const { action, orderId, providerId, orderData, reason } = req.body as {
      action: string
      orderId?: string
      providerId?: string
      orderData?: Record<string, unknown>
      reason?: string
    }

    if (!action) return res.status(400).json({ message: 'action is required' })

    switch (action) {
      case 'create-order': {
        if (!providerId || !orderData) {
          return res.status(400).json({ message: 'providerId and orderData are required' })
        }

        const credRow = await getCredentials(pg, sellerId, providerId)
        if (!credRow) {
          return res.status(400).json({ message: `No credentials configured for ${providerId}` })
        }
        if (!credRow.is_enabled) {
          return res.status(400).json({ message: `${providerId} is not enabled` })
        }

        const creds = credRow.credentials as Record<string, unknown>

        if (providerId === 'ninjavan') {
          const token = await getNinjaVanToken(
            creds.client_id as string,
            creds.client_secret as string,
            credRow.country_code ?? 'PH',
            creds.sandbox as boolean
          )

          const payload = buildNinjaVanOrderPayload({
            merchantOrderNumber: (orderData.medusa_order_id as string) ?? `order_${Date.now()}`,
            from: orderData.from as any,
            to: orderData.to as any,
            parcel: orderData.parcel as any,
            pickupDate: (orderData.pickup_date as string) ?? new Date(Date.now() + 86400000).toISOString().split('T')[0],
            serviceLevel: (orderData.service_level as any) ?? 'Standard',
          })

          const nvResponse = await createNinjaVanOrder(token, credRow.country_code ?? 'PH', payload, creds.sandbox as boolean)

          const trackingNumber = nvResponse.tracking_number as string
          const shippingOrderId = `vso_${randomUUID().replace(/-/g, '')}`

          await pg('vendor_shipping_order').insert({
            id: shippingOrderId,
            seller_id: sellerId,
            medusa_order_id: orderData.medusa_order_id,
            provider: 'ninjavan',
            country_code: credRow.country_code ?? 'PH',
            provider_order_id: trackingNumber,
            tracking_number: trackingNumber,
            tracking_url: `https://www.ninjavan.co/en-ph/tracking?id=${trackingNumber}`,
            status: 'pending_pickup',
            from_details: JSON.stringify(orderData.from),
            to_details: JSON.stringify(orderData.to),
            parcel_details: JSON.stringify(orderData.parcel),
            provider_request: JSON.stringify(payload),
            provider_response: JSON.stringify(nvResponse),
          })

          return res.json({
            success: true,
            shippingOrderId,
            trackingNumber,
            trackingUrl: `https://www.ninjavan.co/en-ph/tracking?id=${trackingNumber}`,
            providerResponse: nvResponse,
          })
        }

        return res.status(400).json({ message: `Order creation not yet supported for ${providerId}` })
      }

      case 'cancel-order': {
        if (!orderId) return res.status(400).json({ message: 'orderId is required' })

        const shippingOrder = await pg('vendor_shipping_order')
          .where({ id: orderId, seller_id: sellerId })
          .whereNull('deleted_at')
          .first()

        if (!shippingOrder) return res.status(404).json({ message: 'Shipping order not found' })

        if (shippingOrder.provider === 'ninjavan') {
          const credRow = await getCredentials(pg, sellerId, 'ninjavan')
          if (!credRow) return res.status(400).json({ message: 'Ninja Van credentials not found' })

          const creds = credRow.credentials as Record<string, unknown>
          const token = await getNinjaVanToken(
            creds.client_id as string,
            creds.client_secret as string,
            shippingOrder.country_code ?? 'PH',
            creds.sandbox as boolean
          )

          const nvResponse = await cancelNinjaVanOrder(
            token,
            shippingOrder.country_code ?? 'PH',
            shippingOrder.tracking_number,
            creds.sandbox as boolean
          )

          await pg('vendor_shipping_order')
            .where({ id: orderId })
            .update({ status: 'cancelled', provider_response: JSON.stringify(nvResponse), updated_at: new Date() })

          return res.json({ success: true, message: 'Order cancelled', providerResponse: nvResponse })
        }

        // Generic cancel for other providers
        await pg('vendor_shipping_order')
          .where({ id: orderId })
          .update({ status: 'cancelled', updated_at: new Date() })

        return res.json({ success: true, message: 'Order marked as cancelled' })
      }

      case 'get-waybill': {
        if (!orderId) return res.status(400).json({ message: 'orderId is required' })

        const shippingOrder = await pg('vendor_shipping_order')
          .where({ id: orderId, seller_id: sellerId })
          .whereNull('deleted_at')
          .first()

        if (!shippingOrder) return res.status(404).json({ message: 'Shipping order not found' })

        if (shippingOrder.provider !== 'ninjavan') {
          return res.status(400).json({ message: 'Waybill generation only supported for Ninja Van' })
        }

        const credRow = await getCredentials(pg, sellerId, 'ninjavan')
        if (!credRow) return res.status(400).json({ message: 'Ninja Van credentials not found' })

        const creds = credRow.credentials as Record<string, unknown>
        const token = await getNinjaVanToken(
          creds.client_id as string,
          creds.client_secret as string,
          shippingOrder.country_code ?? 'PH',
          creds.sandbox as boolean
        )

        const pdfBuffer = await getNinjaVanWaybill(
          token,
          shippingOrder.country_code ?? 'PH',
          shippingOrder.tracking_number,
          creds.sandbox as boolean
        )

        res.set('Content-Type', 'application/pdf')
        res.set('Content-Disposition', `inline; filename="waybill-${shippingOrder.tracking_number}.pdf"`)
        return res.send(pdfBuffer)
      }

      default:
        return res.status(400).json({ message: `Unknown action: ${action}` })
    }
  } catch (error) {
    console.error('[Shipping Orders POST]', error)
    res.status(500).json({ message: (error as Error).message || 'Internal error' })
  }
}
