import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { applyCustomMigrations, bearer, createPublishableKey, createSeller, givePlan, makeReady, noThrow } from "../helpers"

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

    it("lets an unfinished shop draft a product but not publish one", async () => {
      const seller = await sellerOnPlan(false)

      const published = await api.post("/vendor/products", { title: "Barong", status: "proposed" }, seller.as)
      const draft = await api.post("/vendor/products", { title: "Barong", status: "draft" }, seller.as)

      expect(published.status).toBe(403)
      expect(published.data).toMatchObject({ code: "setup_required" })
      expect(published.data.message).toMatch(/settlement bank details/)
      expect(draft.data?.code).not.toBe("setup_required")
    })

    it("won't publish an existing draft for an unfinished shop", async () => {
      const seller = await sellerOnPlan(false)
      const draft = await publishedProductOf(seller.seller.id, "draft")

      // Mercur changes a product's status only through /status
      const res = await api.post(`/vendor/products/${draft.id}/status`, { status: "proposed" }, seller.as)

      expect(res.data).toMatchObject({ code: "setup_required" })
    })

    it("keeps promotions and reels until setup is done", async () => {
      const seller = await sellerOnPlan(false)

      expect((await api.post("/vendor/promotions", { code: "X" }, seller.as)).data).toMatchObject({ code: "setup_required" })
      expect((await api.post("/vendor/reels", { title: "x" }, seller.as)).data).toMatchObject({ code: "setup_required" })
    })

    it("lets a finished shop publish", async () => {
      const seller = await sellerOnPlan(true)

      const res = await api.post("/vendor/products", { title: "Barong", status: "proposed" }, seller.as)

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
  },
})
