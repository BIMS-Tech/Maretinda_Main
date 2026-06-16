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
 * The user has credentials (api_key + api_secret). These map to the
 * configTemplate already defined in the vendor shipping-providers route.
 */

// Host root of the Flying Tigers Business API (no trailing slash, no path).
// All endpoints live under `${FLYINGTIGERS_BASE_URL}/api/...`.
// Set FLYINGTIGERS_BASE_URL to the exact host from the Business API portal
// (e.g. the "servers" URL in their OpenAPI spec) — the default is a best guess.
export const FLYINGTIGERS_BASE_URL = (
  process.env.FLYINGTIGERS_BASE_URL || 'https://api.flyingtigers.express'
).replace(/\/+$/, '')

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Address as the FT Business API expects it. It uses PSGC codes
 * (barangay/city/province) plus human-readable labels. Codes are optional in
 * our payload because the seller/checkout data is free-text; when they're not
 * supplied FT may reject with a clear validation error naming the missing code.
 */
export type FlyingTigersAddress = {
  name: string
  mobileNumber: string
  email?: string
  company?: string
  floorUnitNumber?: string
  streetName: string
  barangayCode?: string
  barangayLabel?: string
  cityCode?: string
  cityLabel: string
  provinceCode?: string
  provinceLabel?: string
  zipCode: string
}

export type FlyingTigersPackage = {
  boxName?: string
  weightInKg: number
  lengthInCm?: number
  widthInCm?: number
  heightInCm?: number
  quantity?: number
}

export type FlyingTigersOrderPayload = {
  orderNumber: string
  deliveryType?: string // e.g. 'standard' | 'next day' | 'same day'
  itemType?: string
  declaredValueInPesos?: number
  isCashOnDelivery?: boolean
  paymentMethod?: string // e.g. 'invoice' | 'cod'
  deliveryInstructions?: string
  remarks?: string
  sender: FlyingTigersAddress
  receiver: FlyingTigersAddress
  packages: FlyingTigersPackage[]
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

function getAuthHeaders(apiKey: string, apiSecret: string): Record<string, string> {
  // Flying Tigers Business API authenticates via x-api-key + x-api-secret headers.
  // Trim defensively — these are copy-pasted "shown once" values and a stray
  // space/newline silently produces a 401 "Invalid API key or secret".
  return {
    'Content-Type': 'application/json',
    'x-api-key': (apiKey ?? '').trim(),
    'x-api-secret': (apiSecret ?? '').trim(),
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
  apiSecret: string,
  request: FlyingTigersRateRequest
): Promise<FlyingTigersRate[]> {
  const res = await fetch(`${FLYINGTIGERS_BASE_URL}/api/rates/quote`, {
    method: 'POST',
    headers: getAuthHeaders(apiKey, apiSecret),
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

/** Build the FT address block, dropping undefined optional fields. */
function buildFtAddress(a: FlyingTigersAddress): Record<string, unknown> {
  const out: Record<string, unknown> = {
    name: a.name,
    mobileNumber: a.mobileNumber,
    streetName: a.streetName,
    cityLabel: a.cityLabel,
    zipCode: a.zipCode,
  }
  if (a.email) out.email = a.email
  if (a.company) out.company = a.company
  if (a.floorUnitNumber) out.floorUnitNumber = a.floorUnitNumber
  if (a.barangayCode) out.barangayCode = a.barangayCode
  if (a.barangayLabel) out.barangayLabel = a.barangayLabel
  if (a.cityCode) out.cityCode = a.cityCode
  if (a.provinceCode) out.provinceCode = a.provinceCode
  if (a.provinceLabel) out.provinceLabel = a.provinceLabel
  return out
}

/**
 * Create a Flying Tigers shipment order.
 * Body shape matches the FT Business API `POST /api/shipments` schema.
 */
export async function createFlyingTigersOrder(
  apiKey: string,
  apiSecret: string,
  payload: FlyingTigersOrderPayload
): Promise<FlyingTigersOrderResponse> {
  const body: Record<string, unknown> = {
    orderNumber: payload.orderNumber,
    deliveryType: payload.deliveryType ?? 'standard',
    itemType: payload.itemType ?? 'Parcel',
    declaredValueInPesos: payload.declaredValueInPesos ?? 0,
    isCashOnDelivery: payload.isCashOnDelivery ?? false,
    paymentMethod: payload.paymentMethod ?? (payload.isCashOnDelivery ? 'cod' : 'invoice'),
    senderAddress: buildFtAddress(payload.sender),
    receiverAddress: buildFtAddress(payload.receiver),
    shipmentPackages: payload.packages.map((p) => ({
      ...(p.boxName ? { boxName: p.boxName } : {}),
      weightInKg: p.weightInKg,
      lengthInCm: p.lengthInCm ?? 10,
      widthInCm: p.widthInCm ?? 10,
      heightInCm: p.heightInCm ?? 10,
      quantity: p.quantity ?? 1,
    })),
    shouldSaveRecipientAddress: false,
    shouldSaveSenderAddress: false,
  }
  if (payload.deliveryInstructions) body.deliveryInstructions = payload.deliveryInstructions
  if (payload.remarks) body.remarks = payload.remarks

  const res = await fetch(`${FLYINGTIGERS_BASE_URL}/api/shipments`, {
    method: 'POST',
    headers: getAuthHeaders(apiKey, apiSecret),
    body: JSON.stringify(body),
  })

  const data = await handleResponse<any>(res, 'create order')

  // Response field names per FT Business API (best effort across spellings).
  const trackingNo =
    data.tracking_no ?? data.tracking_number ?? data.trackingNumber ?? data.waybill_no ?? ''
  return {
    tracking_no: trackingNo,
    order_id: String(data.order_id ?? data.id ?? data.shipment_id ?? data.booking_id ?? ''),
    status: data.status ?? 'Pending Pickup',
    estimated_delivery: data.estimated_delivery ?? data.estimatedDelivery ?? '',
    tracking_url:
      data.tracking_url ??
      `https://www.flyingtigers.express/tracking?tracking_no=${trackingNo}`,
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
  apiSecret: string,
  trackingNo: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  // FT Business API: POST /api/shipments/{id}/cancel — {id} accepts the
  // tracking number or the numeric shipment id (matched case-insensitively).
  const res = await fetch(
    `${FLYINGTIGERS_BASE_URL}/api/shipments/${encodeURIComponent(trackingNo)}/cancel`,
    {
      method: 'POST',
      headers: getAuthHeaders(apiKey, apiSecret),
      body: JSON.stringify({ reason: reason ?? 'Cancelled by merchant' }),
    },
  )

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
  apiSecret: string,
  trackingNo: string
): Promise<Buffer> {
  // VERIFY: waybill endpoint path and response format (PDF buffer vs base64 string vs URL)
  const res = await fetch(`${FLYINGTIGERS_BASE_URL}/orders/${trackingNo}/label`, {
    headers: getAuthHeaders(apiKey, apiSecret),
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
  apiSecret: string,
  trackingNo: string
): Promise<{ status: string; events: any[] }> {
  const res = await fetch(
    `${FLYINGTIGERS_BASE_URL}/api/tracking/${encodeURIComponent(trackingNo)}`,
    { headers: getAuthHeaders(apiKey, apiSecret) },
  )
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
