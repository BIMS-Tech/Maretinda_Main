/**
 * Vendor Shipping Rate Estimator
 * GET /vendor/shipping-rates
 *
 * Returns estimated courier costs (per active carrier + service level) for a
 * parcel, so sellers can see what they'll be charged before booking and compare
 * it against what the customer paid for shipping — i.e. work out their margin.
 *
 * Query: origin_postal, dest_postal, weight_kg (required),
 *        length_cm, width_cm, height_cm, is_cod
 */

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import {
  calculateShippingRates,
  getChargeableWeight,
  ShippingParcel,
} from '../../../services/shipping-calculator'

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

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  try {
    const pg = getPgConnection(req)
    const sellerId = await getSellerId(req, pg)
    if (!sellerId) return res.status(403).json({ message: 'Seller not found' })

    const {
      origin_postal = '',
      dest_postal = '',
      weight_kg,
      length_cm,
      width_cm,
      height_cm,
      is_cod,
    } = req.query as Record<string, string>

    const weight = parseFloat(weight_kg)
    if (!weight || weight <= 0) {
      return res.status(400).json({ message: 'weight_kg is required and must be > 0' })
    }

    const num = (v?: string) => {
      if (v === undefined || v === '') return undefined
      const n = parseFloat(v)
      return Number.isNaN(n) ? undefined : n
    }

    const parcel: ShippingParcel = {
      weight_kg: weight,
      length_cm: num(length_cm),
      width_cm: num(width_cm),
      height_cm: num(height_cm),
      is_cod: is_cod === 'true',
    }

    // Carriers bill on chargeable weight (higher of actual vs volumetric).
    const chargeableParcel: ShippingParcel = {
      ...parcel,
      weight_kg: getChargeableWeight(parcel),
    }

    const result = await calculateShippingRates(pg, origin_postal, dest_postal, chargeableParcel)

    res.json({
      ...result,
      chargeable_weight_kg: chargeableParcel.weight_kg,
      actual_weight_kg: parcel.weight_kg,
    })
  } catch (error) {
    console.error('[Vendor Shipping Rates]', error)
    res.status(500).json({ message: (error as Error).message || 'Failed to calculate shipping rates' })
  }
}
