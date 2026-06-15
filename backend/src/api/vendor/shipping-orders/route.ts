/**
 * Vendor Shipping Orders
 * Route: /vendor/shipping-orders
 *
 * Vendors create shipments through Maretinda's centralized carrier accounts.
 * No per-vendor credentials needed — admin manages platform-level credentials.
 */

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
import {
  createFlyingTigersOrder,
  cancelFlyingTigersOrder,
  getFlyingTigersWaybill,
  FlyingTigersOrderPayload,
} from '../../../services/flyingtigers'

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

/**
 * Normalize an incoming address into a canonical shape.
 * The seller panel sends `address`/`postcode`/`state`, while the carrier
 * builders expect `address1`/`postal_code`/`province`/`state`. Accept all
 * variants so a booking never fails on a naming mismatch.
 */
function normalizeAddress(a: any = {}) {
  const address1 = a.address1 ?? a.address ?? a.address_1 ?? ''
  const address2 = a.address2 ?? a.address_2 ?? undefined
  const province = a.province ?? a.state ?? undefined
  const postal = a.postal_code ?? a.postcode ?? ''
  return {
    name: a.name ?? '',
    phone: a.phone ?? a.mobile ?? '',
    email: a.email ?? undefined,
    address1,
    address2,
    barangay: a.barangay ?? undefined,
    city: a.city ?? '',
    // expose both spellings so either builder works
    state: province,
    province,
    postcode: postal,
    postal_code: postal,
    country: a.country ?? 'PH',
  }
}

/** Normalize parcel dimensions/weight, accepting multiple field spellings. */
function normalizeParcel(p: any = {}) {
  const num = (...vals: any[]) => {
    for (const v of vals) {
      if (v !== undefined && v !== null && v !== '') {
        const n = Number(v)
        if (!Number.isNaN(n)) return n
      }
    }
    return undefined
  }
  return {
    weight_kg: num(p.weight_kg, p.weightKg, p.weight) ?? 1,
    length_cm: num(p.length_cm, p.lengthCm, p.length),
    width_cm: num(p.width_cm, p.widthCm, p.width),
    height_cm: num(p.height_cm, p.heightCm, p.height),
    description: p.description ?? undefined,
    declared_value: num(p.declared_value, p.declaredValue),
    is_cod: p.is_cod ?? p.isCod ?? false,
    cod_amount: num(p.cod_amount, p.codAmount) ?? 0,
  }
}

/** Load Maretinda's platform credentials for a given provider */
async function getPlatformCredentials(pg: any, providerId: string) {
  const row = await pg('platform_shipping_provider')
    .where({ provider_id: providerId, is_active: true })
    .whereNull('deleted_at')
    .first()
  if (!row) throw new Error(`Carrier "${providerId}" is not configured or not active on this platform`)
  return row.credentials as Record<string, unknown>
}

