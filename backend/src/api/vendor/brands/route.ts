/**
 * Vendor Brands (read-only)
 * Route: /vendor/brands
 *
 * Sellers pick from the admin-curated brand catalog when assigning a brand
 * to their products.
 */

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { BRAND_MODULE } from '../../../modules/brand'

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const brandService: any = req.scope.resolve(BRAND_MODULE)
  const { q, limit = '200', offset = '0' } = req.query as Record<string, string>

  const filters: Record<string, unknown> = { is_active: true }
  if (q) filters.name = { $ilike: `%${q}%` }

  const [brands, count] = await brandService.listAndCountBrands(filters, {
    take: parseInt(limit),
    skip: parseInt(offset),
    order: { name: 'ASC' },
  })

  res.json({ brands, count })
}
