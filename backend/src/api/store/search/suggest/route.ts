import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { loadCatalog } from "../../../../lib/search/catalog"
import { search } from "../../../../lib/search/engine"
import { productCard, readSearch } from "../../../../lib/search/params"
import { searchRegion } from "../../../../lib/search/region"
import { normalize } from "../../../../lib/search/text"

type Suggestion = { name: string; handle: string; count: number; photo?: string | null }

/** Names that answer what is being typed, then those common among its products. */
function pick(entries: Map<string, Suggestion>, query: string, max: number): Suggestion[] {
  const named = (s: Suggestion) => {
    const name = normalize(s.name)
    return !query ? 0 : name.startsWith(query) ? 2 : ` ${name}`.includes(` ${query}`) ? 1 : 0
  }
  return [...entries.values()].sort((a, b) => named(b) - named(a) || b.count - a.count || a.name.localeCompare(b.name)).slice(0, max)
}

/**
 * GET /store/search/suggest?q=
 *
 * What the search box shows while typing: a few products, and the categories,
 * brands and shops they come from. Without a query, what is popular.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const params = readSearch(req.query as Record<string, unknown>)
  const region = await searchRegion(req.scope, req.query.region_id)
  const sales_channel_ids = (req as any).publishable_key_context?.sales_channel_ids ?? []
  const catalog = await loadCatalog(req.scope, region)

  const scope = { q: params.q, category_ids: params.category_ids, sales_channel_ids }
  const found = search(catalog, { ...scope, limit: 6 })
  const query = normalize(params.q)

  const categories = new Map<string, Suggestion>()
  const brands = new Map<string, Suggestion>()
  const shops = new Map<string, Suggestion>()
  const add = (map: Map<string, Suggestion>, name: string, handle: string, photo?: string | null) => {
    const entry = map.get(handle) ?? { name, handle, count: 0, photo }
    entry.count++
    map.set(handle, entry)
  }
  for (const facet of found.facets) {
    for (const v of facet.values) {
      const into = facet.name === "category" ? categories : facet.name === "brand" ? brands : facet.name === "store" ? shops : null
      into?.set(v.value, { name: v.label, handle: v.value, count: v.count })
    }
  }
  // A shop or brand is worth naming even when none of its products say so
  if (query.length >= 2) {
    for (const { product: p } of catalog) {
      if (p.seller && normalize(p.seller.name).includes(query) && !found.facets.some((f) => f.name === "store" && f.values.some((v) => v.value === p.seller!.handle))) {
        add(shops, p.seller.name, p.seller.handle)
      }
    }
  }
  for (const { product: p } of catalog) {
    const shop = p.seller && shops.get(p.seller.handle)
    if (shop && shop.photo === undefined) shop.photo = p.seller!.photo
  }

  res.setHeader("Cache-Control", "public, max-age=10")
  res.json({
    query: params.q ?? "",
    count: found.count,
    relaxed: found.relaxed,
    did_you_mean: found.did_you_mean,
    currency_code: region.currency_code,
    products: found.products.map((p) => productCard(p, region.currency_code)),
    categories: pick(categories, query, 4),
    brands: pick(brands, query, 3),
    shops: pick(shops, query, 3),
  })
}
