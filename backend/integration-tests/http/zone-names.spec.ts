import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { applyCustomMigrations, bearer, createSeller, givePlan, noThrow } from "../helpers"

jest.setTimeout(180 * 1000)

/**
 * Medusa keeps fulfillment set and service zone names unique across the
 * whole marketplace. Two sellers both calling their zone "Philippines" is
 * normal, so the second gets a name with their shop handle instead of an
 * error.
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })

    async function sellerWithLocation(handle: string) {
      const seller = await createSeller(getContainer(), { handle })
      await givePlan(getContainer(), seller.seller.id)
      const as = { headers: bearer(seller.token), ...noThrow }
      const location = await api.post("/vendor/stock-locations", { name: `${handle} warehouse` }, as)
      return { as, locationId: location.data.stock_location.id }
    }

    async function shippingSet(s: { as: any; locationId: string }, name: string) {
      const res = await api.post(`/vendor/stock-locations/${s.locationId}/fulfillment-sets`, { name, type: "shipping" }, s.as)
      const sets = res.data?.stock_location?.fulfillment_sets ?? []
      return { status: res.status, set: sets[sets.length - 1] }
    }

    it("lets two sellers both name a fulfillment set and a zone 'Philippines'", async () => {
      const a = await sellerWithLocation(`shop-a-${Date.now()}`)
      const b = await sellerWithLocation(`shop-b-${Date.now()}`)

      const setA = await shippingSet(a, "Philippines")
      const setB = await shippingSet(b, "Philippines")
      expect(setA.status).toBe(200)
      expect(setB.status).toBe(200)
      expect(setA.set.name).toBe("Philippines")
      expect(setB.set.name).toMatch(/^Philippines \(shop-b-/)

      const zone = { name: "Philippines", geo_zones: [{ type: "country", country_code: "ph" }] }
      const zoneA = await api.post(`/vendor/fulfillment-sets/${setA.set.id}/service-zones`, zone, a.as)
      const zoneB = await api.post(`/vendor/fulfillment-sets/${setB.set.id}/service-zones`, zone, b.as)
      expect(zoneA.status).toBe(200)
      expect(zoneB.status).toBe(200)
    })
  },
})
