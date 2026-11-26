import { indexProduct, search, type SearchParams, type SearchProduct } from "../search/engine"
import { editDistance, normalize, stem } from "../search/text"

let n = 0
const product = (over: Partial<SearchProduct> & { title: string }): SearchProduct => ({
  id: `prod_${++n}`,
  subtitle: null,
  handle: over.title.toLowerCase().replace(/\W+/g, "-"),
  thumbnail: null,
  description: "",
  created_at: n,
  price: 100,
  original_price: over.price ?? 100,
  flash_sale: false,
  in_stock: true,
  variant_count: 1,
  variant_id: `variant_${n}`,
  skus: [],
  seller: { id: "sel_1", name: "Aling Nena Store", handle: "aling-nena", photo: null, verified: true },
  brand: null,
  type: null,
  collection: null,
  categories: [],
  category_ids: [],
  tags: [],
  options: {},
  option_labels: {},
  rating: 0,
  review_count: 0,
  sold: 0,
  trending: 0,
  sales_channel_ids: ["sc_1"],
  ...over,
})
const find = (products: SearchProduct[], params: SearchParams) => search(products.map(indexProduct), params)
const titles = (products: SearchProduct[], params: SearchParams) => find(products, params).products.map((p) => p.title)
const values = (products: SearchProduct[], params: SearchParams, name: string) =>
  Object.fromEntries((find(products, params).facets.find((f) => f.name === name)?.values ?? []).map((v) => [v.label, v.count]))

describe("text", () => {
  it("ignores case, accents and punctuation", () => {
    expect(normalize("Niño's  T-Shirt!")).toBe("ninos t shirt")
  })
  it("drops plurals without mangling names", () => {
    expect(["sneakers", "dresses", "watches", "candies", "adidas", "gas", "jeans", "iphone15s"].map(stem)).toEqual([
      "sneaker", "dress", "watch", "candy", "adida", "gas", "jean", "iphone15s",
    ])
    // The same rule runs on both sides, so "adidas" still finds "Adidas"
    expect(titles([product({ title: "Adidas Samba" })], { q: "adidas" })).toEqual(["Adidas Samba"])
  })
  it("counts swapped letters as one typo", () => {
    expect(editDistance("sneakesr", "sneakers", 2)).toBe(1)
    expect(editDistance("abc", "xyz", 1)).toBe(2)
  })
})

