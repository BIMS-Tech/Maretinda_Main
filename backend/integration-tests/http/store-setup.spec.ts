import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { applyCustomMigrations, bearer, createAdmin, createPublishableKey, createSeller, givePlan, makeReady, noThrow, pgOf } from "../helpers"

jest.setTimeout(240 * 1000)

/**
 * A shop sells only once its setup is done: store information, business
 * address, settlement bank details, and legal documents an admin approved.
 * Before that the seller can set up and draft products, but can't publish,
 * run promotions, or take orders.
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let pk: string

    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })

    beforeEach(async () => {
      pk = await createPublishableKey(getContainer())
    })

    async function sellerOnPlan(ready: boolean) {
      const seller = await createSeller(getContainer(), { handle: `shop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })
      await givePlan(getContainer(), seller.seller.id)
      if (ready) await makeReady(getContainer(), seller.seller.id)
      return { ...seller, as: { headers: bearer(seller.token), ...noThrow } }
    }

    async function publishedProductOf(sellerId: string, status = "published") {
      const container = getContainer()
      const [product] = await container.resolve(Modules.PRODUCT).createProducts([
        { title: `Item ${Date.now()}`, status: status as any, options: [{ title: "Size", values: ["M"] }], variants: [{ title: "M", options: { Size: "M" }, manage_inventory: false }] },
      ])
      await container.resolve(ContainerRegistrationKeys.LINK).create({ seller: { seller_id: sellerId }, [Modules.PRODUCT]: { product_id: product.id } })
      return product
    }

    /** A complete product as the panel sends it: Medusa needs options and a variant. */
    const product = (title: string, status: string) => ({
      title,
      status,
      options: [{ title: "Size", values: ["M"] }],
      variants: [{ title: "M", options: { Size: "M" }, manage_inventory: true, prices: [{ currency_code: "php", amount: 700 }] }],
    })

    const productRow = (id: string) => pgOf(getContainer())("product").where("id", id).first("status", "metadata")

    it("holds a product an unfinished shop publishes, instead of putting it on sale", async () => {
      const seller = await sellerOnPlan(false)

      const published = await api.post("/vendor/products", product("Barong", "proposed"), seller.as)
      const draft = await api.post("/vendor/products", product("Terno", "draft"), seller.as)

      expect(published.status).toBe(201)
      expect(await productRow(published.data.product.id)).toMatchObject({ status: "draft", metadata: { publish_when_ready: true } })
      // A plain draft stays a plain draft
      expect((await productRow(draft.data.product.id)).metadata?.publish_when_ready).toBeUndefined()
    })

    it("holds an existing draft the unfinished shop asks to publish, and says what is missing", async () => {
      const seller = await sellerOnPlan(false)
      const draft = await publishedProductOf(seller.seller.id, "draft")

      // Mercur changes a product's status only through /status
      const res = await api.post(`/vendor/products/${draft.id}/status`, { status: "proposed" }, seller.as)

      expect(res.status).toBe(200)
      expect(res.data).toMatchObject({ held: true, message: expect.stringMatching(/settlement bank details/) })
      expect(await productRow(draft.id)).toMatchObject({ status: "draft", metadata: { publish_when_ready: true } })

      // Another shop can't hold this shop's product
      const other = await sellerOnPlan(false)
      expect([403, 404]).toContain((await api.post(`/vendor/products/${draft.id}/status`, { status: "proposed" }, other.as)).status)
      expect((await productRow(draft.id)).metadata?.publish_when_ready).toBe(true)
    })

    it("publishes held products once the admin verifies a shop whose setup is done", async () => {
      const seller = await sellerOnPlan(false)
      const held = (await api.post("/vendor/products", product("Barong", "proposed"), seller.as)).data.product.id
      const plain = (await api.post("/vendor/products", product("Terno", "draft"), seller.as)).data.product.id
      await makeReady(getContainer(), seller.seller.id)
      await pgOf(getContainer())("seller").where("id", seller.seller.id).update({ verification_status: "pending_review" })

      const admin = bearer((await createAdmin(getContainer())).token)
      const res = await api.patch(`/admin/seller-verifications/${seller.seller.id}`, { status: "verified" }, { headers: admin, ...noThrow })
      expect(res.status).toBe(200)

      const live = await productRow(held)
      expect(live.status).toBe("published")
      expect(live.metadata?.publish_when_ready).toBeUndefined()
      expect((await productRow(plain)).status).toBe("draft")
    })

    it("publishes held products when a verified shop finishes its setup", async () => {
      const seller = await sellerOnPlan(false)
      const held = (await api.post("/vendor/products", product("Barong", "proposed"), seller.as)).data.product.id
      await makeReady(getContainer(), seller.seller.id)
      await pgOf(getContainer())("seller").where("id", seller.seller.id).update({ bank_name: null })
      expect((await productRow(held)).status).toBe("draft")

      // The last missing piece, saved from the store form
      await api.post("/vendor/sellers/me/bank-info", { bank_name: "Metrobank", account_number: "1234567890", account_name: "Test Shop Inc", branch_name: "Angeles" }, seller.as)
      // Published just after the save is answered
      let status = ""
      for (let i = 0; i < 40 && status !== "published"; i++) {
        await new Promise((r) => setTimeout(r, 250))
        status = (await productRow(held)).status
      }
      expect(status).toBe("published")
    })

    it("keeps promotions and reels until setup is done", async () => {
      const seller = await sellerOnPlan(false)

      expect((await api.post("/vendor/promotions", { code: "X" }, seller.as)).data).toMatchObject({ code: "setup_required" })
      expect((await api.post("/vendor/reels", { title: "x" }, seller.as)).data).toMatchObject({ code: "setup_required" })
    })

    it("lets a finished shop publish", async () => {
      const seller = await sellerOnPlan(true)

      const res = await api.post("/vendor/products", product("Barong", "proposed"), seller.as)

      expect(res.data?.code).not.toBe("setup_required")
    })

    it("hides an unfinished shop's products and refuses them in a cart", async () => {
      const unfinished = await sellerOnPlan(false)
      const finished = await sellerOnPlan(true)
      const product = await publishedProductOf(unfinished.seller.id)
      await publishedProductOf(finished.seller.id)

      const closed = await api.get("/store/closed-shops", { headers: { "x-publishable-api-key": pk } })
      expect(closed.data.handles).toContain(unfinished.seller.handle)
      expect(closed.data.handles).not.toContain(finished.seller.handle)

      const container = getContainer()
      const cart = await container.resolve(Modules.CART).createCarts({ currency_code: "php", items: [] })
      const res = await api.post(
        `/store/carts/${cart.id}/line-items`,
        { variant_id: product.variants[0].id, quantity: 1 },
        { headers: { "x-publishable-api-key": pk }, ...noThrow }
      )
      expect(res.status).toBe(400)
      expect(res.data.message).toMatch(/isn't taking orders/)
    })

    describe("a shop an admin suspended", () => {
      const suspend = async (sellerId: string) =>
        getContainer().resolve(ContainerRegistrationKeys.PG_CONNECTION)("seller").where("id", sellerId).update({ store_status: "SUSPENDED" })

      it("is closed to buyers even with a plan and a finished setup", async () => {
        const shop = await sellerOnPlan(true)
        const product = await publishedProductOf(shop.seller.id)
        await suspend(shop.seller.id)

        const closed = await api.get("/store/closed-shops", { headers: { "x-publishable-api-key": pk } })
        expect(closed.data.handles).toContain(shop.seller.handle)
        const cart = await getContainer().resolve(Modules.CART).createCarts({ currency_code: "php", items: [] })
        const res = await api.post(
          `/store/carts/${cart.id}/line-items`,
          { variant_id: product.variants[0].id, quantity: 1 },
          { headers: { "x-publishable-api-key": pk }, ...noThrow }
        )
        expect(res.status).toBe(400)
      })

      // Mercur itself refuses a suspended shop's changes
      it("can't change the shop, but can still look at it", async () => {
        const shop = await sellerOnPlan(true)
        await suspend(shop.seller.id)
        const create = await api.post("/vendor/products", { title: "New", status: "draft" }, shop.as)
        expect(create.status).toBe(403)
        expect((await api.get("/vendor/products", shop.as)).status).toBe(200)
      })
    })
  },
})
