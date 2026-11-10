/**
 * Flying Tigers Express PH — API Service
 * Full order lifecycle: create, cancel, waybill, rate calculation.
 *
 * Follows the Business API docs at
 * https://backend-dot-flying-tigers-express-v2-prod.as.r.appspot.com/business-api-docs
 * (x-api-key + x-api-secret headers; /api/rates/quote, /api/shipments,
 * /api/shipments/{id}/cancel, /api/tracking/...). Each seller enters their own
 * key and secret. Sandbox keys from FT's Partner Portal use the same host and
 * create isolated test shipments with a "TEST-" tracking number.
 */

// Host root of the Flying Tigers Business API (no trailing slash, no path).
// All endpoints live under `${FLYINGTIGERS_BASE_URL}/api/...`. The default is
// the host the docs are served from, which answers the API.
export const FLYINGTIGERS_BASE_URL = (
  process.env.FLYINGTIGERS_BASE_URL || 'https://backend-dot-flying-tigers-express-v2-prod.as.r.appspot.com'
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

/** What a seller reads when Flying Tigers refuses a request: its reason, not its JSON. */
export function flyingTigersErrorMessage(context: string, status: number, body: any): string {
  const reason = Array.isArray(body?.message) ? body.message.join('; ') : body?.message
  return typeof reason === 'string' && reason.trim()
    ? `Flying Tigers couldn't ${context}: ${reason.trim()}`
    : `Flying Tigers couldn't ${context} (HTTP ${status})`
}

async function handleResponse<T>(res: Response, context: string): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }))
    console.error(`[FlyingTigers] ${context} failed (${res.status}):`, JSON.stringify(body))
    throw Object.assign(new Error(flyingTigersErrorMessage(context, res.status, body)), { status: res.status })
  }
  return res.json() as Promise<T>
}

// ─── Coverage ─────────────────────────────────────────────────────────────────

/** A province Flying Tigers picks up from and delivers to. */
export type FlyingTigersProvince = { provinceCode: string; provinceLabel: string }

// Buyers and sellers write Metro Manila several ways
const PROVINCE_ALIASES: Record<string, string> = {
  ncr: 'metro manila',
  'national capital region': 'metro manila',
  manila: 'metro manila',
}
const provinceKey = (name: string) => {
  const key = name.toLowerCase().replace(/\s+/g, ' ').trim().replace(/^province of /, '')
  return PROVINCE_ALIASES[key] ?? key
}

/** The covered province an address's province names, or null when Flying Tigers doesn't serve it. */
export function coveredProvince(
  name: string | undefined | null,
  covered: FlyingTigersProvince[]
): FlyingTigersProvince | null {
  if (!name?.trim()) return null
  const key = provinceKey(name)
  return covered.find((p) => provinceKey(p.provinceLabel) === key) ?? null
}

let coverageCache: { key: string; at: number; provinces: FlyingTigersProvince[] } | null = null
const COVERAGE_TTL_MS = 60 * 60 * 1000

/** The provinces Flying Tigers serves, from its API, kept for an hour. */
export async function getFlyingTigersCoveredProvinces(
  apiKey: string,
  apiSecret: string
): Promise<FlyingTigersProvince[]> {
  if (coverageCache && coverageCache.key === apiKey && Date.now() - coverageCache.at < COVERAGE_TTL_MS) {
    return coverageCache.provinces
  }
  const res = await fetch(`${FLYINGTIGERS_BASE_URL}/api/addresses/covered-provinces`, {
    headers: getAuthHeaders(apiKey, apiSecret),
  })
  const rows = await handleResponse<any[]>(res, 'list covered provinces')
  const provinces = (Array.isArray(rows) ? rows : [])
    .filter((r) => r?.provinceLabel)
    .map((r) => ({ provinceCode: String(r.provinceCode ?? ''), provinceLabel: String(r.provinceLabel) }))
  coverageCache = { key: apiKey, at: Date.now(), provinces }
  return provinces
}

// ─── Webhooks ─────────────────────────────────────────────────────────────────