describe("search", () => {
  const shop = [
    product({ title: "Brown Sneakers", description: "Great with jeans" }),
    product({ title: "Denim Jeans" }),
    product({ title: "Running Shoe", brand: "Nike", tags: ["sport"] }),
    product({ title: "Canvas Bag", seller: { id: "sel_2", name: "Sneaker House", handle: "sneaker-house", photo: null, verified: false } }),
  ]

  it("puts title matches above mentions elsewhere", () => {
    expect(titles(shop, { q: "jeans" })).toEqual(["Denim Jeans", "Brown Sneakers"])
    expect(titles(shop, { q: "sneaker" })[0]).toBe("Brown Sneakers")
  })
  it("finds words while they are being typed", () => {
    expect(titles(shop, { q: "den" })).toEqual(["Denim Jeans"])
  })
  it("needs every word", () => {
    expect(titles(shop, { q: "brown sneakers" })).toEqual(["Brown Sneakers"])
  })
  it("finds by brand, tag and sku", () => {
    expect(titles(shop, { q: "nike" })).toEqual(["Running Shoe"])
    expect(titles(shop, { q: "sport" })).toEqual(["Running Shoe"])
    expect(titles([product({ title: "Lamp", skus: ["LMP-0042"] })], { q: "lmp-0042" })).toEqual(["Lamp"])
  })
  it("forgives typos, but only when the spelling as typed finds nothing", () => {
    expect(titles(shop, { q: "sneekers" })).toContain("Brown Sneakers")
    expect(titles(shop, { q: "denmi" })).toEqual(["Denim Jeans"])
    expect(titles([product({ title: "Blue Lamp" }), product({ title: "Blur Camera" })], { q: "blur" })).toEqual(["Blur Camera"])
  })
  it("doesn't forgive typos in short words or numbers", () => {
    expect(titles([product({ title: "Red Cap" })], { q: "rid" })).toEqual([])
    expect(titles([product({ title: "Phone 14" })], { q: "15" })).toEqual([])
  })
  it("understands Filipino for what listings name in English", () => {
    expect(titles(shop, { q: "sapatos" })).toEqual(expect.arrayContaining(["Running Shoe", "Brown Sneakers"]))
    expect(titles([product({ title: "Split Type Air Conditioner" }), product({ title: "Air Fryer" })], { q: "aircon" })).toEqual(["Split Type Air Conditioner"])
  })
  it("ignores filler words", () => {
    expect(titles(shop, { q: "the bag for you" }).length).toBeGreaterThan(0)
    expect(titles(shop, { q: "canvas bag na" })).toEqual(["Canvas Bag"])
  })
  it("offers the closest when no product has every word, and says so", () => {
    const r = find(shop, { q: "brown umbrella" })
    expect(r.relaxed).toBe(true)
    expect(r.products.map((p) => p.title)).toEqual(["Brown Sneakers"])
  })
  it("suggests a spelling", () => {
    expect(find(shop, { q: "zzzz" }).did_you_mean).toBeNull()
    expect(find(shop, { q: "canvvas umbrella" }).did_you_mean).toBe("canvas umbrella")
  })
  it("finds nothing for nonsense, and everything for nothing", () => {
    expect(find(shop, { q: "qwxz" }).count).toBe(0)
    expect(find(shop, { q: "   " }).count).toBe(4)
    expect(find(shop, { q: "!!!" }).count).toBe(4)
  })
  it("leaves out what can't be bought: no price, or another sales channel", () => {
    expect(titles([product({ title: "A", price: null }), product({ title: "B" })], {})).toEqual(["B"])
    expect(titles([product({ title: "A", sales_channel_ids: ["sc_2"] }), product({ title: "B" })], { sales_channel_ids: ["sc_1"] })).toEqual(["B"])
  })
})

