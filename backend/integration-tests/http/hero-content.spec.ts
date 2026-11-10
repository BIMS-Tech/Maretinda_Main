import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
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
  },
})
