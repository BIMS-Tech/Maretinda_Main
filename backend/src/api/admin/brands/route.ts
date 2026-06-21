/**
 * Admin Brand Catalog
 * Route: /admin/brands  (GET list, POST create)
 *
 * Raw-pg backed (tables: brand, product_brand) — same approach as the
 * shipping tables, so it works without module migrations.
 */

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { getPg, genId, slugify } from '../../../lib/brand-db'

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope)
  const { q, limit = '100', offset = '0' } = req.query as Record<string, string>

  const base = pg('brand as b').whereNull('b.deleted_at')
  if (q) base.andWhereILike('b.name', `%${q}%`)

  const brands = await base
    .clone()
    .leftJoin('product_brand as pb', function (this: any) {
      this.on('pb.brand_id', 'b.id').andOnNull('pb.deleted_at')
    })
    .groupBy('b.id')
    .orderBy('b.name', 'asc')
    .limit(parseInt(limit))
    .offset(parseInt(offset))
    .select('b.*')
    .count('pb.id as product_count')
  // knex returns count as string; normalize to number
  for (const b of brands) {
    b.product_count = parseInt(String(b.product_count ?? 0))
  }
  const [{ count }] = await base.clone().count('b.id as count')

  res.json({ brands, count: parseInt(String(count)), offset: parseInt(offset), limit: parseInt(limit) })
}

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope)
  const { name, logo_url, description, is_active } = req.body as {
    name?: string
    logo_url?: string
    description?: string
    is_active?: boolean
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Brand name is required' })
  }

  const id = genId('brand')
  await pg('brand').insert({
    id,
    name: name.trim(),
    slug: slugify(name),
    logo_url: logo_url ?? null,
    description: description ?? null,
    is_active: is_active ?? true,
  })
  const brand = await pg('brand').where({ id }).first()
  res.status(201).json({ brand })
}
