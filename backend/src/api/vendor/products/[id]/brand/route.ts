/**
 * Vendor: read / assign / unassign a brand on the seller's own product.
 * Route: GET | POST | DELETE /vendor/products/:id/brand
 *
 * Raw-pg backed (brand, product_brand) — same approach as the shipping tables.
 */

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import {
  getPg,
  getSellerId,
  sellerOwnsProduct,
  getProductBrand,
  setProductBrand,
  clearProductBrand,
} from '../../../../../lib/brand-db'
import { applyBrandToAlgolia } from '../../../../../lib/algolia-brand'

async function ensureOwnership(req: AuthenticatedMedusaRequest, productId: string): Promise<boolean> {
  const sellerId = await getSellerId(req.scope, (req as any).auth_context?.actor_id)
  if (!sellerId) return false
  return sellerOwnsProduct(req.scope, sellerId, productId)
}

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const productId = req.params.id
  if (!(await ensureOwnership(req, productId))) {
    return res.status(403).json({ message: 'You do not own this product' })
  }
  const brand = await getProductBrand(req.scope, productId)
  res.json({ brand })
}

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const productId = req.params.id
  const { brand_id } = req.body as { brand_id?: string }
  if (!brand_id) return res.status(400).json({ message: 'brand_id is required' })

  if (!(await ensureOwnership(req, productId))) {
    return res.status(403).json({ message: 'You do not own this product' })
  }

  const pg = getPg(req.scope)
  const brand = await pg('brand').where({ id: brand_id }).whereNull('deleted_at').first()
  if (!brand) return res.status(404).json({ message: 'Brand not found' })

  await setProductBrand(req.scope, productId, brand_id)
  await applyBrandToAlgolia(req.scope, [productId]).catch(() => undefined)

  res.json({ success: true, product_id: productId, brand })
}

export const DELETE = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const productId = req.params.id
  if (!(await ensureOwnership(req, productId))) {
    return res.status(403).json({ message: 'You do not own this product' })
  }

  await clearProductBrand(req.scope, productId)
  await applyBrandToAlgolia(req.scope, [productId]).catch(() => undefined)

  res.json({ success: true, product_id: productId, brand: null })
}
