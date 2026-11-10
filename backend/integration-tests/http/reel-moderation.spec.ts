import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { applyCustomMigrations, bearer, createAdmin, createPublishableKey, createSeller, givePlan, noThrow, pgOf } from "../helpers"

jest.setTimeout(180 * 1000)

/**
 * Admins can hide a seller's reel (with a reason the seller sees), bring it
 * back, or remove it. A hidden reel is gone from the storefront, and the
 * seller can't republish it themselves.
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let pk: string
    const store = () => ({ headers: { "x-publishable-api-key": pk }, ...noThrow })

    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })

    beforeEach(async () => {
      pk = await createPublishableKey(getContainer())
    })

    async function publishedReel() {
      const seller = await createSeller(getContainer(), { name: "Reel Shop" })
      await givePlan(getContainer(), seller.seller.id)
      const id = `reel_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      await pgOf(getContainer())("seller_reel").insert({
        id,
        seller_id: seller.seller.id,
        title: "New barong drop",
        video_url: "https://media.example.test/v.mp4",
        status: "published",
        published_at: new Date(),
      })
      const admin = await createAdmin(getContainer())
      return { id, seller, asAdmin: { headers: bearer(admin.token), ...noThrow } }
    }

    const onStorefront = async (id: string) => {
      const list = await api.get("/store/reels", store())
      const single = await api.get(`/store/reels/${id}`, store())
      return { listed: list.data.reels.some((r: any) => r.id === id), status: single.status }
    }

    it("lists reels for admins with the shop's name", async () => {
      const { id, asAdmin } = await publishedReel()

      const res = await api.get("/admin/reels", asAdmin)

      expect(res.status).toBe(200)
      expect(res.data.reels.find((r: any) => r.id === id)).toMatchObject({ seller_name: "Reel Shop", moderation_status: "visible" })
    })

    it("keeps the admin routes from sellers", async () => {
      const { id, seller } = await publishedReel()

      expect((await api.get("/admin/reels", { headers: bearer(seller.token), ...noThrow })).status).toBe(401)
      expect((await api.post(`/admin/reels/${id}/hide`, { reason: "x" }, { headers: bearer(seller.token), ...noThrow })).status).toBe(401)
    })

    it("hides a reel from the storefront and tells the seller why", async () => {
      const { id, seller, asAdmin } = await publishedReel()

      const res = await api.post(`/admin/reels/${id}/hide`, { reason: "Shows a counterfeit brand" }, asAdmin)

      expect(res.status).toBe(200)
      expect(await onStorefront(id)).toEqual({ listed: false, status: 404 })
      const own = await api.get(`/vendor/reels/${id}`, { headers: bearer(seller.token) })
      expect(own.data.reel).toMatchObject({ moderation_status: "hidden", moderation_reason: "Shows a counterfeit brand" })
    })

    it("needs a reason to hide a reel", async () => {
      const { id, asAdmin } = await publishedReel()

      expect((await api.post(`/admin/reels/${id}/hide`, {}, asAdmin)).status).toBe(400)
    })

    it("won't let the seller republish a hidden reel", async () => {
      const { id, seller, asAdmin } = await publishedReel()
      await api.post(`/admin/reels/${id}/hide`, { reason: "Spam" }, asAdmin)

      await api.post(`/vendor/reels/${id}`, { status: "published", title: "Back again" }, { headers: bearer(seller.token), ...noThrow })

      expect(await onStorefront(id)).toEqual({ listed: false, status: 404 })
    })

    it("brings a hidden reel back", async () => {
      const { id, asAdmin } = await publishedReel()
      await api.post(`/admin/reels/${id}/hide`, { reason: "Spam" }, asAdmin)

      expect((await api.post(`/admin/reels/${id}/unhide`, {}, asAdmin)).status).toBe(200)

      expect(await onStorefront(id)).toEqual({ listed: true, status: 200 })
    })

    it("removes a reel", async () => {
      const { id, asAdmin } = await publishedReel()

      expect((await api.delete(`/admin/reels/${id}`, asAdmin)).status).toBe(200)

      expect(await onStorefront(id)).toEqual({ listed: false, status: 404 })
      expect((await api.get("/admin/reels", asAdmin)).data.reels.some((r: any) => r.id === id)).toBe(false)
    })
  },
})
