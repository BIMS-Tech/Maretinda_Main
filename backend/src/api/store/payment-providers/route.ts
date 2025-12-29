import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const region_id = req.query.region_id as string | undefined

  if (!region_id) {
    console.log('[Payment Providers] No region_id provided')
    return res.json({
      payment_providers: []
    })
  }

  try {
    console.log('[Payment Providers] Fetching payment providers for region:', region_id)

    // Query the database directly for the region-payment provider links
    const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    
    const result = await pgConnection.raw(`
      SELECT pp.id, pp.is_enabled
      FROM payment_provider pp
      INNER JOIN region_payment_provider rpp ON pp.id = rpp.payment_provider_id
      WHERE rpp.region_id = ?
      AND pp.is_enabled = true
    `, [region_id])

    const providers = result.rows || []

    console.log('[Payment Providers] Found providers from DB:', providers.map((p: any) => ({ 
      id: p.id, 
      is_enabled: p.is_enabled 
    })))

    console.log('[Payment Providers] Returning providers:', providers.map((p: any) => p.id))

    res.json({
      payment_providers: providers
    })
  } catch (error) {
    console.error('[Payment Providers] Error getting providers:', error)
    res.json({
      payment_providers: []
    })
  }
}
