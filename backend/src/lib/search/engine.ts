import { alternativesFor, editDistance, normalize, queryWords, stem, typosAllowed, words } from "./text"

/**
 * Product search over the live catalogue: matching, filters, filter counts and
 * sorting. Pure functions over plain records, so every rule here can be tested
 * without a database; lib/search/catalog loads the records.
 */

export type SearchProduct = {
  id: string
  title: string
  subtitle: string | null
  handle: string
  thumbnail: string | null
  description: string
  created_at: number
  price: number | null
  original_price: number | null
  flash_sale: boolean
  in_stock: boolean
  variant_count: number
  /** The only variant, when there is nothing to choose */
  variant_id: string | null
  skus: string[]
  seller: { id: string; name: string; handle: string; photo: string | null; verified: boolean } | null
  brand: string | null
  type: string | null
  collection: { id: string; title: string; handle: string } | null
  categories: { id: string; name: string; handle: string }[]
  /** Its categories and everything above them */
  category_ids: string[]
  tags: string[]
  /** Choices and attributes by name, e.g. { color: ["Red"], material: ["Cotton"] } */
  options: Record<string, string[]>
  /** How each option name reads to a shopper */
  option_labels: Record<string, string>
  rating: number
  review_count: number
  sold: number
  trending: number
  sales_channel_ids: string[]
}

export const SORTS = ["relevance", "popular", "newest", "price_asc", "price_desc", "rating", "best_selling", "discount"] as const
export type Sort = (typeof SORTS)[number]

export type SearchParams = {
  q?: string
  sort?: Sort
  page?: number
  limit?: number
  category_ids?: string[]
  collection_id?: string
  seller_handle?: string
  sales_channel_ids?: string[]
  /** Filters by facet name: category, brand, store, type, and any option name */
  filters?: Record<string, string[]>
  min_price?: number
  max_price?: number
  rating?: number
  on_sale?: boolean
  in_stock?: boolean
  verified?: boolean
}

export type FacetValue = { value: string; label: string; count: number; selected: boolean }
export type Facet = { name: string; label: string; values: FacetValue[] }

export type SearchResult = {
  products: SearchProduct[]
  count: number
  page: number
  pages: number
  sort: Sort
  facets: Facet[]
  /** scale: how far the slider bends towards the cheap end, so one costly product doesn't squash the rest */
  price: { min: number; max: number; scale: 1 | 2 | 3; histogram: number[] } | null
  rating_counts: Record<string, number>
  on_sale_count: number
  in_stock_count: number
  verified_count: number
  /** Nothing matched every word, so these match some of them */
  relaxed: boolean
  did_you_mean: string | null
}

/* ── Matching ─────────────────────────────────────────────────────────────── */

type Field = { weight: number; words: string[]; stems: string[] }
export type IndexedProduct = { product: SearchProduct; fields: Field[]; title: string }

const field = (weight: number, ...texts: unknown[]): Field => {
  const list = [...new Set(texts.flatMap(words))]
  return { weight, words: list, stems: list.map(stem) }
}

export const indexProduct = (product: SearchProduct): IndexedProduct => ({
  product,
  title: normalize(product.title),
  fields: [
    field(10, product.title),
    field(8, ...product.skus),
    field(7, product.brand),
    field(6, ...product.categories.map((c) => c.name)),
    field(5, product.type, ...product.tags),
    field(4, product.collection?.title),
    field(3, product.seller?.name, product.subtitle),
    field(2.5, ...Object.values(product.options).flat()),
    field(1, product.description),
  ],
})

