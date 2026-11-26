import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { loadCatalog } from "../../../lib/search/catalog"
import { search } from "../../../lib/search/engine"
import { productCard, readSearch } from "../../../lib/search/params"
import { searchRegion } from "../../../lib/search/region"

/**
 * GET /store/search
 *
 * Every product listing on the store: search, category, collection and shop
 * pages. Filters are the facet names it answers with, repeated for more than
 * one value (?color=Red&color=Blue). Rate limited in middlewares.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const params = readSearch(req.query as Record<string, unknown>)
  const region = await searchRegion(req.scope, req.query.region_id)
  const sales_channel_ids = (req as any).publishable_key_context?.sales_channel_ids ?? []

  const catalog = await loadCatalog(req.scope, region)
  const { products, ...result } = search(catalog, { ...params, sales_channel_ids })

  res.json({
    ...result,
    currency_code: region.currency_code,
    limit: params.limit,
    products: products.map((p) => productCard(p, region.currency_code)),
  })
}