/**
 * GET /vendor/shipping-orders
 * List all shipping orders for this seller with analytics summary.
 */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  try {
    const pg = getPgConnection(req)
    const sellerId = await getSellerId(req, pg)
    if (!sellerId) return res.status(403).json({ message: 'Seller not found' })

    const { provider, status, medusa_order_id, limit = '20', offset = '0' } = req.query as Record<string, string>

    let query = pg('seller_shipping_order')
      .where({ seller_id: sellerId })
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset))

    if (provider) query = query.where({ provider })
    if (status) query = query.where({ status })
    if (medusa_order_id) query = query.where({ medusa_order_id })

    const orders = await query

    const [{ count }] = await pg('seller_shipping_order')
      .where({ seller_id: sellerId })
      .whereNull('deleted_at')
      .modify((q: any) => { if (provider) q.where({ provider }); if (status) q.where({ status }) })
      .count('id as count')

    const allOrders = await pg('seller_shipping_order')
      .where({ seller_id: sellerId })
      .whereNull('deleted_at')
      .select('status', 'amount', 'provider')

    const summary = {
      totalOrders: allOrders.length,
      totalCost: allOrders.reduce((s: number, o: any) => s + (parseFloat(o.amount) || 0), 0),
      successfulDeliveries: allOrders.filter((o: any) => o.status === 'delivered').length,
      pendingOrders: allOrders.filter((o: any) => ['pending', 'pending_pickup', 'processing'].includes(o.status)).length,
      byProvider: allOrders.reduce((acc: Record<string, number>, o: any) => {
        acc[o.provider] = (acc[o.provider] ?? 0) + 1
        return acc
      }, {}),
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
      orderData?: Record<string, any>
      reason?: string
    }

    if (!action) return res.status(400).json({ message: 'action is required' })

    // ── CREATE ORDER ──────────────────────────────────────────────────────────
    if (action === 'create-order') {
      if (!providerId || !orderData) {
        return res.status(400).json({ message: 'providerId and orderData are required' })
      }

      const creds = await getPlatformCredentials(pg, providerId).catch((err) => {
        throw new Error(err.message)
      })

      const shippingOrderId = `vso_${randomUUID().replace(/-/g, '')}`

      // ── Ninja Van ────────────────────────────────────────────────────────
      if (providerId === 'ninjavan') {
        const countryCode = (creds.country_code as string) ?? 'PH'
        const token = await getNinjaVanToken(
          creds.client_id as string,
          creds.client_secret as string,
          countryCode,
          (creds.sandbox as boolean) ?? false
        )

        const nvFrom = normalizeAddress(orderData.from)
        const nvTo = normalizeAddress(orderData.to)
        const nvParcel = normalizeParcel(orderData.parcel)

        const payload = buildNinjaVanOrderPayload({
          merchantOrderNumber: (orderData.medusa_order_id as string) ?? `order_${Date.now()}`,
          from: {
            name: nvFrom.name,
            phone: nvFrom.phone,
            email: nvFrom.email,
            address1: nvFrom.address1,
            address2: nvFrom.address2,
            city: nvFrom.city,
            state: nvFrom.state,
            postcode: nvFrom.postcode,
            country: nvFrom.country,
          },
          to: {
            name: nvTo.name,
            phone: nvTo.phone,
            email: nvTo.email,
            address1: nvTo.address1,
            address2: nvTo.address2,
            city: nvTo.city,
            state: nvTo.state,
            postcode: nvTo.postcode,
            country: nvTo.country,
          },
          parcel: {
            weightKg: nvParcel.weight_kg,
            lengthCm: nvParcel.length_cm,
            widthCm: nvParcel.width_cm,
            heightCm: nvParcel.height_cm,
            description: nvParcel.description,
          },
          pickupDate: orderData.pickup_date ?? new Date(Date.now() + 86400000).toISOString().split('T')[0],
          serviceLevel: orderData.service_level ?? 'Standard',
        })

        const nvResponse = await createNinjaVanOrder(token, countryCode, payload, (creds.sandbox as boolean) ?? false)
        const trackingNumber = nvResponse.tracking_number as string

        await pg('seller_shipping_order').insert({
          id: shippingOrderId,
          seller_id: sellerId,
          medusa_order_id: orderData.medusa_order_id,
          provider: 'ninjavan',
          country_code: countryCode,
          provider_order_id: trackingNumber,
          tracking_number: trackingNumber,
          tracking_url: `https://www.ninjavan.co/en-ph/tracking?id=${trackingNumber}`,
          status: 'pending_pickup',
          service_level: orderData.service_level ?? 'Standard',
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
          provider: 'ninjavan',
        })
      }

      // ── Flying Tigers ────────────────────────────────────────────────────
      if (providerId === 'flyingtigers') {
        const ftFrom = normalizeAddress(orderData.from)
        const ftTo = normalizeAddress(orderData.to)
        const ftParcel = normalizeParcel(orderData.parcel)

        const ftPayload: FlyingTigersOrderPayload = {
          merchant_order_no: (orderData.medusa_order_id as string) ?? `order_${Date.now()}`,
          service_type: orderData.service_level ?? 'Standard',
          pickup_date: orderData.pickup_date,
          shipper: {
            name: ftFrom.name,
            phone: ftFrom.phone,
            email: ftFrom.email,
            address1: ftFrom.address1,
            address2: ftFrom.address2,
            barangay: ftFrom.barangay,
            city: ftFrom.city,
            province: ftFrom.province,
            postal_code: ftFrom.postal_code,
            country: ftFrom.country,
          },
          consignee: {
            name: ftTo.name,
            phone: ftTo.phone,
            email: ftTo.email,
            address1: ftTo.address1,
            address2: ftTo.address2,
            barangay: ftTo.barangay,
            city: ftTo.city,
            province: ftTo.province,
            postal_code: ftTo.postal_code,
            country: ftTo.country,
          },
          parcel: {
            weight_kg: ftParcel.weight_kg,
            length_cm: ftParcel.length_cm,
            width_cm: ftParcel.width_cm,
            height_cm: ftParcel.height_cm,
            description: ftParcel.description,
            declared_value: ftParcel.declared_value,
            is_cod: ftParcel.is_cod,
            cod_amount: ftParcel.cod_amount,
          },
        }

        const ftResponse = await createFlyingTigersOrder(
          creds.api_key as string,
          creds.api_secret as string,
          ftPayload
        )

        await pg('seller_shipping_order').insert({
          id: shippingOrderId,
          seller_id: sellerId,
          medusa_order_id: orderData.medusa_order_id,
          provider: 'flyingtigers',
          country_code: 'PH',
          provider_order_id: ftResponse.order_id,
          tracking_number: ftResponse.tracking_no,
          tracking_url: ftResponse.tracking_url,
          status: 'pending_pickup',
          service_level: orderData.service_level ?? 'Standard',
          from_details: JSON.stringify(orderData.from),
          to_details: JSON.stringify(orderData.to),
          parcel_details: JSON.stringify(orderData.parcel),
          provider_request: JSON.stringify(ftPayload),
          provider_response: JSON.stringify(ftResponse),
        })

        return res.json({
          success: true,
          shippingOrderId,
          trackingNumber: ftResponse.tracking_no,
          trackingUrl: ftResponse.tracking_url,
          provider: 'flyingtigers',
        })
      }

      return res.status(400).json({ message: `Order creation not supported for "${providerId}"` })
    }

    // ── CANCEL ORDER ──────────────────────────────────────────────────────────
    if (action === 'cancel-order') {
      if (!orderId) return res.status(400).json({ message: 'orderId is required' })

      const shippingOrder = await pg('seller_shipping_order')
        .where({ id: orderId, seller_id: sellerId })
        .whereNull('deleted_at')
        .first()
      if (!shippingOrder) return res.status(404).json({ message: 'Shipping order not found' })

      if (shippingOrder.provider === 'ninjavan') {
        const creds = await getPlatformCredentials(pg, 'ninjavan')
        const token = await getNinjaVanToken(
          creds.client_id as string,
          creds.client_secret as string,
          shippingOrder.country_code ?? 'PH',
          (creds.sandbox as boolean) ?? false
        )
        await cancelNinjaVanOrder(token, shippingOrder.country_code ?? 'PH', shippingOrder.tracking_number, (creds.sandbox as boolean) ?? false)
      }

      if (shippingOrder.provider === 'flyingtigers') {
        const creds = await getPlatformCredentials(pg, 'flyingtigers')
        await cancelFlyingTigersOrder(creds.api_key as string, creds.api_secret as string, shippingOrder.tracking_number, reason)
      }

      await pg('seller_shipping_order')
        .where({ id: orderId })
        .update({ status: 'cancelled', updated_at: new Date() })

      return res.json({ success: true, message: 'Shipping order cancelled' })
    }

    // ── GET WAYBILL ───────────────────────────────────────────────────────────
    if (action === 'get-waybill') {
      if (!orderId) return res.status(400).json({ message: 'orderId is required' })

      const shippingOrder = await pg('seller_shipping_order')
        .where({ id: orderId, seller_id: sellerId })
        .whereNull('deleted_at')
        .first()
      if (!shippingOrder) return res.status(404).json({ message: 'Shipping order not found' })

      let pdfBuffer: Buffer

      if (shippingOrder.provider === 'ninjavan') {
        const creds = await getPlatformCredentials(pg, 'ninjavan')
        const token = await getNinjaVanToken(
          creds.client_id as string,
          creds.client_secret as string,
          shippingOrder.country_code ?? 'PH',
          (creds.sandbox as boolean) ?? false
        )
        pdfBuffer = await getNinjaVanWaybill(token, shippingOrder.country_code ?? 'PH', shippingOrder.tracking_number, (creds.sandbox as boolean) ?? false)
      } else if (shippingOrder.provider === 'flyingtigers') {
        const creds = await getPlatformCredentials(pg, 'flyingtigers')
        pdfBuffer = await getFlyingTigersWaybill(creds.api_key as string, creds.api_secret as string, shippingOrder.tracking_number)
      } else {
        return res.status(400).json({ message: `Waybill not supported for provider: ${shippingOrder.provider}` })
      }

      res.set('Content-Type', 'application/pdf')
      res.set('Content-Disposition', `inline; filename="waybill-${shippingOrder.tracking_number}.pdf"`)
      return res.send(pdfBuffer)
    }

    return res.status(400).json({ message: `Unknown action: ${action}` })
  } catch (error) {
    console.error('[Shipping Orders POST]', error)
    res.status(500).json({ message: (error as Error).message || 'Internal error' })
  }
}
