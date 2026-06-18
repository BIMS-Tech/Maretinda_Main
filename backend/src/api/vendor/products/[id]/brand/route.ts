/**
 * Vendor: assign / unassign a brand on the seller's own product.
 * Route: POST | DELETE /vendor/products/:id/brand
 */

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { BRAND_MODULE } from '../../../../../modules/brand'
import { applyBrandToAlgolia } from '../../../../../lib/algolia-brand'

function getPg(req: AuthenticatedMedusaRequest): any {
  try {
    return req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  } catch {
    return (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
  }
}

/** Confirm the authenticated member's seller owns this product. */
async function assertOwnership(req: AuthenticatedMedusaRequest, productId: string): Promise<boolean> {
  const pg = getPg(req)
  const actorId = (req as any).auth_context?.actor_id
  if (!actorId) return false
  const member = await pg('member').where('id', actorId).first()
  if (!member?.seller_id) return false
  const link = await pg('seller_seller_product_product')
    .where({ seller_id: member.seller_id, product_id: productId })
    .whereNull('deleted_at')
    .first()
  return Boolean(link)
}

/** Current brand id linked to the product, if any. */
async function getCurrentBrandId(req: AuthenticatedMedusaRequest, productId: string): Promise<string | null> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: 'product',
    fields: ['id', 'brand.id'],
    filters: { id: productId },
  })
  return (data?.[0] as any)?.brand?.id ?? null
}

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const productId = req.params.id
  const { brand_id } = req.body as { brand_id?: string }
  if (!brand_id) return res.status(400).json({ message: 'brand_id is required' })

  if (!(await assertOwnership(req, productId))) {
    return res.status(403).json({ message: 'You do not own this product' })
  }

  const brandService: any = req.scope.resolve(BRAND_MODULE)
  const brand = await brandService.retrieveBrand(brand_id).catch(() => null)
  if (!brand) return res.status(404).json({ message: 'Brand not found' })

  const link = req.scope.resolve(ContainerRegistrationKeys.REMOTE_LINK)
  const current = await getCurrentBrandId(req, productId)

  if (current && current !== brand_id) {
    await link.dismiss({
      [Modules.PRODUCT]: { product_id: productId },
      [BRAND_MODULE]: { brand_id: current },
    })
  }
  if (current !== brand_id) {
    await link.create({
      [Modules.PRODUCT]: { product_id: productId },
      [BRAND_MODULE]: { brand_id },
    })
  }

  await applyBrandToAlgolia(req.scope, [productId]).catch(() => undefined)

  res.json({ success: true, product_id: productId, brand })
}

export const DELETE = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const productId = req.params.id

  if (!(await assertOwnership(req, productId))) {
    return res.status(403).json({ message: 'You do not own this product' })
  }

  const current = await getCurrentBrandId(req, productId)
  if (current) {
    const link = req.scope.resolve(ContainerRegistrationKeys.REMOTE_LINK)
    await link.dismiss({
      [Modules.PRODUCT]: { product_id: productId },
      [BRAND_MODULE]: { brand_id: current },
    })
  }

  await applyBrandToAlgolia(req.scope, [productId]).catch(() => undefined)

  res.json({ success: true, product_id: productId, brand: null })
}
