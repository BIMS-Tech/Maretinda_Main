/**
 * Ninja Van API Service
 * Handles OAuth token caching, order creation, waybill, and cancellation.
 * Docs: https://api-docs.ninjavan.co/en
 */

const NINJAVAN_SANDBOX_BASE = 'https://api-sandbox.ninjavan.co'
const NINJAVAN_PROD_BASE = 'https://api.ninjavan.co'

type TokenCache = {
  accessToken: string
  expiresAt: number
}

// In-process token cache: key = `${clientId}:${countryCode}`
const tokenCache = new Map<string, TokenCache>()

function getBaseUrl(sandbox: boolean): string {
  return sandbox ? NINJAVAN_SANDBOX_BASE : NINJAVAN_PROD_BASE
}

/**
 * Get a cached or freshly-issued OAuth access token for a Ninja Van account.
 */
export async function getNinjaVanToken(
  clientId: string,
  clientSecret: string,
  countryCode: string,
  sandbox = false
): Promise<string> {
  const cacheKey = `${clientId}:${countryCode}:${sandbox ? 'sb' : 'prod'}`
  const cached = tokenCache.get(cacheKey)

  // Refresh 5 minutes before expiry
  if (cached && cached.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cached.accessToken
  }

  const base = getBaseUrl(sandbox)
  // Sandbox always uses /sg, production uses the real country
  const country = sandbox ? 'SG' : countryCode.toUpperCase()

  const res = await fetch(`${base}/${country}/2.0/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Ninja Van OAuth failed (${res.status}): ${JSON.stringify(err)}`)
  }

  const data: { access_token: string; expires_in: number } = await res.json()
  const expiresAt = Date.now() + data.expires_in * 1000

  tokenCache.set(cacheKey, { accessToken: data.access_token, expiresAt })
  return data.access_token
}

/**
 * Create a Ninja Van delivery order.
 */
export async function createNinjaVanOrder(
  token: string,
  countryCode: string,
  orderPayload: Record<string, unknown>,
  sandbox = false
): Promise<Record<string, unknown>> {
  const base = getBaseUrl(sandbox)
  const country = sandbox ? 'SG' : countryCode.toUpperCase()

  const res = await fetch(`${base}/${country}/4.2/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orderPayload),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Ninja Van create order failed (${res.status}): ${JSON.stringify(err)}`)
  }

  return res.json()
}

/**
 * Cancel a Ninja Van order. Only Pending Pickup orders can be cancelled.
 */
export async function cancelNinjaVanOrder(
  token: string,
  countryCode: string,
  trackingNumber: string,
  sandbox = false
): Promise<Record<string, unknown>> {
  const base = getBaseUrl(sandbox)
  const country = sandbox ? 'SG' : countryCode.toUpperCase()

  const res = await fetch(`${base}/${country}/2.2/orders/${trackingNumber}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Ninja Van cancel order failed (${res.status}): ${JSON.stringify(err)}`)
  }

  return res.json()
}

/**
 * Generate a waybill PDF for a given tracking number.
 * Returns the raw PDF buffer.
 */
export async function getNinjaVanWaybill(
  token: string,
  countryCode: string,
  trackingNumber: string,
  sandbox = false
): Promise<Buffer> {
  const base = getBaseUrl(sandbox)
  const country = sandbox ? 'SG' : countryCode.toUpperCase()

  const params = new URLSearchParams({ tid: trackingNumber, hide_shipper_details: 'false' })
  const res = await fetch(`${base}/${country}/2.0/reports/waybill?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Ninja Van waybill failed (${res.status}): ${err}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Build the Ninja Van order payload from Maretinda order/shipping data.
 */
export function buildNinjaVanOrderPayload(params: {
  requestedTrackingNumber?: string
  merchantOrderNumber: string
  from: {
    name: string
    phone: string
    email?: string
    address1: string
    address2?: string
    city: string
    state?: string
    postcode: string
    country: string
  }
  to: {
    name: string
    phone: string
    email?: string
    address1: string
    address2?: string
    city: string
    state?: string
    postcode: string
    country: string
  }
  parcel: {
    weightKg: number
    lengthCm?: number
    widthCm?: number
    heightCm?: number
    description?: string
  }
  pickupDate: string // YYYY-MM-DD
  serviceLevel?: 'Standard' | 'Express' | 'Sameday' | 'Nextday'
}): Record<string, unknown> {
  return {
    service_type: 'Parcel',
    service_level: params.serviceLevel ?? 'Standard',
    ...(params.requestedTrackingNumber && {
      requested_tracking_number: params.requestedTrackingNumber,
    }),
    reference: { merchant_order_number: params.merchantOrderNumber },
    from: {
      name: params.from.name,
      phone_number: params.from.phone,
      ...(params.from.email && { email: params.from.email }),
      address: {
        address1: params.from.address1,
        ...(params.from.address2 && { address2: params.from.address2 }),
        city: params.from.city,
        ...(params.from.state && { state: params.from.state }),
        postcode: params.from.postcode,
        country: params.from.country,
      },
    },
    to: {
      name: params.to.name,
      phone_number: params.to.phone,
      ...(params.to.email && { email: params.to.email }),
      address: {
        address1: params.to.address1,
        ...(params.to.address2 && { address2: params.to.address2 }),
        city: params.to.city,
        ...(params.to.state && { state: params.to.state }),
        postcode: params.to.postcode,
        country: params.to.country,
      },
    },
    parcel_job: {
      is_pickup_required: true,
      pickup_service_type: 'Scheduled',
      pickup_service_level: 'Standard',
      pickup_date: params.pickupDate,
      pickup_timeslot: { start_time: '09:00', end_time: '18:00', timezone: 'Asia/Manila' },
      dimensions: {
        weight: params.parcel.weightKg,
        ...(params.parcel.lengthCm && { length: params.parcel.lengthCm }),
        ...(params.parcel.widthCm && { width: params.parcel.widthCm }),
        ...(params.parcel.heightCm && { height: params.parcel.heightCm }),
      },
      items: [
        {
          item_description: params.parcel.description ?? 'Parcel',
          quantity: 1,
          is_dangerous_good: false,
        },
      ],
    },
  }
}