/** Sandbox keys start fte_test_; anything else books real pickups. */
export const flyingTigersMode = (apiKey: unknown): 'sandbox' | 'live' =>
  typeof apiKey === 'string' && apiKey.trim().startsWith('fte_test_') ? 'sandbox' : 'live'

export type FlyingTigersWebhook = { id: number; url: string; mode: string; signingSecret?: string }

/**
 * Point Flying Tigers' shipment events at `url`. Replaces the business's
 * previous webhook for the same mode, and returns the signing secret, which
 * Flying Tigers only ever shows this once.
 */
export async function registerFlyingTigersWebhook(
  apiKey: string,
  apiSecret: string,
  url: string
): Promise<FlyingTigersWebhook> {
  const res = await fetch(`${FLYINGTIGERS_BASE_URL}/api/webhooks/register`, {
    method: 'POST',
    headers: getAuthHeaders(apiKey, apiSecret),
    body: JSON.stringify({ url, description: 'Maretinda shipment updates' }),
  })
  return handleResponse<FlyingTigersWebhook>(res, 'register the webhook')
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
  // FT Business API /api/rates/quote whitelists only a `packages` array; each
  // package uses camelCase dimension/weight fields. Flat snake_case fields
  // (origin_postal_code, weight, length, …) are rejected as "should not exist".
  const res = await fetch(`${FLYINGTIGERS_BASE_URL}/api/rates/quote`, {
    method: 'POST',
    headers: getAuthHeaders(apiKey, apiSecret),
    body: JSON.stringify({
      packages: [
        {
          weightInKg: request.weight_kg,
          lengthInCm: request.length_cm ?? 10,
          widthInCm: request.width_cm ?? 10,
          heightInCm: request.height_cm ?? 10,
          quantity: 1,
        },
      ],
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
    // FT only accepts deliveryType: "intra city" | "next day" | "same day".
    deliveryType: payload.deliveryType ?? 'next day',
    itemType: payload.itemType ?? 'Parcel',
    declaredValueInPesos: payload.declaredValueInPesos ?? 0,
    isCashOnDelivery: payload.isCashOnDelivery ?? false,
    // FT paymentMethod enum: bank transfer | cash | gcash | invoice | manual |
    // payment link | qr | wallet. There is no "cod" — COD is paid in cash.
    paymentMethod: payload.paymentMethod ?? (payload.isCashOnDelivery ? 'cash' : 'invoice'),
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
      // FT requires `reasonForCancellation` (a plain `reason` is rejected).
      body: JSON.stringify({ reasonForCancellation: reason ?? 'Cancelled by merchant' }),
    },
  )

  const data = await handleResponse<any>(res, 'cancel order')
  return {
    success: data.success ?? data.status === 'Cancelled',
    message: data.message ?? 'Order cancelled',
  }
}

// ─── Waybill / Label ──────────────────────────────────────────────────────────

/** Thrown when FT exposes no retrievable waybill — lets the route return 422. */
export class FlyingTigersWaybillUnavailable extends Error {}

/**
 * Pull a base64 document out of an FT JSON response (used when the air-waybill
 * endpoint returns JSON instead of a raw PDF stream — e.g. format=image, or a
 * wrapper carrying a base64/data-URI value under an unknown key).
 */
function extractBase64Document(obj: any, depth = 0): string | undefined {
  if (obj == null || depth > 5) return undefined
  if (typeof obj === 'string') {
    const dataUri = obj.match(/^data:[^;]+;base64,(.+)$/i)
    if (dataUri) return dataUri[1]
    const stripped = obj.replace(/\s+/g, '')
    if (/^[A-Za-z0-9+/=]+$/.test(stripped) && stripped.length > 200) return stripped
    return undefined
  }
  if (typeof obj !== 'object') return undefined
  // Prefer keys that hint at the document payload, then fall back to any value.
  const preferred = [
    'image', 'base64', 'pdf', 'file', 'content', 'document',
    'data', 'awb', 'airwaybill', 'air_waybill', 'airwaybillimage',
  ]
  for (const k of Object.keys(obj)) {
    if (preferred.includes(k.toLowerCase().replace(/[\s_-]/g, ''))) {
      const found = extractBase64Document(obj[k], depth + 1)
      if (found) return found
    }
  }
  for (const v of Object.values(obj)) {
    const found = extractBase64Document(v, depth + 1)
    if (found) return found
  }
  return undefined
}

/**
 * Retrieve the air waybill PDF for a tracking number.
 *
 * Flying Tigers exposes a dedicated endpoint:
 *   GET /api/tracking/{trackingNumber}/air-waybill?format=pdf
 * which streams a PDF by default (format=pdf), or returns JSON with a
 * base64-encoded image when format=image. We request the PDF and buffer it; if
 * FT instead replies with a JSON/base64 payload we decode that. A 404 (the AWB
 * isn't ready yet, or the shipment isn't ours) surfaces as
 * FlyingTigersWaybillUnavailable so the caller returns 422 with a clear message
 * rather than a raw 500.
 */
export async function getFlyingTigersWaybill(
  apiKey: string,
  apiSecret: string,
  trackingNo: string
): Promise<Buffer> {
  const res = await fetch(
    `${FLYINGTIGERS_BASE_URL}/api/tracking/${encodeURIComponent(trackingNo)}/air-waybill?format=pdf`,
    { headers: getAuthHeaders(apiKey, apiSecret) },
  )

  if (!res.ok) {
    if (res.status === 404) {
      throw new FlyingTigersWaybillUnavailable(
        `Flying Tigers has no air waybill for ${trackingNo} yet. It becomes available once the shipment is booked/accepted — try again shortly, or download it from the Flying Tigers portal.`,
      )
    }
    const body = await res.text().catch(() => res.statusText)
    throw new Error(`Flying Tigers air waybill failed (${res.status}): ${body}`)
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase()

  // Default (format=pdf) → binary PDF stream.
  if (contentType.includes('pdf') || contentType.includes('octet-stream')) {
    return Buffer.from(await res.arrayBuffer())
  }

  // Otherwise FT wrapped the document in JSON (or a raw base64 body) — decode it.
  const text = await res.text()
  let payload: any = text
  try {
    payload = JSON.parse(text)
  } catch {
    /* not JSON — treat as a raw (possibly base64) body below */
  }

  const b64 = extractBase64Document(payload)
  if (b64) return Buffer.from(b64, 'base64')

  throw new FlyingTigersWaybillUnavailable(
    `Flying Tigers returned an unexpected air waybill response for ${trackingNo}. Download it from the Flying Tigers portal (Tracking → ${trackingNo}).`,
  )
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
  // FT returns an array of tracking events (newest first); each event carries a
  // `status`. Older/other shapes may return an object with status/events.
  const events = Array.isArray(data) ? data : (data.events ?? data.tracking_events ?? [])
  const latestStatus = events[0]?.status ?? data.status ?? data.latest_status ?? 'unknown'
  return { status: latestStatus, events }
}

/**
 * Map a Flying Tigers status (a deliveryStatus such as "Package picked up", an
 * overall status such as "cancelled", or our own internal value) to a
 * Maretinda internal status. Null when it isn't one we know.
 */
export function mapFlyingTigersStatus(raw?: string): string | null {
  if (!raw) return null
  if (FT_STATUS_MAP[raw]) return FT_STATUS_MAP[raw]
  const lower = raw.trim().toLowerCase()
  const exact = Object.entries(FT_STATUS_MAP).find(([k]) => k.toLowerCase() === lower)
  if (exact) return exact[1]
  // Flying Tigers has many failure reasons; they all need the seller's attention
  if (/^(pick ?up|delivery) failed/.test(lower) || lower.startsWith('on hold')) return 'exception'
  const normalized = lower.replace(/\s+/g, '_')
  const KNOWN = [
    'pending', 'pending_pickup', 'pickup_dispatched', 'picked_up', 'in_transit',
    'out_for_delivery', 'delivered', 'exception', 'failed', 'returning', 'returned', 'cancelled',
  ]
  return KNOWN.includes(normalized) ? normalized : null
}

/**
 * Read a webhook delivery. Flying Tigers sends
 * { eventType, timestamp, data: { shipment: { trackingNumber, deliveryStatus, status } } };
 * the flat { tracking_no, event } shape is still accepted.
 */
export function parseFlyingTigersEvent(body: any): {
  trackingNo?: string
  event: string
  status: string | null
  timestamp: string
} {
  const shipment = body?.data?.shipment ?? {}
  const trackingNo =
    shipment.trackingNumber ?? body?.tracking_no ?? body?.tracking_number ?? body?.trackingNumber ?? body?.waybill_no
  const event = String(body?.eventType ?? body?.event ?? body?.event_type ?? body?.type ?? body?.status ?? '')
  const status =
    mapFlyingTigersStatus(shipment.deliveryStatus) ??
    mapFlyingTigersStatus(SHIPMENT_STATUS_MAP[String(shipment.status ?? '').toLowerCase()] ?? shipment.status) ??
    mapFlyingTigersStatus(body?.event ?? body?.event_type ?? body?.status)
  return {
    trackingNo: typeof trackingNo === 'string' && trackingNo ? trackingNo : undefined,
    event,
    status,
    timestamp: String(body?.timestamp ?? new Date().toISOString()),
  }
}

// How far along each status is; an update can't move a booking backwards
const STAGE: Record<string, number> = {
  pending: 0,
  pending_pickup: 0,
  pickup_dispatched: 1,
  exception: 1.5,
  picked_up: 2,
  in_transit: 3,
  out_for_delivery: 4,
  delivered: 5,
  returning: 6,
}
const FINAL = ['cancelled', 'returned', 'failed']

/**
 * The status a booking should take when an update arrives. Webhooks can come
 * late or out of order, so a cancelled or finished booking stays put and a
 * moving one never goes back (a late "Order placed" can't reopen it).
 */
export function nextShipmentStatus(current: string, incoming: string | null): string {
  if (!incoming || FINAL.includes(current)) return current
  if (incoming === 'cancelled' || FINAL.includes(incoming)) {
    return (STAGE[current] ?? 0) >= STAGE.delivered && incoming === 'cancelled' ? current : incoming
  }
  const from = STAGE[current] ?? 0
  // A failed pickup or delivery can happen at any point before delivery
  if (incoming === 'exception') return from < STAGE.delivered ? incoming : current
  const to = STAGE[incoming]
  return to === undefined || to < from ? current : incoming
}

/** Flying Tigers' overall shipment status, used when there's no deliveryStatus. */
const SHIPMENT_STATUS_MAP: Record<string, string> = {
  cancelled: 'cancelled',
  completed: 'delivered',
  lost: 'failed',
  'rts delivered': 'returned',
}

// ─── Webhook Status Map ───────────────────────────────────────────────────────

/**
 * Map Flying Tigers delivery statuses to Maretinda internal statuses. Checked
 * against Flying Tigers' API docs (Shipment.deliveryStatus) on 2026-11-11.
 */
export const FT_STATUS_MAP: Record<string, string> = {
  // Flying Tigers' documented deliveryStatus values
  'Order placed': 'pending_pickup',
  'Scheduled for Pickup': 'pending_pickup',
  'For pickup orig.': 'pickup_dispatched',
  'Package picked up': 'picked_up',
  'Orig. hub': 'in_transit',
  'At origin hub': 'in_transit',
  'Orig. port': 'in_transit',
  'Loaded for shipping': 'in_transit',
  'In-transit': 'in_transit',
  'Offloaded at the port': 'in_transit',
  'Dest. port': 'in_transit',
  'Arrived at destination port': 'in_transit',
  'Dest. hub': 'in_transit',
  'Arrived at destination hub': 'in_transit',
  'For pickup dest.': 'in_transit',
  'Scheduled for Delivery': 'out_for_delivery',
  'Rescheduled for delivery': 'out_for_delivery',
  'Out for delivery reattempt': 'out_for_delivery',
  'Order cancelled': 'cancelled',
  'Return to sender - initiated': 'returning',
  'Return to sender - in transit': 'returning',
  'Return to sender - delivered': 'returned',
  Lost: 'failed',
  // Earlier names, kept for deliveries already in flight
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
