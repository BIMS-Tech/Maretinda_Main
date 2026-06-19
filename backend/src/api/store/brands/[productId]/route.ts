/**
 * Store: get the (active) brand assigned to a product.
 * Route: GET /store/brands/:productId
 */

import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

function getPg(req: MedusaRequest): any {
  try {
    return req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  } catch {
    return (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
  }
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const pg = getPg(req)
    const brand = await pg('product_brand as pb')
      .join('brand as b', 'b.id', 'pb.brand_id')
      .where('pb.product_id', req.params.productId)
      .whereNull('pb.deleted_at')
      .whereNull('b.deleted_at')
      .where('b.is_active', true)
      .select('b.id', 'b.name', 'b.slug', 'b.logo_url')
      .first()
    res.json({ brand: brand ?? null })
  } catch {
    res.json({ brand: null })
  }
}