/** How well one query word is answered by a field: 1 exactly, down to 0 not at all. */
function wordQuality(word: string, wordStem: string, f: Field, allowTypos: boolean): number {
  let best = 0
  const typos = allowTypos ? typosAllowed(word) : 0
  for (let i = 0; i < f.words.length; i++) {
    const w = f.words[i]
    if (w === word) return 1
    if (f.stems[i] === wordStem) best = Math.max(best, 0.95)
    else if (word.length >= 2 && w.startsWith(word)) best = Math.max(best, 0.65 + 0.2 * (word.length / w.length))
    else if (word.length >= 4 && w.includes(word)) best = Math.max(best, 0.5)
    // The first letter is almost never the typo, and requiring it keeps this honest
    else if (best < 0.5 && typos && w[0] === word[0]) {
      const d = editDistance(word, w, typos)
      if (d <= typos) best = Math.max(best, d === 1 ? 0.45 : 0.3)
      else if (w.length > word.length && editDistance(word, w.slice(0, word.length), typos) <= typos) best = Math.max(best, 0.25)
    }
  }
  return best
}

function scoreWord(word: string, indexed: IndexedProduct, allowTypos: boolean): number {
  const s = stem(word)
  let best = 0
  for (const f of indexed.fields) {
    // Long texts match typos by accident
    const q = wordQuality(word, s, f, allowTypos && f.weight > 1)
    if (q) best = Math.max(best, q * f.weight)
  }
  if (best < 4) {
    for (const alternative of alternativesFor(word)) {
      let total = 0
      const all = alternative.every((a) => {
        const each = Math.max(0, ...indexed.fields.map((f) => (f.weight > 1 ? wordQuality(a, stem(a), f, false) * f.weight : 0)))
        total += each
        return each > 0
      })
      if (all) best = Math.max(best, (0.75 * total) / alternative.length)
    }
  }
  return best
}

type Match = { indexed: IndexedProduct; score: number; matched: number }

function matchProducts(catalog: IndexedProduct[], query: string): { matches: Match[]; relaxed: boolean } {
  const list = queryWords(query)
  if (!list.length) return { matches: catalog.map((indexed) => ({ indexed, score: 0, matched: 0 })), relaxed: false }
  const phrase = normalize(query)

  const run = (allowTypos: boolean): Match[] =>
    catalog
      .map((indexed) => {
        const scores = list.map((w) => scoreWord(w, indexed, allowTypos))
        const matched = scores.filter((s) => s > 0).length
        let score = scores.reduce((a, b) => a + b, 0)
        if (matched && indexed.title === phrase) score += 12
        else if (matched && indexed.title.startsWith(phrase)) score += 6
        else if (matched && ` ${indexed.title} `.includes(` ${phrase} `)) score += 4
        return { indexed, score, matched }
      })
      .filter((m) => m.matched > 0)

  // Exact spelling first: typo matches only fill in when it finds nothing
  const exact = run(false)
  const everyWord = exact.filter((m) => m.matched === list.length)
  if (everyWord.length) return { matches: everyWord, relaxed: false }

  const fuzzy = run(true)
  const fuzzyEveryWord = fuzzy.filter((m) => m.matched === list.length)
  if (fuzzyEveryWord.length) return { matches: fuzzyEveryWord, relaxed: false }

  // No product has every word: offer those with the most of them
  const most = Math.max(0, ...fuzzy.map((m) => m.matched))
  const enough = fuzzy.filter((m) => m.matched === most && m.score >= 3)
  return { matches: enough, relaxed: enough.length > 0 }
}

/** The query with misspelled words put right, when the catalogue knows the word they meant. */
export function suggestSpelling(catalog: IndexedProduct[], query: string): string | null {
  const list = words(query)
  if (!list.length) return null
  const vocabulary = new Map<string, number>()
  for (const { fields } of catalog) {
    for (const f of fields) {
      if (f.weight < 4) continue
      for (const w of f.words) if (w.length > 2 && !/\d/.test(w)) vocabulary.set(w, (vocabulary.get(w) ?? 0) + f.weight)
    }
  }
  const known = (w: string) => vocabulary.has(w) || alternativesFor(w).length > 0 || [...vocabulary.keys()].some((v) => stem(v) === stem(w) || v.startsWith(w))
  let changed = false
  const fixed = list.map((w) => {
    const typos = typosAllowed(w)
    if (!typos || known(w)) return w
    let best: { word: string; distance: number; weight: number } | null = null
    for (const [v, weight] of vocabulary) {
      if (v[0] !== w[0]) continue
      const distance = editDistance(w, v, typos)
      if (distance > typos) continue
      if (!best || distance < best.distance || (distance === best.distance && weight > best.weight)) best = { word: v, distance, weight }
    }
    if (best) changed = true
    return best?.word ?? w
  })
  return changed ? fixed.join(" ") : null
}

