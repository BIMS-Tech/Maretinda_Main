/**
 * Flying Tigers Express PH — API Service
 * Full order lifecycle: create, cancel, waybill, rate calculation.
 *
 * IMPORTANT — Before going live, verify these with Flying Tigers API docs:
 *   1. FLYINGTIGERS_BASE_URL  — confirm the production base URL
 *   2. Auth header names      — X-API-Key + X-Merchant-Code (common pattern; confirm)
 *   3. Request/response shapes — compare with their docs and adjust field names
 *   4. Rate endpoint path     — /rates or /quotation (confirm)
 *
 * The user has credentials (api_key + merchant_code). These map to the
 * configTemplate already defined in the vendor shipping-providers route.
 */

export const FLYINGTIGERS_BASE_URL = 'https://api.flyingtigersexpress.com/v1'

// ─── Types ────────────────────────────────────────────────────────────────────

export type FlyingTigersAddress = {
  name: string
  phone: string
  email?: string
  address1: string
  address2?: string
  barangay?: string
  city: string
  province?: string
  postal_code: string
  country?: string
}

export type FlyingTigersParcel = {
  weight_kg: number
  length_cm?: number
  width_cm?: number
  height_cm?: number
  description?: string
  declared_value?: number
  is_cod?: boolean
  cod_amount?: number
}

export type FlyingTigersOrderPayload = {
  merchant_order_no: string
  service_type?: 'Standard' | 'Express' | 'Sameday' | 'Nextday'
  pickup_date?: string // YYYY-MM-DD
  shipper: FlyingTigersAddress
  consignee: FlyingTigersAddress
  parcel: FlyingTigersParcel
}

export type FlyingTigersRateRequest = {
  origin_postal: string
  dest_postal: string
  weight_kg: number
  length_cm?: number
  width_cm?: number
  height_cm?: number
  declared_value?: number
}

export type FlyingTigersRate = {
  service_type: string
  rate: number
  currency: string
  estimated_days: number
  estimated_delivery: string
}

export type FlyingTigersOrderResponse = {
  tracking_no: string
  order_id: string
  status: string
  estimated_delivery?: string
  tracking_url?: string
}

// ─── Auth Helper ──────────────────────────────────────────────────────────────

function getAuthHeaders(apiKey: string, merchantCode: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    // VERIFY: confirm exact header names with Flying Tigers API docs
    'X-API-Key': apiKey,
    'X-Merchant-Code': merchantCode,
  }
}

async function handleResponse<T>(res: Response, context: string): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(`Flying Tigers ${context} failed (${res.status}): ${JSON.stringify(body)}`)
  }
  return res.json() as Promise<T>
}

// ─── Rate Calculation ─────────────────────────────────────────────────────────

/**
 * Get shipping rates for a parcel between two postal codes.
 * Returns all available service levels with prices and ETAs.
 *
 * VERIFY endpoint path: /rates or /quotation or /price
 */
export async function getFlyingTigersRates(
  apiKey: string,
  merchantCode: string,
  request: FlyingTigersRateRequest
): Promise<FlyingTigersRate[]> {
  const res = await fetch(`${FLYINGTIGERS_BASE_URL}/rates`, {
    method: 'POST',
    headers: getAuthHeaders(apiKey, merchantCode),
    body: JSON.stringify({
      origin_postal_code: request.origin_postal,
      destination_postal_code: request.dest_postal,
      weight: request.weight_kg,
      length: request.length_cm ?? 10,
      width: request.width_cm ?? 10,
      height: request.height_cm ?? 10,
      declared_value: request.declared_value ?? 0,
    }),
  })

  // VERIFY: response shape — adjust mapping if field names differ
  const data = await handleResponse<{ rates?: FlyingTigersRate[]; quotations?: any[] }>(res, 'get rates')

  // Normalize response (some APIs return 'rates', others 'quotations')
  if (Array.isArray(data.rates)) return data.rates
  if (Array.isArray(data.quotations)) {
    return data.quotations.map((q: any) => ({
      service_type: q.service_type ?? q.service ?? 'Standard',
      rate: parseFloat(q.amount ?? q.rate ?? q.total ?? 0),
      currency: q.currency ?? 'PHP',
      estimated_days: parseInt(q.transit_days ?? q.estimated_days ?? 3),
      estimated_delivery: q.estimated_delivery ?? '',
    }))
  }

  return []
}

// ─── Create Order ─────────────────────────────────────────────────────────────

/**
 * Create a Flying Tigers shipment order.
 *
 * VERIFY:
 *   - Endpoint: /orders or /bookings or /shipments
 *   - Field names in shipper/consignee blocks
 *   - COD payload format
 */
