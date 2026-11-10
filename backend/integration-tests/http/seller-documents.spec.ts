import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { applyCustomMigrations, bearer, createAdmin, createPublishableKey, createSeller, multipart, noThrow } from "../helpers"

jest.setTimeout(180 * 1000)

/**
 * Seller applicants upload IDs, permits and tax forms. Those used to go to
 * the public media bucket; now they're kept privately and only admins can
 * open them.
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let pk: string
    const PNG = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex")

    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })

    beforeEach(async () => {
      pk = await createPublishableKey(getContainer())
    })

    async function upload() {
      const { body, headers } = multipart("permit.png", "image/png", PNG)
      return api.post("/store/uploads", body, { headers: { ...headers, "x-publishable-api-key": pk }, ...noThrow })
    }

    it("keeps an uploaded document private and hands back an admin link", async () => {
      const res = await upload()

      expect(res.status).toBe(200)
      expect(res.data.files[0].url).toMatch(/^\/admin\/documents\/doc_/)
    })

    it("lets an admin open the document", async () => {
      const url = (await upload()).data.files[0].url
      const { token } = await createAdmin(getContainer())

      const res = await api.get(url, { headers: bearer(token), responseType: "arraybuffer" as any })

      expect(res.status).toBe(200)
      expect(res.headers["content-type"]).toContain("image/png")
      expect(Buffer.from(res.data).equals(PNG)).toBe(true)
    })

    it("keeps the document from everyone else", async () => {
      const url = (await upload()).data.files[0].url
      const { token } = await createSeller(getContainer())

      expect((await api.get(url, noThrow)).status).toBe(401)
      expect((await api.get(url, { headers: bearer(token), ...noThrow })).status).toBe(401)
    })
  },
})