describe("filters", () => {
  const shop = [
    product({ title: "A", brand: "Nike", price: 50, options: { color: ["Red"], size: ["M"] }, option_labels: { color: "Color", size: "Size" } }),
    product({ title: "B", brand: "Nike", price: 150, options: { color: ["Blue"], size: ["L"] }, option_labels: { color: "Color", size: "Size" } }),
    product({ title: "C", brand: "Adidas", price: 250, options: { color: ["red", "Blue"], size: ["S"] }, option_labels: { color: "Colour", size: "Size" } }),
    product({ title: "D", price: 350, rating: 4.5, review_count: 10 }),
  ]

  it("any value within a filter, every filter together", () => {
    expect(titles(shop, { filters: { color: ["Red", "Blue"] }, sort: "price_asc" })).toEqual(["A", "B", "C"])
    expect(titles(shop, { filters: { color: ["Blue"], brand: ["Nike"] } })).toEqual(["B"])
  })
  it("ignores case, and counts different spellings as one value", () => {
    expect(titles(shop, { filters: { color: ["RED"] }, sort: "price_asc" })).toEqual(["A", "C"])
    expect(values(shop, {}, "color")).toEqual({ Red: 2, Blue: 2 })
  })
  it("keeps a filter's other values choosable once one is picked", () => {
    expect(values(shop, { filters: { brand: ["Nike"] } }, "brand")).toEqual({ Nike: 2, Adidas: 1 })
    expect(values(shop, { filters: { brand: ["Nike"] } }, "color")).toEqual({ Red: 1, Blue: 1 })
  })
  it("keeps a picked value visible when nothing else matches it", () => {
    const facet = find(shop, { filters: { brand: ["Nike"], color: ["Blue"] }, max_price: 60 }).facets.find((f) => f.name === "color")!
    expect(facet.values.find((v) => v.label === "Blue")).toMatchObject({ count: 0, selected: true })
  })
  it("filters by price in pesos, either end or both", () => {
    expect(titles(shop, { min_price: 150, sort: "price_asc" })).toEqual(["B", "C", "D"])
    expect(titles(shop, { max_price: 150, sort: "price_asc" })).toEqual(["A", "B"])
    expect(titles(shop, { min_price: 100, max_price: 300, sort: "price_asc" })).toEqual(["B", "C"])
  })
  it("keeps the whole price range on show while a price is picked", () => {
    expect(find(shop, { max_price: 60 }).price).toMatchObject({ min: 50, max: 350 })
    expect(find(shop, {}).price!.histogram.reduce((a, b) => a + b, 0)).toBe(4)
  })
  it("doesn't let one costly product squash the price slider", () => {
    const prices = [...Array(30).keys()].map((i) => product({ title: `T${i}`, price: 100 + i * 20 }))
    expect(find(prices, {}).price!.scale).toBe(2)
    const wide = find([...prices, product({ title: "Piano", price: 90000 })], {}).price!
    expect(wide.scale).toBe(3)
    expect(wide.histogram.filter(Boolean).length).toBeGreaterThan(3)
  })
  it("filters by rating, sale, stock and verified shops", () => {
    expect(titles(shop, { rating: 4 })).toEqual(["D"])
    const other = [
      product({ title: "Sale", price: 80, original_price: 100 }),
      product({ title: "Gone", in_stock: false }),
      product({ title: "New shop", seller: { id: "s", name: "S", handle: "s", photo: null, verified: false } }),
    ]
    expect(titles(other, { on_sale: true })).toEqual(["Sale"])
    expect(titles(other, { in_stock: true })).not.toContain("Gone")
    expect(titles(other, { verified: true })).not.toContain("New shop")
  })
  it("doesn't count unrated products as zero stars", () => {
    expect(find(shop, {}).rating_counts).toEqual({ "4": 1, "3": 1, "2": 1, "1": 1 })
  })
  it("includes products of the categories below", () => {
    const inBoots = product({ title: "Boots", categories: [{ id: "c2", name: "Boots", handle: "boots" }], category_ids: ["c2", "c1"] })
    expect(titles([inBoots, product({ title: "X" })], { category_ids: ["c1"] })).toEqual(["Boots"])
  })
  it("accepts a category by its handle or, from old links, its name", () => {
    const p = [product({ title: "Boots", categories: [{ id: "c", name: "Winter Boots", handle: "wb" }] }), product({ title: "X" })]
    expect(titles(p, { filters: { category: ["wb"] } })).toEqual(["Boots"])
    expect(titles(p, { filters: { category: ["Winter Boots"] } })).toEqual(["Boots"])
  })
  it("takes no notice of other things in the address", () => {
    expect(find(shop, { filters: { utm_source: ["facebook"], gclid: ["x"] } }).count).toBe(4)
    expect(find(shop, { filters: { color: ["No such color"] } }).count).toBe(0)
  })
  it("orders sizes the way people do", () => {
    const sized = (s: string) => product({ title: s, options: { size: [s] }, option_labels: { size: "Size" } })
    expect(Object.keys(values(["XL", "S", "M", "L", "42", "9", "38"].map(sized), {}, "size"))).toEqual(expect.arrayContaining(["S"]))
    expect(find(["XL", "S", "M", "L"].map(sized), {}).facets.find((f) => f.name === "size")!.values.map((v) => v.label)).toEqual(["S", "M", "L", "XL"])
    expect(find(["42", "9", "38"].map(sized), {}).facets.find((f) => f.name === "size")!.values.map((v) => v.label)).toEqual(["9", "38", "42"])
  })
  it("only offers extra choices that narrow the list", () => {
    const p = [
      product({ title: "A", options: { material: ["Cotton"], origin: ["PH"] }, option_labels: { material: "Material", origin: "Origin" } }),
      product({ title: "B", options: { material: ["Wool"], origin: ["PH"] }, option_labels: { material: "Material", origin: "Origin" } }),
    ]
    expect(find(p, {}).facets.map((f) => f.name)).toEqual(["store", "material"])
  })
})