export async function createFlyingTigersOrder(
  apiKey: string,
  merchantCode: string,
  payload: FlyingTigersOrderPayload
): Promise<FlyingTigersOrderResponse> {
  const body = {
    // VERIFY: top-level field names
    merchant_order_no: payload.merchant_order_no,
    service_type: payload.service_type ?? 'Standard',
    pickup_date: payload.pickup_date ?? getNextBusinessDay(),
    pickup_timeslot: '09:00-18:00',

    shipper: {
      name: payload.shipper.name,
      mobile: payload.shipper.phone,
      email: payload.shipper.email ?? '',
      address: payload.shipper.address1,
      address2: payload.shipper.address2 ?? '',
      barangay: payload.shipper.barangay ?? '',
      city: payload.shipper.city,
      province: payload.shipper.province ?? '',
      postal_code: payload.shipper.postal_code,
      country: payload.shipper.country ?? 'PH',
    },

    consignee: {
      name: payload.consignee.name,
      mobile: payload.consignee.phone,
      email: payload.consignee.email ?? '',
      address: payload.consignee.address1,
      address2: payload.consignee.address2 ?? '',
      barangay: payload.consignee.barangay ?? '',
      city: payload.consignee.city,
      province: payload.consignee.province ?? '',
      postal_code: payload.consignee.postal_code,
      country: payload.consignee.country ?? 'PH',
    },

    parcel: {
      weight: payload.parcel.weight_kg,
      length: payload.parcel.length_cm ?? 10,
      width: payload.parcel.width_cm ?? 10,
      height: payload.parcel.height_cm ?? 10,
      description: payload.parcel.description ?? 'Merchandise',
      declared_value: payload.parcel.declared_value ?? 0,
      is_cod: payload.parcel.is_cod ?? false,
      cod_amount: payload.parcel.cod_amount ?? 0,
    },
  }

  const res = await fetch(`${FLYINGTIGERS_BASE_URL}/orders`, {
    method: 'POST',
    headers: getAuthHeaders(apiKey, merchantCode),
    body: JSON.stringify(body),
  })

  const data = await handleResponse<any>(res, 'create order')

  // VERIFY: response field names for tracking_no and order_id
  return {
    tracking_no: data.tracking_no ?? data.tracking_number ?? data.waybill_no ?? '',
    order_id: data.order_id ?? data.id ?? data.booking_id ?? '',
    status: data.status ?? 'Pending Pickup',
    estimated_delivery: data.estimated_delivery ?? '',
    tracking_url: data.tracking_url
      ?? `https://www.flyingtigersexpress.com/tracking?tracking_no=${data.tracking_no ?? data.tracking_number}`,
  }
}

// ─── Cancel Order ─────────────────────────────────────────────────────────────

/**
 * Cancel a Flying Tigers order by tracking number.
 * Only works for orders not yet picked up.
 *
 * VERIFY: endpoint path and method (DELETE vs POST /cancel)
 */
export async function cancelFlyingTigersOrder(
  apiKey: string,
  merchantCode: string,
  trackingNo: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  // VERIFY: cancel endpoint — some use DELETE /orders/{id}, others POST /orders/{id}/cancel
  const res = await fetch(`${FLYINGTIGERS_BASE_URL}/orders/${trackingNo}/cancel`, {
    method: 'POST',
    headers: getAuthHeaders(apiKey, merchantCode),
    body: JSON.stringify({ reason: reason ?? 'Cancelled by merchant' }),
  })

  const data = await handleResponse<any>(res, 'cancel order')
  return {
    success: data.success ?? data.status === 'Cancelled',
    message: data.message ?? 'Order cancelled',
  }
}

// ─── Waybill / Label ──────────────────────────────────────────────────────────

/**
 * Download a waybill/shipping label PDF for the given tracking number.
 *
 * VERIFY: endpoint path — /orders/{id}/label or /waybill/{id}
 */
export async function getFlyingTigersWaybill(
  apiKey: string,
  merchantCode: string,
  trackingNo: string
): Promise<Buffer> {
  // VERIFY: waybill endpoint path and response format (PDF buffer vs base64 string vs URL)
  const res = await fetch(`${FLYINGTIGERS_BASE_URL}/orders/${trackingNo}/label`, {
    headers: getAuthHeaders(apiKey, merchantCode),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Flying Tigers waybill failed (${res.status}): ${err}`)
  }

  const contentType = res.headers.get('Content-Type') ?? ''

  // PDF directly
  if (contentType.includes('application/pdf')) {
    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  // JSON with base64 or URL
  const data = await res.json()
  if (data.pdf_base64 ?? data.label_base64) {
    return Buffer.from(data.pdf_base64 ?? data.label_base64, 'base64')
  }
  if (data.label_url ?? data.pdf_url) {
    const pdfRes = await fetch(data.label_url ?? data.pdf_url)
    const arrayBuffer = await pdfRes.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  throw new Error('Flying Tigers: could not extract label PDF from response')
}

// ─── Track Order ──────────────────────────────────────────────────────────────

/**
 * Get latest tracking status for a shipment.
 *
 * VERIFY: endpoint and response shape
 */
export async function trackFlyingTigersOrder(
  apiKey: string,
  merchantCode: string,
  trackingNo: string
): Promise<{ status: string; events: any[] }> {
  const res = await fetch(`${FLYINGTIGERS_BASE_URL}/orders/${trackingNo}/tracking`, {
    headers: getAuthHeaders(apiKey, merchantCode),
  })
  const data = await handleResponse<any>(res, 'track order')
  return {
    status: data.status ?? data.latest_status ?? 'unknown',
    events: data.events ?? data.tracking_events ?? [],
  }
}

// ─── Webhook Status Map ───────────────────────────────────────────────────────

/**
 * Map Flying Tigers webhook event statuses to Maretinda internal statuses.
 * VERIFY: confirm event strings match what Flying Tigers actually sends.
 */
export const FT_STATUS_MAP: Record<string, string> = {
  'Pending Pickup': 'pending_pickup',
  'Pickup Scheduled': 'pending_pickup',
  'Rider En Route for Pickup': 'pickup_dispatched',
  'Picked Up': 'picked_up',
  'Arrived at Hub': 'in_transit',
  'In Transit': 'in_transit',
  'Out for Delivery': 'out_for_delivery',
  'Delivered': 'delivered',
  'Delivery Failed': 'exception',
  'Delivery Exception': 'exception',
  'Max Delivery Attempts Reached': 'failed',
  'Return Initiated': 'returning',
  'Returned to Sender': 'returned',
  'Cancelled': 'cancelled',
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function getNextBusinessDay(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  // Skip weekends
  if (d.getDay() === 0) d.setDate(d.getDate() + 1)
  if (d.getDay() === 6) d.setDate(d.getDate() + 2)
  return d.toISOString().split('T')[0]
}
