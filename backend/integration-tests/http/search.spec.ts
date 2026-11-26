import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { createProductsWorkflow, createRegionsWorkflow } from "@medusajs/core-flows"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { forgetCatalog } from "../../src/lib/search/catalog"
import FlashSaleService from "../../src/services/flash-sale"
import { applyCustomMigrations, createPublishableKey, createSeller, givePlan, makeReady, noThrow, pgOf } from "../helpers"

jest.setTimeout(300 * 1000)

/**
 * The store's listings and search read the live database, so what a shopper
 * finds is what is on sale now: no separate index to fall out of date.
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let pk: string
    let region: any
    let shop: any
    let seq = 0

    beforeAll(async () => {
      process.env.SEARCH_FRESH_MS = "0"
      await applyCustomMigrations(getContainer())
      await new FlashSaleService(getContainer() as any).initTables()
      await pgOf(getContainer()).raw(`
        CREATE TABLE IF NOT EXISTS brand (id text PRIMARY KEY, name text, slug text, is_active boolean DEFAULT true, deleted_at timestamptz);
        CREATE TABLE IF NOT EXISTS product_brand (id text PRIMARY KEY, product_id text, brand_id text, deleted_at timestamptz)`)
    })
    afterAll(() => {
      delete process.env.SEARCH_FRESH_MS
    })
    beforeEach(async () => {
      forgetCatalog()
      pk = await createPublishableKey(getContainer())
      region = (
        await createRegionsWorkflow(getContainer()).run({
          input: { regions: [{ name: "Philippines", currency_code: "php", countries: ["ph"], payment_providers: ["pp_system_default"] }] },
        })
      ).result[0]
      shop = await openShop("Aling Nena Store")
    })

    const get = (path: string) => api.get(path, { headers: { "x-publishable-api-key": pk }, ...noThrow })
    const search = async (query = "") => (await get(`/store/search?${query}`)).data
    const titles = async (query = "") => (await search(query)).products.map((p: any) => p.title)

    async function openShop(name: string) {
      const s = await createSeller(getContainer(), { name })
      await givePlan(getContainer(), s.seller.id)
      await makeReady(getContainer(), s.seller.id)
      return s.seller
    }

    /** A published product, with its stock unmanaged so it can always be bought. */
    async function product(title: string, over: { price?: number; seller?: any; options?: Record<string, string[]>; status?: string; extra?: any } = {}) {
      const options = over.options ?? { Title: ["Default"] }
      const names = Object.keys(options)
      const combos = names.reduce<Record<string, string>[]>(
        (acc, name) => acc.flatMap((c) => options[name].map((v) => ({ ...c, [name]: v }))),
        [{}]
      )
      const { result } = await createProductsWorkflow(getContainer()).run({
        input: {
          products: [
            {
              title,
              handle: `p-${++seq}-${Date.now()}`,
              status: (over.status ?? "published") as any,
              options: names.map((n) => ({ title: n, values: options[n] })),
              variants: combos.map((c, i) => ({
                title: Object.values(c).join(" / "),
                manage_inventory: false,
                options: c,
                prices: [{ amount: (over.price ?? 100) + i, currency_code: "php" }],
              })),
              ...over.extra,
            },
          ],
        },
      })
      const p: any = result[0]
      const seller = over.seller === null ? null : (over.seller ?? shop)
      if (seller) {
        await pgOf(getContainer())("seller_seller_product_product").insert({ id: `spl_${p.id}`, seller_id: seller.id, product_id: p.id })
      }
      return p
    }

    it("lists published products of open shops at their price in pesos", async () => {
      await product("Barong", { price: 1499 })
      await product("Draft", { status: "draft" })

      const r = await search()
      expect(r).toMatchObject({ count: 1, currency_code: "php" })
      expect(r.products[0]).toMatchObject({
        title: "Barong",
        price: 1499,
        original_price: 1499,
        in_stock: true,
        variant_count: 1,
        seller: { name: "Aling Nena Store", verified: true },
      })
      expect(r.products[0].variant_id).toBeTruthy()
    })

    it("is up to date as soon as something changes", async () => {
      const p = await product("Barong")
      expect(await titles("q=barong")).toEqual(["Barong"])
      await pgOf(getContainer())("product").where("id", p.id).update({ title: "Piña Barong" })
      expect(await titles("q=pina")).toEqual(["Piña Barong"])
      await pgOf(getContainer())("product").where("id", p.id).update({ status: "draft" })
      expect(await titles("q=barong")).toEqual([])
    })

    it("hides shops that are suspended, off their plan, or not set up", async () => {
      const suspended = await openShop("Suspended")
      const lapsed = await openShop("Lapsed")
      const { seller: unready } = await createSeller(getContainer(), { name: "Unready" })
      await givePlan(getContainer(), unready.id)
      for (const [name, seller] of [["A", suspended], ["B", lapsed], ["C", unready], ["D", shop]] as const) await product(name, { seller })
      await pgOf(getContainer())("seller").where("id", suspended.id).update({ store_status: "SUSPENDED" })
      await pgOf(getContainer())("seller_subscription").where("seller_id", lapsed.id).update({ status: "expired" })

      expect(await titles()).toEqual(["D"])
      // Nor are they suggested by name
      expect((await get("/store/search/suggest?q=suspended")).data.shops).toEqual([])
    })

    it("sorts by price, both ways, and newest", async () => {
      await product("Mid", { price: 500 })
      await product("Low", { price: 100 })
      await product("High", { price: 900 })
      expect(await titles("sort=price_asc")).toEqual(["Low", "Mid", "High"])
      expect(await titles("sort=price_desc")).toEqual(["High", "Mid", "Low"])
      expect(await titles("sort=newest")).toEqual(["High", "Low", "Mid"])
    })

    it("uses sale prices for sorting, filtering and the discount", async () => {
      const p = await product("On sale", { price: 1000 })
      await product("Regular", { price: 600 })
      const pg = pgOf(getContainer())
      const set = await pg("product_variant_price_set as l").join("product_variant as v", "v.id", "l.variant_id").where("v.product_id", p.id).first("l.price_set_id")
      await getContainer()
        .resolve(Modules.PRICING)
        .createPriceLists([
          { title: "Sale", description: "Sale", type: "sale" as any, status: "active" as any, prices: [{ amount: 400, currency_code: "php", price_set_id: set.price_set_id }] },
        ])

      expect(await titles("sort=price_asc")).toEqual(["On sale", "Regular"])
      expect((await search("on_sale=1")).products).toEqual([expect.objectContaining({ title: "On sale", price: 400, original_price: 1000 })])
      expect(await titles("max_price=450")).toEqual(["On sale"])
    })

    it("uses flash sale prices while the sale runs", async () => {
      const p = await product("Flash", { price: 1000 })
      const pg = pgOf(getContainer())
      await pg("flash_sale").insert({ id: "fs_1", title: "Sale", status: "active", starts_at: new Date(Date.now() - 1e6), ends_at: new Date(Date.now() + 1e6) })
      await pg("flash_sale_item").insert({ id: "fsi_1", flash_sale_id: "fs_1", product_id: p.id, discount_type: "percentage", discount_value: 25, item_status: "approved" })
      expect((await search()).products[0]).toMatchObject({ price: 750, original_price: 1000, flash_sale: true })
      await pg("flash_sale").where("id", "fs_1").update({ ends_at: new Date(Date.now() - 1000) })
      expect((await search()).products[0]).toMatchObject({ price: 1000, flash_sale: false })
    })

    it("takes a flash sale off the regular price, as the cart does, even during another sale", async () => {
      const p = await product("Both", { price: 1000 })
      const pg = pgOf(getContainer())
      const set = await pg("product_variant_price_set as l").join("product_variant as v", "v.id", "l.variant_id").where("v.product_id", p.id).first("l.price_set_id")
      await getContainer()
        .resolve(Modules.PRICING)
        .createPriceLists([
          { title: "Sale", description: "Sale", type: "sale" as any, status: "active" as any, prices: [{ amount: 900, currency_code: "php", price_set_id: set.price_set_id }] },
        ])
      await pg("flash_sale").insert({ id: "fs_2", title: "Sale", status: "active", starts_at: new Date(Date.now() - 1e6), ends_at: new Date(Date.now() + 1e6) })
      await pg("flash_sale_item").insert({ id: "fsi_2", flash_sale_id: "fs_2", product_id: p.id, discount_type: "fixed", discount_value: 400, item_status: "approved" })
      expect((await search()).products[0]).toMatchObject({ price: 600, original_price: 1000, flash_sale: true })
    })

    it("filters by what products are sold in, and counts every choice", async () => {
      await product("Red shirt", { options: { Color: ["Red"], Size: ["S", "M"] } })
      await product("Blue shirt", { options: { Colour: ["Blue"], Size: ["L"] } })
      await product("Mug")

      const r = await search("color=Red")
      expect(r.products.map((p: any) => p.title)).toEqual(["Red shirt"])
      const color = r.facets.find((f: any) => f.name === "color")
      expect(color.values.map((v: any) => [v.label, v.count, v.selected])).toEqual(expect.arrayContaining([["Red", 1, true], ["Blue", 1, false]]))
      expect(await titles("color=Red&color=Blue&sort=newest")).toEqual(["Blue shirt", "Red shirt"])
      expect(await titles("size=L")).toEqual(["Blue shirt"])
    })

    it("filters by brand, and by shop", async () => {
      const p = await product("Samba")
      const other = await openShop("Other shop")
      await product("Bag", { seller: other })
      const pg = pgOf(getContainer())
      await pg("brand").insert({ id: "br_1", name: "Adidas" })
      await pg("product_brand").insert({ id: "pb_1", product_id: p.id, brand_id: "br_1" })
      expect(await titles("brand=adidas")).toEqual(["Samba"])
      expect(await titles("q=adidas")).toEqual(["Samba"])
      expect(await titles(`seller=${other.handle}`)).toEqual(["Bag"])
      expect(await titles(`store=${other.handle}`)).toEqual(["Bag"])
    })

    it("a category includes the categories inside it", async () => {
      const products = getContainer().resolve(Modules.PRODUCT)
      const [parent] = await products.createProductCategories([{ name: "Footwear", is_active: true } as any])
      const [child] = await products.createProductCategories([{ name: "Boots", is_active: true, parent_category_id: parent.id } as any])
      await product("Hiking boots", { extra: { category_ids: [child.id] } })
      await product("Mug")
      expect(await titles(`category_id=${parent.id}`)).toEqual(["Hiking boots"])
      expect(await titles("category=boots")).toEqual(["Hiking boots"])
    })

    it("rates products from their reviews", async () => {
      const good = await product("Good")
      const poor = await product("Poor")
      await product("Unrated")
      const pg = pgOf(getContainer())
      for (const [i, [p, rating]] of ([[good, 5], [good, 4], [poor, 2]] as [any, number][]).entries()) {
        await pg("review").insert({ id: `rev_${i}`, reference: "product", rating })
        await pg("product_product_review_review").insert({ id: `pr_${i}`, product_id: p.id, review_id: `rev_${i}` })
      }
      const r = await search("rating=4")
      expect(r.products).toEqual([expect.objectContaining({ title: "Good", rating: 4.5, review_count: 2 })])
      expect((await titles("sort=rating"))[0]).toBe("Good")
    })

    it("says what is sold out, and puts it last", async () => {
      const p = await product("Gone", { price: 1 })
      await product("Here", { price: 50 })
      await pgOf(getContainer())("product_variant").where("product_id", p.id).update({ manage_inventory: true })
      const r = await search("sort=price_asc")
      expect(r.products.map((x: any) => [x.title, x.in_stock])).toEqual([["Here", true], ["Gone", false]])
      expect(await titles("in_stock=1")).toEqual(["Here"])
    })

    it("pages through everything", async () => {
      for (let i = 0; i < 7; i++) await product(`Item ${i}`, { price: 10 + i })
      const first = await search("limit=3&sort=price_asc")
      expect(first).toMatchObject({ count: 7, pages: 3, page: 1 })
      expect(await titles("limit=3&sort=price_asc&page=3")).toEqual(["Item 6"])
    })

    it("suggests products, categories and shops while typing", async () => {
      const products = getContainer().resolve(Modules.PRODUCT)
      const [boots] = await products.createProductCategories([{ name: "Boots", is_active: true } as any])
      await product("Leather boots", { extra: { category_ids: [boots.id] } })
      await product("Mug")
      const { data } = await get("/store/search/suggest?q=boo")
      expect(data.products.map((p: any) => p.title)).toEqual(["Leather boots"])
      expect(data.categories[0]).toMatchObject({ name: "Boots", handle: "boots" })
      expect((await get("/store/search/suggest?q=nena")).data.shops[0]).toMatchObject({ name: "Aling Nena Store" })
      expect((await get("/store/search/suggest")).data.products.length).toBe(2)
    })

    it("shrugs off rubbish", async () => {
      await product("Mug")
      for (const q of [
        "page=-1&limit=abc", "min_price=abc&max_price=-5", "sort=drop table", "rating=99", "q=%25%27%22%5C%00", "color[$ne]=1",
        "category_id=%27%20OR%201%3D1", "q=" + "x".repeat(5000), "__proto__=1&constructor=2",
      ]) {
        expect((await get(`/store/search?${q}`)).status).toBe(200)
      }
      expect((await get("/store/search?min_price=300&max_price=10")).status).toBe(200)
      expect(getContainer().resolve(ContainerRegistrationKeys.PG_CONNECTION)).toBeTruthy()
    })

    it("needs the store's key, like every store route", async () => {
      expect((await api.get("/store/search", noThrow)).status).toBe(400)
      expect(region.id).toBeTruthy()
    })
  },
})
