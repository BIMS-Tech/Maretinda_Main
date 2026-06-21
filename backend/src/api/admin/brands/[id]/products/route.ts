/**
 * Admin: products assigned to a brand.
 * Route: /admin/brands/:id/products  (GET list, POST add/remove)
 *
 * Raw-pg backed (brand, product_brand) — mirrors the seller assign route, so
 * admins can curate a brand's products the way collections manage theirs.
 */

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { listBrandProducts, setProductBrand, clearProductBrand } from '../../../../../lib/brand-db'
import { applyBrandToAlgolia } from '../../../../../lib/algolia-brand'

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const { q, limit = '50', offset = '0' } = req.query as Record<string, string>
  const { products, count } = await listBrandProducts(req.scope, req.params.id, {
    q,
    limit: parseInt(limit),
    offset: parseInt(offset),
  })
  res.json({ products, count, offset: parseInt(offset), limit: parseInt(limit) })
}

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const brandId = req.params.id
  const { add = [], remove = [] } = req.body as { add?: string[]; remove?: string[] }

  for (const productId of add) {
    await setProductBrand(req.scope, productId, brandId)
  }
  for (const productId of remove) {
    await clearProductBrand(req.scope, productId)
  }

  const affected = [...add, ...remove]
  if (affected.length) {
    await applyBrandToAlgolia(req.scope, affected).catch(() => undefined)
  }

  res.json({ success: true, added: add.length, removed: remove.length })
}
