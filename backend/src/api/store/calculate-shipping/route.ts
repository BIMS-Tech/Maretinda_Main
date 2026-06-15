/**
 * Public Shipping Rate Calculator
 * POST /store/calculate-shipping
 *
 * Called by the storefront at checkout to show customers real-time
 * shipping rates from all active platform carriers.
 *
 * Input:  origin postal, destination postal, parcel weight/dimensions
 * Output: rates from all active carriers + AI recommendation
 */

import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { calculateShippingRates, getChargeableWeight, ShippingParcel } from '../../../services/shipping-calculator'

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    let pg: any
    try {
      pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch {
      pg = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    const { origin_postal, dest_postal, parcel } = req.body as {
      origin_postal: string
      dest_postal: string
      parcel: ShippingParcel
    }

    if (!origin_postal || !dest_postal) {
      return res.status(400).json({ message: 'origin_postal and dest_postal are required' })
    }

    if (!parcel?.weight_kg || parcel.weight_kg <= 0) {
      return res.status(400).json({ message: 'parcel.weight_kg is required and must be > 0' })
    }

    // Use chargeable weight (higher of actual vs volumetric)
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
    console.error('[Calculate Shipping]', error)
    res.status(500).json({ message: (error as Error).message || 'Failed to calculate shipping rates' })
  }
}

// Also expose as GET for simple weight-only rate estimates
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    let pg: any
    try {
      pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch {
      pg = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    const { origin_postal, dest_postal, weight_kg } = req.query as Record<string, string>

    if (!origin_postal || !dest_postal || !weight_kg) {
      return res.status(400).json({ message: 'origin_postal, dest_postal, and weight_kg are required' })
    }

    const parcel: ShippingParcel = { weight_kg: parseFloat(weight_kg) }
    const result = await calculateShippingRates(pg, origin_postal, dest_postal, parcel)

    res.json(result)
  } catch (error) {
    console.error('[Calculate Shipping GET]', error)
    res.status(500).json({ message: (error as Error).message || 'Failed to calculate shipping rates' })
  }
}
