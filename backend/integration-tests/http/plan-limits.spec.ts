import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import { applyCustomMigrations, bearer, createSeller, givePlan, noThrow, pgOf, seedPlans } from "../helpers"

jest.setTimeout(180 * 1000)

/**
 * What each plan includes, held by the API as the panel shows it: Starter has
 * a product cap and one staff seat, and flash sales and promotions come with
 * Growth and Premium. Without this a Starter seller could call /vendor
 * directly and get Growth features.
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })

    beforeEach(async () => {
      await seedPlans(getContainer())
    })

    async function sellerOn(plan: "Starter" | "Growth") {
      const seller = await createSeller(getContainer())
      await givePlan(getContainer(), seller.seller.id, { plan_name: plan })
      return { ...seller, as: { headers: bearer(seller.token), ...noThrow } }
    }

    async function giveProducts(sellerId: string, count: number) {
      const container = getContainer()
      const products = await container.resolve(Modules.PRODUCT).createProducts(
        Array.from({ length: count }, (_, i) => ({ title: `P${i}-${Date.now()}` }))
      )
      await pgOf(container)("seller_seller_product_product").insert(
        products.map((p: any) => ({ id: `l_${p.id}`, seller_id: sellerId, product_id: p.id }))
      )
    }

    const setStarterMaxProducts = (max: number) =>
      pgOf(getContainer()).raw(
        `UPDATE subscription_plan SET features = jsonb_set(COALESCE(features, '{}'::jsonb), '{max_products}', ?::jsonb) WHERE name = 'Starter'`,
        [String(max)]
      )

    it("stops a Starter seller at the plan's product cap", async () => {
      await setStarterMaxProducts(1)
      const seller = await sellerOn("Starter")
      await giveProducts(seller.seller.id, 1)

      const res = await api.post("/vendor/products", { title: "One too many" }, seller.as)

      expect(res.status).toBe(403)
      expect(res.data).toMatchObject({ code: "plan_limit" })
      expect(res.data.message).toMatch(/1 product/)
    })

    it("lets a Growth seller past the Starter cap", async () => {
      await setStarterMaxProducts(1)
      const seller = await sellerOn("Growth")
      await giveProducts(seller.seller.id, 1)

      const res = await api.post("/vendor/products", { title: "Second" }, seller.as)

      expect(res.data?.code).not.toBe("plan_limit")
    })

    it("keeps flash sales and promotions to Growth and Premium", async () => {
      const starter = await sellerOn("Starter")
      const growth = await sellerOn("Growth")

      const flash = await api.post("/vendor/flash-sales/fs_x/items", { product_id: "prod_x" }, starter.as)
      const promo = await api.post("/vendor/promotions", { code: "X" }, starter.as)
      expect(flash.status).toBe(403)
      expect(flash.data).toMatchObject({ code: "plan_feature" })
      expect(promo.data).toMatchObject({ code: "plan_feature" })

      expect((await api.post("/vendor/flash-sales/fs_x/items", { product_id: "prod_x" }, growth.as)).data?.code).not.toBe("plan_feature")
    })

    it("holds Starter to one staff seat", async () => {
      const seller = await sellerOn("Starter")

      const res = await api.post("/vendor/invites", { email: `staff-${Date.now()}@example.test`, role: "member" }, seller.as)

      expect(res.status).toBe(403)
      expect(res.data).toMatchObject({ code: "plan_limit" })
    })
  },
})
