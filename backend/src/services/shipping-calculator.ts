/**
 * Centralized Shipping Rate Calculator
 *
 * Fetches rates from all active platform providers (NinjaVan, Flying Tigers, etc.),
 * caches results for 10 minutes, and provides AI-assisted carrier recommendation
 * based on cost, speed, and parcel characteristics.
 */

import { getFlyingTigersRates, FlyingTigersRate } from './flyingtigers'
import { getNinjaVanToken } from './ninjavan'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShippingParcel = {
  weight_kg: number
  length_cm?: number
  width_cm?: number
  height_cm?: number
  declared_value?: number
  is_cod?: boolean
  cod_amount?: number
}

export type ShippingAddress = {
  postal_code: string
  city: string
  province?: string
  country?: string
}

export type CarrierRate = {
  provider_id: string
  provider_name: string
  service_type: string
  service_label: string
  rate: number
  currency: string
  estimated_days: number
  estimated_delivery: string
  supports_cod: boolean
  is_recommended: boolean
  recommendation_reason?: string
}

export type RateCalculationResult = {
  rates: CarrierRate[]
  recommended: CarrierRate | null
  parcel: ShippingParcel
  origin_postal: string
  dest_postal: string
  calculated_at: string
}

// ─── Cache Key ────────────────────────────────────────────────────────────────

function buildCacheKey(
  origin_postal: string,
  dest_postal: string,
  parcel: ShippingParcel
): string {
  const parcelKey = `${parcel.weight_kg}:${parcel.length_cm ?? 0}:${parcel.width_cm ?? 0}:${parcel.height_cm ?? 0}`
  return `${origin_postal}|${dest_postal}|${parcelKey}`
}

// ─── NinjaVan Rate Calculation ────────────────────────────────────────────────

/**
 * NinjaVan does not have a public rate API — pricing is pre-negotiated and set as
 * flat shipping options in Medusa. We return the configured flat options instead.
 * If NinjaVan opens a rate API, implement it here.
 *
 * For now, we return static tier-based rates based on weight.
 */
function getNinjaVanEstimatedRates(parcel: ShippingParcel): CarrierRate[] {
  const weight = parcel.weight_kg
  let standardRate: number
  let expressRate: number

  // Weight-based tiered pricing (adjust these with your NinjaVan contract rates)
  if (weight <= 0.5) { standardRate = 85; expressRate = 120 }
  else if (weight <= 1) { standardRate = 100; expressRate = 145 }
  else if (weight <= 3) { standardRate = 130; expressRate = 185 }
  else if (weight <= 5) { standardRate = 180; expressRate = 250 }
  else { standardRate = 180 + Math.ceil((weight - 5) * 20); expressRate = 250 + Math.ceil((weight - 5) * 30) }

  return [
    {
      provider_id: 'ninjavan',
      provider_name: 'Ninja Van',
      service_type: 'Standard',
      service_label: 'Ninja Van Standard (2–5 days)',
      rate: standardRate,
      currency: 'PHP',
      estimated_days: 3,
      estimated_delivery: getEstimatedDeliveryDate(3),
      supports_cod: false,
      is_recommended: false,
    },
    {
      provider_id: 'ninjavan',
      provider_name: 'Ninja Van',
      service_type: 'Express',
      service_label: 'Ninja Van Express (1–2 days)',
      rate: expressRate,
      currency: 'PHP',
      estimated_days: 1,
      estimated_delivery: getEstimatedDeliveryDate(1),
      supports_cod: false,
      is_recommended: false,
    },
  ]
}

// ─── Flying Tigers Rate Calculation ──────────────────────────────────────────

async function getFlyingTigersCarrierRates(
  creds: { api_key: string; merchant_code: string },
  origin_postal: string,
  dest_postal: string,
  parcel: ShippingParcel
): Promise<CarrierRate[]> {
  try {
    const rates = await getFlyingTigersRates(creds.api_key, creds.merchant_code, {
      origin_postal,
      dest_postal,
      weight_kg: parcel.weight_kg,
      length_cm: parcel.length_cm,
      width_cm: parcel.width_cm,
      height_cm: parcel.height_cm,
      declared_value: parcel.declared_value,
    })

    return rates.map((r: FlyingTigersRate) => ({
      provider_id: 'flyingtigers',
      provider_name: 'Flying Tigers Express',
      service_type: r.service_type,
      service_label: `Flying Tigers ${r.service_type} (${r.estimated_days} day${r.estimated_days > 1 ? 's' : ''})`,
      rate: r.rate,
      currency: r.currency,
      estimated_days: r.estimated_days,
      estimated_delivery: r.estimated_delivery || getEstimatedDeliveryDate(r.estimated_days),
      supports_cod: true, // Flying Tigers supports COD
      is_recommended: false,
    }))
  } catch (err) {
    console.error('[ShippingCalculator] Flying Tigers rate fetch failed:', err)
    return []
  }
}

// ─── AI Carrier Recommendation ────────────────────────────────────────────────

/**
 * Smart carrier selection algorithm.
 * Considers: cost, speed, COD requirement, parcel weight, provider reliability.
 *
 * Priority order:
 *   1. If COD required → only carriers that support COD
 *   2. If urgent (same/next day needed) → fastest available
 *   3. Default: best value (lowest cost × speed score)
 */
