import { clampInt } from "../pagination"
import { SORTS, type SearchParams, type SearchProduct, type Sort } from "./engine"

const list = (value: unknown): string[] =>
  (Array.isArray(value) ? value : value == null ? [] : [value])
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim().slice(0, 100))
    .filter(Boolean)

const text = (value: unknown, max = 120): string | undefined => list(value)[0]?.slice(0, max)

const amount = (value: unknown): number | undefined => {
  const raw = text(value)
  if (raw === undefined) return undefined
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 1e9) : undefined
}

const flag = (value: unknown) => ["1", "true"].includes(text(value) ?? "")

/** Query keys that aren't the name of a filter. */
const RESERVED = new Set([
  "q", "sort", "page", "limit", "category_id", "collection_id", "seller", "region_id", "currency_code",
  "min_price", "max_price", "rating", "on_sale", "in_stock", "verified", "fields",
])
const FILTER_NAME = /^[a-z][a-z0-9_]{0,39}$/
const MAX_FILTERS = 20
const MAX_VALUES = 50

/** Reads a search from a query string, ignoring anything it doesn't understand. */
export function readSearch(query: Record<string, unknown>): SearchParams {
  const filters: Record<string, string[]> = {}
  for (const [key, value] of Object.entries(query)) {
    if (RESERVED.has(key) || !FILTER_NAME.test(key) || Object.keys(filters).length >= MAX_FILTERS) continue
    const values = list(value).slice(0, MAX_VALUES)
    if (values.length) filters[key] = values
  }
  const min = amount(query.min_price)
  const max = amount(query.max_price)
  const rating = amount(query.rating)
  const sort = text(query.sort)
  return {
    q: text(query.q, 120),
    sort: SORTS.includes(sort as Sort) ? (sort as Sort) : undefined,
    page: clampInt(query.page, { fallback: 1, min: 1, max: 10_000 }),
    limit: clampInt(query.limit, { fallback: 24, min: 1, max: 60 }),
    category_ids: list(query.category_id).slice(0, 20),
    collection_id: text(query.collection_id),
    seller_handle: text(query.seller),
    filters,
    // Typed the wrong way round, they still mean a range
    min_price: min != null && max != null ? Math.min(min, max) : min,
    max_price: min != null && max != null ? Math.max(min, max) : max,
    rating: rating && rating <= 5 ? rating : undefined,
    on_sale: flag(query.on_sale),
    in_stock: flag(query.in_stock),
    verified: flag(query.verified),
  }
}

/** A product as a card shows it. */
export const productCard = (p: SearchProduct, currency_code: string) => ({
  id: p.id,
  title: p.title,
  handle: p.handle,
  thumbnail: p.thumbnail,
  price: p.price,
  original_price: p.original_price,
  currency_code,
  flash_sale: p.flash_sale,
  in_stock: p.in_stock,
  variant_count: p.variant_count,
  variant_id: p.variant_id,
  rating: p.rating,
  review_count: p.review_count,
  sold: p.sold,
  brand: p.brand,
  category: p.categories[0] ? { name: p.categories[0].name, handle: p.categories[0].handle } : null,
  seller: p.seller,
  created_at: new Date(p.created_at).toISOString(),
  excerpt: p.description.replace(/\s+/g, " ").trim().slice(0, 180),
})
