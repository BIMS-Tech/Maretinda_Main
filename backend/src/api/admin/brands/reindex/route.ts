/**
 * Admin: re-apply brand to every product's Algolia record.
 * Route: POST /admin/brands/reindex
 *
 * Recovery/backfill for brand search data (e.g. after bulk product edits that
 * caused the base indexer to replace records without brand).
 */

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { reindexAllBrands } from '../../../../lib/algolia-brand'

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  try {
    const count = await reindexAllBrands(req.scope)
    res.json({ success: true, reindexed: count })
  } catch (error) {
    console.error('[Admin Brands Reindex]', error)
    res.status(500).json({ message: (error as Error).message || 'Reindex failed' })
  }
}
