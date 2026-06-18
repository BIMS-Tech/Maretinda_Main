/**
 * Vendor Brands (read-only)
 * Route: /vendor/brands
 *
 * Sellers pick from the admin-curated, active brand catalog.
 */

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { getPg } from '../../../lib/brand-db'

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope)
  const { q, limit = '200', offset = '0' } = req.query as Record<string, string>

  const base = pg('brand').whereNull('deleted_at').where('is_active', true)
  if (q) base.andWhereILike('name', `%${q}%`)

  const brands = await base
    .clone()
    .orderBy('name', 'asc')
    .limit(parseInt(limit))
    .offset(parseInt(offset))
  const [{ count }] = await base.clone().count('id as count')

  res.json({ brands, count: parseInt(String(count)) })
}
