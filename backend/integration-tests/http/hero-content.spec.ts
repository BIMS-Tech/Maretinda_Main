import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import { applyCustomMigrations, createPublishableKey, createSeller, pgOf } from "../helpers"

jest.setTimeout(300 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })

    it("counts active sellers that haven't been deleted", async () => {
      const key = await createPublishableKey(getContainer())
      await createSeller(getContainer())
      await createSeller(getContainer())
      const { seller: gone } = await createSeller(getContainer())
      await pgOf(getContainer())("seller").where("id", gone.id).update({ deleted_at: new Date() })

      const res = await api.get("/store/hero-content", { headers: { "x-publishable-api-key": key } })

      expect(res.data.sellers_count).toBe("2")
    })

    it("counts the featured product's own reviews and sales, whatever was typed in", async () => {
      const key = await createPublishableKey(getContainer())
      const pg = pgOf(getContainer())
      const [product] = await getContainer().resolve(Modules.PRODUCT).createProducts([{ title: "Barong", handle: "barong", status: "published" } as any])
      for (const [i, rating] of [5, 4].entries()) {
        await pg("review").insert({ id: `rev_${i}`, reference: "product", rating })
        await pg("product_product_review_review").insert({ id: `pr_${i}`, product_id: product.id, review_id: `rev_${i}` })
      }
      await pg("site_settings")
        .insert({ key: "hero", value: JSON.stringify({ featured_product_link: "/products/barong", featured_product_rating_count: 248, featured_product_sold_this_week: 247 }) })
        .onConflict("key")
        .merge(["value"])

      const res = await api.get("/store/hero-content", { headers: { "x-publishable-api-key": key } })
      expect(res.data.site_settings).toMatchObject({ featured_product_rating: 4.5, featured_product_rating_count: 2, featured_product_sold_this_week: 0 })
    })
  },
})
