import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { applyCustomMigrations, bearer, createAdmin, createPublishableKey, noThrow, pgOf } from "../helpers"

jest.setTimeout(180 * 1000)

/** The storefront newsletter form keeps a real list that admins can export. */
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

    it("signs an email up once, however often it's sent", async () => {
      const email = `Fan-${Date.now()}@Example.test`

      expect((await api.post("/store/newsletter", { email }, store())).status).toBe(200)
      expect((await api.post("/store/newsletter", { email: email.toLowerCase() }, store())).status).toBe(200)

      const rows = await pgOf(getContainer())("newsletter_subscriber").where("email", email.toLowerCase())
      expect(rows).toHaveLength(1)
    })

    it("refuses something that isn't an email", async () => {
      expect((await api.post("/store/newsletter", { email: "not-an-email" }, store())).status).toBe(400)
    })

    it("lets admins export the list, and no one else", async () => {
      const email = `export-${Date.now()}@example.test`
      await api.post("/store/newsletter", { email }, store())
      const { token } = await createAdmin(getContainer())

      const list = await api.get("/admin/newsletter-subscribers", { headers: bearer(token) })
      const csv = await api.get("/admin/newsletter-subscribers?format=csv", { headers: bearer(token), responseType: "text" as any })

      expect(list.data.subscribers.map((s: any) => s.email)).toContain(email)
      expect(csv.headers["content-type"]).toContain("text/csv")
      expect(csv.data).toContain(email)
      expect((await api.get("/admin/newsletter-subscribers", noThrow)).status).toBe(401)
    })
  },
})