/* ── Filters and counts ───────────────────────────────────────────────────── */

const same = (value: string) => normalize(value)

/** The values a product has for a facet. */
function facetValues(p: SearchProduct, name: string): { value: string; label: string }[] {
  const plain = (v: string) => ({ value: v, label: v })
  switch (name) {
    case "category":
      return p.categories.map((c) => ({ value: c.handle, label: c.name }))
    case "brand":
      return p.brand ? [plain(p.brand)] : []
    case "store":
      return p.seller ? [{ value: p.seller.handle, label: p.seller.name }] : []
    case "type":
      return p.type ? [plain(p.type)] : []
    default:
      return (p.options[name] ?? []).map(plain)
  }
}

const FACET_LABELS: Record<string, string> = { category: "Category", brand: "Brand", store: "Shop", type: "Product type" }
const FIRST_FACETS = ["category", "type", "brand", "store", "condition", "size", "color"]
/** A choice nearly every product words differently is no use as a filter. */
const MAX_EXTRA_FACETS = 6

const discountOf = (p: SearchProduct) =>
  p.price != null && p.original_price != null && p.original_price > p.price ? (p.original_price - p.price) / p.original_price : 0

type Group = { key: string; passes: (p: SearchProduct) => boolean }

function filterGroups(params: SearchParams, known: Set<string>): Group[] {
  const groups: Group[] = []
  for (const [name, values] of Object.entries(params.filters ?? {})) {
    const wanted = new Set(values.map(same).filter(Boolean))
    // Anything else in the address (?utm_source=…) isn't a filter
    if (!wanted.size || !known.has(name)) continue
    groups.push({
      key: name,
      // Old links carry the category's name rather than its handle
      passes: (p) => facetValues(p, name).some((v) => wanted.has(same(v.value)) || wanted.has(same(v.label))),
    })
  }
  const { min_price: min, max_price: max } = params
  if (min != null || max != null) {
    groups.push({ key: "price", passes: (p) => p.price != null && (min == null || p.price >= min) && (max == null || p.price <= max) })
  }
  if (params.rating) groups.push({ key: "rating", passes: (p) => p.review_count > 0 && p.rating >= params.rating! })
  if (params.on_sale) groups.push({ key: "on_sale", passes: (p) => discountOf(p) > 0 })
  if (params.in_stock) groups.push({ key: "in_stock", passes: (p) => p.in_stock })
  if (params.verified) groups.push({ key: "verified", passes: (p) => !!p.seller?.verified })
  return groups
}

const SIZE_ORDER = ["xxxs", "xxs", "xs", "s", "small", "m", "medium", "l", "large", "xl", "xxl", "2xl", "xxxl", "3xl", "4xl", "5xl", "free size", "one size"]

function compareValues(name: string, a: FacetValue, b: FacetValue): number {
  if (name === "size") {
    const ai = SIZE_ORDER.indexOf(same(a.label))
    const bi = SIZE_ORDER.indexOf(same(b.label))
    if (ai >= 0 && bi >= 0) return ai - bi
    if (ai >= 0 || bi >= 0) return ai >= 0 ? -1 : 1
    const numeric = Number.parseFloat(a.label) - Number.parseFloat(b.label)
    if (Number.isFinite(numeric) && numeric) return numeric
    return a.label.localeCompare(b.label, undefined, { numeric: true })
  }
  return b.count - a.count || a.label.localeCompare(b.label, undefined, { numeric: true })
}

