import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { closedSellers } from "../seller-plan"
import { type IndexedProduct, type SearchProduct, indexProduct } from "./engine"
import { normalize } from "./text"

/**
 * The products a shopper can find, read straight from the database: what is
 * published, in shops that are open, at the price they would pay right now.
 * There is no separate index to fall behind.
 */

/** How long a loaded catalogue is used before it is read again. */
const fresh = () => Number(process.env.SEARCH_FRESH_MS ?? 15_000)
/** After that a slightly old one is still answered with, while a new one loads. */
const STALE_FOR = 60_000

type Region = { currency_code: string; region_id?: string }
type Entry = { at: number; catalog: IndexedProduct[]; loading: Promise<IndexedProduct[]> | null }
const cache = new Map<string, Entry>()

export async function loadCatalog(container: any, region: Region): Promise<IndexedProduct[]> {
  const key = `${region.currency_code}:${region.region_id ?? ""}`
  const entry = cache.get(key) ?? { at: 0, catalog: [], loading: null }
  cache.set(key, entry)

  const age = Date.now() - entry.at
  if (entry.at && age < fresh()) return entry.catalog

  entry.loading ??= readCatalog(container, region)
    .then((products) => {
      entry.catalog = products.map(indexProduct)
      entry.at = Date.now()
      return entry.catalog
    })
    .finally(() => {
      entry.loading = null
    })

  if (entry.at && fresh() > 0 && age < fresh() + STALE_FOR) {
    entry.loading.catch((error) => console.error("[search] couldn't refresh the catalogue:", error?.message ?? error))
    return entry.catalog
  }
  return entry.loading
}

const groupBy = <T extends Record<string, any>>(rows: T[], key: string): Map<string, T[]> => {
  const map = new Map<string, T[]>()
  for (const row of rows) {
    const list = map.get(row[key])
    if (list) list.push(row)
    else map.set(row[key], [row])
  }
  return map
}

