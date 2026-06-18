/**
 * Vendor: request a new brand (pending admin approval).
 * Route: POST | GET /vendor/brands/request
 *
 * A request creates a brand row with is_active=false and requested_by=seller.
 * Admin approves it (is_active=true) on the Brands page; only active brands
 * appear in the seller brand picker (/vendor/brands).
 */

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { getPg, genId, slugify, getSellerId } from '../../../../lib/brand-db'

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope)
  const sellerId = await getSellerId(req.scope, (req as any).auth_context?.actor_id)
  if (!sellerId) return res.status(403).json({ message: 'Seller not found' })

  const requests = await pg('brand')
    .where({ requested_by: sellerId })
    .whereNull('deleted_at')
    .orderBy('created_at', 'desc')
    .select('id', 'name', 'logo_url', 'is_active', 'created_at')

  res.json({
    requests: requests.map((b: any) => ({
      ...b,
      status: b.is_active ? 'approved' : 'pending',
    })),
  })
}

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope)
  const sellerId = await getSellerId(req.scope, (req as any).auth_context?.actor_id)
  if (!sellerId) return res.status(403).json({ message: 'Seller not found' })

  const { name, logo_url } = req.body as { name?: string; logo_url?: string }
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Brand name is required' })
  }

  // If a brand with this name already exists, return it instead of duplicating.
  const existing = await pg('brand')
    .whereRaw('LOWER(name) = LOWER(?)', [name.trim()])
    .whereNull('deleted_at')
    .first()
  if (existing) {
    return res.json({
      brand: existing,
      status: existing.is_active ? 'approved' : 'pending',
      message: existing.is_active
        ? 'This brand already exists and is available to use.'
        : 'This brand has already been requested and is pending approval.',
    })
  }

  const id = genId('brand')
  await pg('brand').insert({
    id,
    name: name.trim(),
    slug: slugify(name),
    logo_url: logo_url ?? null,
    is_active: false,
    requested_by: sellerId,
  })
  const brand = await pg('brand').where({ id }).first()

  res.status(201).json({
    brand,
    status: 'pending',
    message: 'Brand requested. It will be available once an admin approves it.',
  })
}