/** Values spelled differently ("black", "Black") count as one, under the commonest spelling. */
class Counter {
  private values = new Map<string, { spellings: Map<string, { label: string; n: number }>; count: number }>()
  add(value: string, label: string, n = 1) {
    const key = same(value)
    if (!key) return
    const entry = this.values.get(key) ?? { spellings: new Map(), count: 0 }
    const spelling = entry.spellings.get(value) ?? { label, n: 0 }
    spelling.n++
    entry.spellings.set(value, spelling)
    entry.count += n
    this.values.set(key, entry)
  }
  list(selected: Set<string>): FacetValue[] {
    return [...this.values].map(([key, { spellings, count }]) => {
      const capital = (v: string) => (/^\p{Lu}/u.test(v) ? 0 : 1)
      const [value, { label }] = [...spellings].sort(
        (a, b) => b[1].n - a[1].n || capital(a[0]) - capital(b[0]) || a[0].localeCompare(b[0])
      )[0]
      return { value, label, count, selected: selected.has(key) || selected.has(same(label)) }
    })
  }
}

/* ── Sorting ──────────────────────────────────────────────────────────────── */

/** A few glowing reviews shouldn't outrank hundreds of good ones. */
const trustedRating = (p: SearchProduct) => (p.review_count ? (p.rating * p.review_count + 3.5 * 3) / (p.review_count + 3) : 0)

const popularity = (p: SearchProduct) =>
  3 * Math.log2(1 + p.trending) + Math.log2(1 + p.sold) + trustedRating(p) * 0.6 + Math.min(1, discountOf(p) * 2) + (p.seller?.verified ? 0.5 : 0)

function compare(sort: Sort, a: Match, b: Match): number {
  const x = a.indexed.product
  const y = b.indexed.product
  // Sold out goes last however the list is sorted
  if (x.in_stock !== y.in_stock) return x.in_stock ? -1 : 1
  const priceOr = (p: SearchProduct, fallback: number) => p.price ?? fallback
  let d = 0
  switch (sort) {
    case "relevance":
      d = b.score - a.score
      break
    case "newest":
      d = y.created_at - x.created_at
      break
    case "price_asc":
      d = priceOr(x, Number.MAX_VALUE) - priceOr(y, Number.MAX_VALUE)
      break
    case "price_desc":
      d = priceOr(y, -1) - priceOr(x, -1)
      break
    case "rating":
      d = trustedRating(y) - trustedRating(x) || y.review_count - x.review_count
      break
    case "best_selling":
      d = y.sold - x.sold
      break
    case "discount":
      d = discountOf(y) - discountOf(x)
      break
    default:
      break
  }
  return d || popularity(y) - popularity(x) || y.created_at - x.created_at || (x.id < y.id ? -1 : 1)
}

/* ── Search ───────────────────────────────────────────────────────────────── */

const HISTOGRAM_BARS = 24

function priceSummary(prices: number[]): SearchResult["price"] {
  if (!prices.length) return null
  const min = Math.floor(Math.min(...prices))
  const max = Math.ceil(Math.max(...prices))
  const spread = max / Math.max(min, 1)
  const scale = spread > 40 ? 3 : spread > 6 ? 2 : 1
  const histogram = new Array(HISTOGRAM_BARS).fill(0)
  for (const p of prices) {
    const at = max > min ? Math.floor(((p - min) / (max - min)) ** (1 / scale) * HISTOGRAM_BARS) : 0
    histogram[Math.min(HISTOGRAM_BARS - 1, at)]++
  }
  return { min, max, scale, histogram }
}