/** Seller descriptions are HTML from the editor; markup must not be searchable. */
const plainText = (html: unknown) =>
  String(html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .slice(0, 1500)

const OPTION_NAMES: Record<string, string> = { colour: "color", colors: "color", colours: "color", kulay: "color", sizes: "size", sukat: "size" }

/** "Colour" and "Color" are one filter. Medusa's placeholder option isn't one. */
export function optionName(title: string): string | null {
  const n = normalize(title).replace(/ /g, "_")
  if (!n || n === "default_option" || n === "default" || n === "title") return null
  return OPTION_NAMES[n] ?? n
}

/** Tables our own loaders and migrations create; a fresh database may not have them yet. */
async function existing(pg: any, tables: string[]): Promise<Set<string>> {
  const { rows } = await pg.raw(
    `SELECT t AS name FROM unnest(?::text[]) AS t WHERE to_regclass('public.' || quote_ident(t)) IS NOT NULL`,
    [tables]
  )
  return new Set(rows.map((r: any) => r.name))
}

async function readCatalog(container: any, region: Region): Promise<SearchProduct[]> {
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const has = await existing(pg, ["brand", "product_brand", "flash_sale", "flash_sale_item"])
  const all = async (sql: string, bindings: any[] = []) => (await pg.raw(sql, bindings)).rows as any[]

  const products = await all(`
    SELECT p.id, p.title, p.subtitle, p.handle, p.thumbnail, p.description, p.created_at,
           COALESCE((p.metadata->>'trending_score')::numeric, 0)::float AS trending,
           t.value AS type,
           c.id AS collection_id, c.title AS collection_title, c.handle AS collection_handle,
           s.id AS seller_id, s.name AS seller_name, s.handle AS seller_handle, s.photo AS seller_photo,
           (s.verification_status = 'verified') AS seller_verified
    FROM product p
    LEFT JOIN product_type t ON t.id = p.type_id AND t.deleted_at IS NULL
    LEFT JOIN product_collection c ON c.id = p.collection_id AND c.deleted_at IS NULL
    LEFT JOIN LATERAL (
      SELECT seller_id FROM seller_seller_product_product l
      WHERE l.product_id = p.id AND l.deleted_at IS NULL
      ORDER BY l.created_at LIMIT 1
    ) l ON true
    LEFT JOIN seller s ON s.id = l.seller_id AND s.deleted_at IS NULL
    WHERE p.status = 'published' AND p.deleted_at IS NULL
  `)
  if (!products.length) return []

  const closed = new Set((await closedSellers(pg, products.map((p) => p.seller_id).filter(Boolean))).map((s) => s.id))
  const open = products.filter((p) => !p.seller_id || !closed.has(p.seller_id))
  const ids = open.map((p) => p.id)
  if (!ids.length) return []

  const [variants, stock, categories, tags, options, attributes, brands, reviews, sold, flash, channels] = await Promise.all<any[]>([
    all(
      `SELECT v.id, v.product_id, v.sku, v.allow_backorder, v.manage_inventory, ps.price_set_id
       FROM product_variant v
       LEFT JOIN product_variant_price_set ps ON ps.variant_id = v.id AND ps.deleted_at IS NULL
       WHERE v.product_id = ANY(?) AND v.deleted_at IS NULL
       ORDER BY v.variant_rank NULLS LAST, v.created_at`,
      [ids]
    ),
    // A bundle has as many as its scarcest part allows
    all(
      `SELECT x.variant_id, MIN(FLOOR(x.available / GREATEST(x.required_quantity, 1)))::float AS available
       FROM (
         SELECT vi.variant_id, vi.inventory_item_id, vi.required_quantity,
                COALESCE(SUM(il.stocked_quantity - il.reserved_quantity), 0) AS available
         FROM product_variant_inventory_item vi
         JOIN product_variant v ON v.id = vi.variant_id AND v.deleted_at IS NULL
         LEFT JOIN inventory_level il ON il.inventory_item_id = vi.inventory_item_id AND il.deleted_at IS NULL
         WHERE v.product_id = ANY(?) AND vi.deleted_at IS NULL
         GROUP BY vi.variant_id, vi.inventory_item_id, vi.required_quantity
       ) x GROUP BY x.variant_id`,
      [ids]
    ),
    all(
      `SELECT x.product_id, c.id, c.name, c.handle, c.mpath
       FROM product_category_product x
       JOIN product_category c ON c.id = x.product_category_id AND c.deleted_at IS NULL
       WHERE x.product_id = ANY(?) AND c.is_active AND NOT c.is_internal`,
      [ids]
    ),
    all(
      `SELECT x.product_id, t.value FROM product_tags x
       JOIN product_tag t ON t.id = x.product_tag_id AND t.deleted_at IS NULL
       WHERE x.product_id = ANY(?)`,
      [ids]
    ),
    // Only choices a variant is sold in
    all(
      `SELECT DISTINCT o.product_id, o.title, ov.value
       FROM product_option o
       JOIN product_option_value ov ON ov.option_id = o.id AND ov.deleted_at IS NULL
       JOIN product_variant_option vo ON vo.option_value_id = ov.id
       JOIN product_variant v ON v.id = vo.variant_id AND v.deleted_at IS NULL
       WHERE o.product_id = ANY(?) AND o.deleted_at IS NULL`,
      [ids]
    ),
    all(
      `SELECT x.product_id, a.name AS title, av.value
       FROM product_product_attribute_attribute_value x
       JOIN attribute_value av ON av.id = x.attribute_value_id AND av.deleted_at IS NULL
       JOIN attribute a ON a.id = av.attribute_id AND a.deleted_at IS NULL AND a.is_filterable
       WHERE x.product_id = ANY(?) AND x.deleted_at IS NULL`,
      [ids]
    ),
    has.has("brand") && has.has("product_brand")
      ? all(
          `SELECT pb.product_id, b.name FROM product_brand pb
           JOIN brand b ON b.id = pb.brand_id AND b.deleted_at IS NULL AND b.is_active
           WHERE pb.product_id = ANY(?) AND pb.deleted_at IS NULL`,
          [ids]
        )
      : Promise.resolve([]),
    all(
      `SELECT x.product_id, AVG(r.rating)::float AS rating, COUNT(*)::int AS n
       FROM product_product_review_review x
       JOIN review r ON r.id = x.review_id AND r.deleted_at IS NULL AND r.reference = 'product'
       WHERE x.product_id = ANY(?) AND x.deleted_at IS NULL
       GROUP BY x.product_id`,
      [ids]
    ),
    unitsSold(all),
    has.has("flash_sale") && has.has("flash_sale_item")
      ? all(
          `SELECT i.product_id, i.variant_id, i.discount_type, i.discount_value::float AS discount_value
           FROM flash_sale_item i
           JOIN flash_sale f ON f.id = i.flash_sale_id
           WHERE i.product_id = ANY(?) AND i.item_status = 'approved'
             AND f.status = 'active' AND f.deleted_at IS NULL AND f.starts_at <= NOW() AND f.ends_at > NOW()
             AND (i.stock_limit IS NULL OR i.sold_count < i.stock_limit)`,
          [ids]
        )
      : Promise.resolve([]),
    all(`SELECT product_id, sales_channel_id FROM product_sales_channel WHERE product_id = ANY(?) AND deleted_at IS NULL`, [ids]),
  ])

  const prices = await variantPrices(container, variants.map((v) => v.price_set_id).filter(Boolean), region)

  const variantsOf = groupBy(variants, "product_id")
  const stockOf = new Map<string, number>(stock.map((s: any) => [s.variant_id, Number(s.available)]))
  const categoriesOf = groupBy(categories, "product_id")
  const tagsOf = groupBy(tags, "product_id")
  const choicesOf = groupBy([...options, ...attributes], "product_id")
  const brandOf = new Map<string, string>(brands.map((b: any) => [b.product_id, b.name]))
  const reviewsOf = new Map<string, { rating: number; n: number }>(reviews.map((r: any) => [r.product_id, r]))
  const soldOf = new Map<string, number>(sold.map((s: any) => [s.product_id, s.n]))
  const flashOf = new Map<string, { discount_type: string; discount_value: number }>(flash.map((f: any) => [f.product_id, f]))
  const channelsOf = groupBy(channels, "product_id")

  return open.map((p): SearchProduct => {
    const own = variantsOf.get(p.id) ?? []
    const buyable = (v: any) => !v.manage_inventory || v.allow_backorder || (stockOf.get(v.id) ?? 0) > 0
    const priced = own.flatMap((v) => {
      const price = prices.get(v.price_set_id)
      return price ? [{ variant: v, ...price }] : []
    })
    const cheapest = priced.length ? priced.reduce((a, b) => (b.price < a.price ? b : a)) : null

    let price = cheapest?.price ?? null
    let original = cheapest?.original ?? null
    const sale = flashOf.get(p.id)
    if (sale && priced.length) {
      // The same sum the product page and the cart do: off the regular price, not off another sale's
      const off = (regular: number) =>
        sale.discount_type === "percentage" ? Math.round(regular * (1 - sale.discount_value / 100)) : Math.max(0, Math.round(regular - sale.discount_value))
      original = Math.min(...priced.map((v) => v.original))
      price = off(original)
    }

    const choices: Record<string, string[]> = {}
    const labels: Record<string, string> = {}
    for (const { title, value } of choicesOf.get(p.id) ?? []) {
      const name = optionName(title)
      const text = String(value ?? "").trim()
      if (!name || !text || text.length > 40) continue
      labels[name] ??= name === "color" ? "Color" : name === "size" ? "Size" : String(title).trim()
      choices[name] ??= []
      if (!choices[name].includes(text)) choices[name].push(text)
    }

    const own_categories = categoriesOf.get(p.id) ?? []
    const review = reviewsOf.get(p.id)
    return {
      id: p.id,
      title: p.title,
      subtitle: p.subtitle,
      handle: p.handle,
      thumbnail: p.thumbnail,
      description: plainText(p.description),
      created_at: new Date(p.created_at).getTime(),
      price,
      original_price: original,
      flash_sale: !!sale && price != null && original != null && price < original,
      in_stock: own.some(buyable),
      variant_count: own.length,
      variant_id: own.length === 1 ? own[0].id : null,
      skus: own.map((v) => v.sku).filter(Boolean),
      seller: p.seller_id
        ? { id: p.seller_id, name: p.seller_name, handle: p.seller_handle, photo: p.seller_photo, verified: !!p.seller_verified }
        : null,
      brand: brandOf.get(p.id) ?? null,
      type: p.type,
      collection: p.collection_id ? { id: p.collection_id, title: p.collection_title, handle: p.collection_handle } : null,
      categories: own_categories.map((c) => ({ id: c.id, name: c.name, handle: String(c.handle).trim() })),
      // mpath is the category's ancestors and itself, dot separated
      category_ids: [...new Set(own_categories.flatMap((c) => [c.id, ...String(c.mpath ?? "").split(".").filter(Boolean)]))],
      tags: (tagsOf.get(p.id) ?? []).map((t) => t.value),
      options: choices,
      option_labels: labels,
      rating: review ? Math.round(review.rating * 10) / 10 : 0,
      review_count: review?.n ?? 0,
      sold: soldOf.get(p.id) ?? 0,
      trending: Number(p.trending) || 0,
      sales_channel_ids: (channelsOf.get(p.id) ?? []).map((c) => c.sales_channel_id),
    }
  })
}

/** What each price set costs here today: the price lists and sales Medusa's own cart would apply. */
async function variantPrices(container: any, priceSetIds: string[], region: Region) {
  const out = new Map<string, { price: number; original: number }>()
  const pricing = container.resolve(Modules.PRICING)
  for (let i = 0; i < priceSetIds.length; i += 1000) {
    const rows = await pricing.calculatePrices(
      { id: priceSetIds.slice(i, i + 1000) },
      { context: { currency_code: region.currency_code, ...(region.region_id ? { region_id: region.region_id } : {}) } }
    )
    for (const row of rows) {
      if (row.calculated_amount == null) continue
      const price = Number(row.calculated_amount)
      out.set(row.id, { price, original: Math.max(price, Number(row.original_amount ?? price)) })
    }
  }
  return out
}

/** Every order ever is a lot to add up for each search, and changes slowly. */
let soldCache: { at: number; rows: any[] } = { at: 0, rows: [] }
async function unitsSold(all: (sql: string) => Promise<any[]>): Promise<any[]> {
  if (fresh() > 0 && Date.now() - soldCache.at < 5 * 60_000) return soldCache.rows
  const rows = await all(`
    SELECT li.product_id, SUM(oi.quantity)::int AS n
    FROM order_item oi
    JOIN order_line_item li ON li.id = oi.item_id
    JOIN "order" o ON o.id = oi.order_id AND o.version = oi.version
    WHERE o.status NOT IN ('canceled', 'archived') AND o.deleted_at IS NULL
      AND oi.deleted_at IS NULL AND li.product_id IS NOT NULL
    GROUP BY li.product_id
  `)
  soldCache = { at: Date.now(), rows }
  return rows
}

/** For tests, which change the catalogue between calls. */
export const forgetCatalog = () => {
  cache.clear()
  soldCache = { at: 0, rows: [] }
}