describe("sorting", () => {
  const shop = [
    product({ title: "Cheap", price: 10, created_at: 1, sold: 5 }),
    product({ title: "Mid", price: 50, original_price: 100, created_at: 3, sold: 50, rating: 5, review_count: 1 }),
    product({ title: "Dear", price: 900, created_at: 2, rating: 4.6, review_count: 80 }),
    product({ title: "Sold out", price: 1, created_at: 9, sold: 999, in_stock: false }),
  ]
  it.each([
    ["price_asc", ["Cheap", "Mid", "Dear", "Sold out"]],
    ["price_desc", ["Dear", "Mid", "Cheap", "Sold out"]],
    ["newest", ["Mid", "Dear", "Cheap", "Sold out"]],
    ["best_selling", ["Mid", "Cheap", "Dear", "Sold out"]],
    ["discount", ["Mid", "Dear", "Cheap", "Sold out"]],
  ] as const)("%s", (sort, expected) => {
    expect(titles(shop, { sort })[0]).toBe(expected[0])
    expect(titles(shop, { sort }).at(-1)).toBe("Sold out")
    if (sort !== "discount") expect(titles(shop, { sort })).toEqual(expected)
  })
  it("rating trusts many good reviews over one perfect one", () => {
    expect(titles(shop, { sort: "rating" }).slice(0, 2)).toEqual(["Dear", "Mid"])
  })
  it("defaults to the best match for a search and the most popular without one", () => {
    expect(find(shop, { q: "cheap" }).sort).toBe("relevance")
    expect(find(shop, {}).sort).toBe("popular")
  })
})

describe("pages", () => {
  const many = Array.from({ length: 53 }, (_, i) => product({ title: `Item ${i}`, price: i + 1 }))
  it("reaches every product", () => {
    const seen = new Set<string>()
    for (let page = 1; page <= 3; page++) for (const p of find(many, { page, limit: 24, sort: "price_asc" }).products) seen.add(p.id)
    expect(seen.size).toBe(53)
    expect(find(many, { limit: 24 })).toMatchObject({ count: 53, pages: 3 })
  })
  it("stays in range", () => {
    expect(find(many, { page: 99, limit: 24 })).toMatchObject({ page: 3 })
    expect(find(many, { page: -1, limit: 9999 })).toMatchObject({ page: 1 })
    expect(find(many, { limit: 9999 }).products).toHaveLength(53)
    expect(find([], {})).toMatchObject({ count: 0, pages: 1, page: 1, price: null })
  })
})

it("is quick on a big catalogue", () => {
  const adjectives = ["red", "blue", "cotton", "wooden", "handmade", "classic", "modern", "large"]
  const things = ["shirt", "chair", "lamp", "bag", "sneakers", "phone case", "blanket", "mug"]
  const big = Array.from({ length: 5000 }, (_, i) =>
    indexProduct(
      product({
        title: `${adjectives[i % 8]} ${things[(i >> 3) % 8]} ${i}`,
        description: "A lovely thing for the home made by local makers. ".repeat(6),
        options: { color: ["Red", "Blue"], size: ["S", "M"] },
        option_labels: { color: "Color", size: "Size" },
      })
    )
  )
  const started = Date.now()
  for (const q of ["cotton shirt", "handmde lmap", "sneakers blue", "nothing like this"]) search(big, { q, filters: { color: ["Red"] } })
  expect((Date.now() - started) / 4).toBeLessThan(400)
})