function selectRecommendedCarrier(
  rates: CarrierRate[],
  parcel: ShippingParcel
): CarrierRate | null {
  if (!rates.length) return null

  let candidates = [...rates]

  // Filter by COD support if required
  if (parcel.is_cod) {
    const codCandidates = candidates.filter((r) => r.supports_cod)
    if (codCandidates.length > 0) candidates = codCandidates
  }

  // Score each option: lower score = better
  // Score = (cost_weight × normalized_rate) + (speed_weight × estimated_days)
  const maxRate = Math.max(...candidates.map((r) => r.rate)) || 1
  const maxDays = Math.max(...candidates.map((r) => r.estimated_days)) || 1

  const COST_WEIGHT = 0.6
  const SPEED_WEIGHT = 0.4

  const scored = candidates.map((r) => ({
    ...r,
    score: COST_WEIGHT * (r.rate / maxRate) + SPEED_WEIGHT * (r.estimated_days / maxDays),
  }))

  scored.sort((a, b) => a.score - b.score)
  const best = scored[0]

  // Build recommendation reason
  let reason = ''
  const cheapest = [...candidates].sort((a, b) => a.rate - b.rate)[0]
  const fastest = [...candidates].sort((a, b) => a.estimated_days - b.estimated_days)[0]

  if (best.provider_id === cheapest.provider_id && best.service_type === cheapest.service_type
    && best.provider_id === fastest.provider_id && best.service_type === fastest.service_type) {
    reason = 'Cheapest and fastest option'
  } else if (best.provider_id === cheapest.provider_id && best.service_type === cheapest.service_type) {
    reason = `Best price at ₱${best.rate}`
  } else if (best.provider_id === fastest.provider_id && best.service_type === fastest.service_type) {
    reason = `Fastest delivery in ${best.estimated_days} day${best.estimated_days > 1 ? 's' : ''}`
  } else {
    reason = `Best balance of price (₱${best.rate}) and speed (${best.estimated_days}d)`
  }

  if (parcel.is_cod) reason += ' · COD available'

  return { ...best, is_recommended: true, recommendation_reason: reason }
}

// ─── Main Rate Calculation ────────────────────────────────────────────────────

export async function calculateShippingRates(
  pg: any,
  origin_postal: string,
  dest_postal: string,
  parcel: ShippingParcel
): Promise<RateCalculationResult> {
  const cacheKey = buildCacheKey(origin_postal, dest_postal, parcel)

  // Check cache (10-minute TTL)
  const cached = await pg('shipping_rate_cache')
    .where({ cache_key: cacheKey })
    .where('expires_at', '>', new Date())
    .first()

  if (cached) {
    return {
      rates: cached.rates as CarrierRate[],
      recommended: (cached.rates as CarrierRate[]).find((r) => r.is_recommended) ?? null,
      parcel,
      origin_postal,
      dest_postal,
      calculated_at: cached.created_at,
    }
  }

  // Load all active platform providers
  const providers = await pg('platform_shipping_provider')
    .where({ is_active: true })
    .whereNull('deleted_at')

  const allRates: CarrierRate[] = []

  for (const provider of providers) {
    const creds = provider.credentials as Record<string, any>

    if (provider.provider_id === 'ninjavan') {
      // NinjaVan: use weight-based tiered rates (no public rate API)
      allRates.push(...getNinjaVanEstimatedRates(parcel))
    }

    if (provider.provider_id === 'flyingtigers' && creds.api_key && creds.merchant_code) {
      const ftRates = await getFlyingTigersCarrierRates(
        { api_key: creds.api_key, merchant_code: creds.merchant_code },
        origin_postal,
        dest_postal,
        parcel
      )
      allRates.push(...ftRates)
    }
  }

  // Apply recommendation
  const recommended = selectRecommendedCarrier(allRates, parcel)
  const ratesWithRec = allRates.map((r) =>
    recommended && r.provider_id === recommended.provider_id && r.service_type === recommended.service_type
      ? { ...r, is_recommended: true, recommendation_reason: recommended.recommendation_reason }
      : r
  )

  // Cache result
  const cacheId = `src_${Date.now()}`
  await pg('shipping_rate_cache')
    .insert({
      id: cacheId,
      cache_key: cacheKey,
      provider_id: 'multi',
      origin_postal,
      dest_postal,
      weight_kg: parcel.weight_kg,
      rates: JSON.stringify(ratesWithRec),
      expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    })
    .onConflict('cache_key')
    .merge(['rates', 'expires_at'])

  return {
    rates: ratesWithRec,
    recommended: ratesWithRec.find((r) => r.is_recommended) ?? null,
    parcel,
    origin_postal,
    dest_postal,
    calculated_at: new Date().toISOString(),
  }
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function getEstimatedDeliveryDate(days: number): string {
  const d = new Date()
  let added = 0
  while (added < days) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0) added++ // Skip Sundays
  }
  return d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })
}

// ─── Volumetric Weight ────────────────────────────────────────────────────────

/**
 * Standard volumetric weight formula (DIM weight).
 * Carriers charge whichever is higher: actual vs volumetric.
 * Divisor 5000 is standard for most Philippine couriers.
 */
export function getChargeableWeight(parcel: ShippingParcel): number {
  const actual = parcel.weight_kg
  if (!parcel.length_cm || !parcel.width_cm || !parcel.height_cm) return actual
  const volumetric = (parcel.length_cm * parcel.width_cm * parcel.height_cm) / 5000
  return Math.max(actual, volumetric)
}
