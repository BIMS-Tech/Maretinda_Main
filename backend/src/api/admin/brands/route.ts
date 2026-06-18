/**
 * Admin Brand Catalog
 * Route: /admin/brands
 *
 * Admin curates the platform brand list. Sellers pick from these when
 * assigning a brand to their products.
 */

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { BRAND_MODULE } from '../../../modules/brand'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const brandService: any = req.scope.resolve(BRAND_MODULE)
  const { q, limit = '100', offset = '0' } = req.query as Record<string, string>

  const filters: Record<string, unknown> = {}
  if (q) filters.name = { $ilike: `%${q}%` }

  const [brands, count] = await brandService.listAndCountBrands(filters, {
    take: parseInt(limit),
    skip: parseInt(offset),
    order: { name: 'ASC' },
  })

  res.json({ brands, count, offset: parseInt(offset), limit: parseInt(limit) })
}

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const brandService: any = req.scope.resolve(BRAND_MODULE)
  const { name, logo_url, description, is_active } = req.body as {
    name?: string
    logo_url?: string
    description?: string
    is_active?: boolean
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Brand name is required' })
  }

  const brand = await brandService.createBrands({
    name: name.trim(),
    slug: slugify(name),
    logo_url: logo_url ?? null,
    description: description ?? null,
    is_active: is_active ?? true,
  })

  res.status(201).json({ brand })
}