export function search(catalog: IndexedProduct[], params: SearchParams): SearchResult {
  const query = (params.q ?? "").trim()
  const scope = catalog.filter(({ product: p }) => {
    if (p.price == null) return false
    if (params.category_ids?.length && !params.category_ids.some((id) => p.category_ids.includes(id))) return false
    if (params.collection_id && p.collection?.id !== params.collection_id) return false
    if (params.seller_handle && p.seller?.handle !== params.seller_handle) return false
    if (params.sales_channel_ids?.length && !params.sales_channel_ids.some((id) => p.sales_channel_ids.includes(id))) return false
    return true
  })
  const { matches, relaxed } = matchProducts(scope, query)

  const groups = filterGroups(params, new Set([...Object.keys(FACET_LABELS), ...catalog.flatMap(({ product: p }) => Object.keys(p.options))]))
  const passing: Match[] = []
  const prices: number[] = []
  const counters = new Map<string, Counter>()
  const labels: Record<string, string> = { ...FACET_LABELS }
  const seen = new Map<string, number>()
  const rating_counts: Record<string, number> = { "4": 0, "3": 0, "2": 0, "1": 0 }
  let on_sale_count = 0
  let in_stock_count = 0
  let verified_count = 0

  for (const match of matches) {
    const p = match.indexed.product
    const failed = groups.filter((g) => !g.passes(p)).map((g) => g.key)
    if (!failed.length) passing.push(match)

    // A filter's own counts ignore that filter, so its other values stay choosable
    const countsFor = (key: string) => !failed.length || (failed.length === 1 && failed[0] === key)
    const names = [...FIRST_FACETS.slice(0, 4), ...Object.keys(p.options)]
    for (const name of names) {
      const values = facetValues(p, name)
      if (!values.length) continue
      labels[name] ??= p.option_labels[name] ?? name
      seen.set(name, (seen.get(name) ?? 0) + 1)
      const counter = counters.get(name) ?? new Counter()
      counters.set(name, counter)
      const n = countsFor(name) ? 1 : 0
      for (const v of values) counter.add(v.value, v.label, n)
    }
    if (countsFor("price") && p.price != null) prices.push(p.price)
    if (countsFor("rating") && p.review_count) {
      for (const floor of ["4", "3", "2", "1"]) if (p.rating >= Number(floor)) rating_counts[floor]++
    }
    if (countsFor("on_sale") && discountOf(p) > 0) on_sale_count++
    if (countsFor("in_stock") && p.in_stock) in_stock_count++
    if (countsFor("verified") && p.seller?.verified) verified_count++
  }

  const order = (name: string) => {
    const i = FIRST_FACETS.indexOf(name)
    return i >= 0 ? i : FIRST_FACETS.length
  }
  let extras = 0
  const facets: Facet[] = [...counters]
    .sort((a, b) => order(a[0]) - order(b[0]) || (seen.get(b[0]) ?? 0) - (seen.get(a[0]) ?? 0) || a[0].localeCompare(b[0]))
    .flatMap(([name, counter]) => {
      const selected = new Set((params.filters?.[name] ?? []).map(same))
      const values = counter
        .list(selected)
        .filter((v) => v.count > 0 || v.selected)
        .sort((a, b) => compareValues(name, a, b))
        .slice(0, 60)
      if (!values.length) return []
      const extra = !FIRST_FACETS.includes(name)
      // One value everything shares narrows nothing
      if (extra && !selected.size && (values.length < 2 || extras >= MAX_EXTRA_FACETS)) return []
      if (extra) extras++
      return [{ name, label: labels[name], values }]
    })

  const sort: Sort = params.sort ?? (query ? "relevance" : "popular")
  passing.sort((a, b) => compare(sort, a, b))

  const limit = Math.min(60, Math.max(1, params.limit ?? 24))
  const count = passing.length
  const pages = Math.max(1, Math.ceil(count / limit))
  const page = Math.min(pages, Math.max(1, params.page ?? 1))
  const start = (page - 1) * limit

  return {
    products: passing.slice(start, start + limit).map((m) => m.indexed.product),
    count,
    page,
    pages,
    sort,
    facets,
    price: priceSummary(prices),
    rating_counts,
    on_sale_count,
    in_stock_count,
    verified_count,
    relaxed,
    did_you_mean: query && (relaxed || !matches.length) ? suggestSpelling(scope, query) : null,
  }
}
