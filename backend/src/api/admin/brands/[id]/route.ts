/**
 * Admin Brand detail
 * Route: /admin/brands/:id  (GET, POST update, DELETE)
 */

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { getPg } from '../../../../lib/brand-db'

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope)
  const brand = await pg('brand').where({ id: req.params.id }).whereNull('deleted_at').first()
  if (!brand) return res.status(404).json({ message: 'Brand not found' })
  res.json({ brand })
}

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope)
  const { name, logo_url, description, is_active } = req.body as {
    name?: string
    logo_url?: string
    description?: string
    is_active?: boolean
  }

  const update: Record<string, unknown> = { updated_at: new Date() }
  if (name !== undefined) update.name = name
  if (logo_url !== undefined) update.logo_url = logo_url
  if (description !== undefined) update.description = description
  if (is_active !== undefined) update.is_active = is_active

  await pg('brand').where({ id: req.params.id }).update(update)
  const brand = await pg('brand').where({ id: req.params.id }).first()
  res.json({ brand })
}

export const DELETE = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const pg = getPg(req.scope)
  await pg('brand').where({ id: req.params.id }).update({ deleted_at: new Date() })
  // also drop any product links to this brand
  await pg('product_brand').where({ brand_id: req.params.id }).whereNull('deleted_at').del()
  res.json({ id: req.params.id, object: 'brand', deleted: true })
}
