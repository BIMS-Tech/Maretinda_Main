/**
 * Admin Brand detail
 * Route: /admin/brands/:id  (GET update via POST, DELETE)
 */

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { BRAND_MODULE } from '../../../../modules/brand'

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const brandService: any = req.scope.resolve(BRAND_MODULE)
  const brand = await brandService.retrieveBrand(req.params.id).catch(() => null)
  if (!brand) return res.status(404).json({ message: 'Brand not found' })
  res.json({ brand })
}

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const brandService: any = req.scope.resolve(BRAND_MODULE)
  const { name, logo_url, description, is_active } = req.body as {
    name?: string
    logo_url?: string
    description?: string
    is_active?: boolean
  }

  const update: Record<string, unknown> = { id: req.params.id }
  if (name !== undefined) update.name = name
  if (logo_url !== undefined) update.logo_url = logo_url
  if (description !== undefined) update.description = description
  if (is_active !== undefined) update.is_active = is_active

  const brand = await brandService.updateBrands(update)
  res.json({ brand })
}

export const DELETE = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const brandService: any = req.scope.resolve(BRAND_MODULE)
  await brandService.deleteBrands(req.params.id)
  res.json({ id: req.params.id, object: 'brand', deleted: true })
}
