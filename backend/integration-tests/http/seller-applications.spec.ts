import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import { applyCustomMigrations, bearer, createAdmin, noThrow, pgOf } from "../helpers"

jest.setTimeout(300 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })

    let seq = 0

    /** A pending application with its own login, as the seller panel's chat leaves it. */
    async function application(businessName: string) {
      const n = ++seq
      const email = `applicant${n}-${Date.now()}@example.test`
      const [identity] = await getContainer()
        .resolve(Modules.AUTH)
        .createAuthIdentities([{ provider_identities: [{ provider: "emailpass", entity_id: email }] }])
      const id = `sapp_test_${n}_${Date.now()}`
      await pgOf(getContainer())("seller_application").insert({
        id,
        email,
        first_name: "Applicant",
        last_name: `${n}`,
        business_name: businessName,
        form_of_organization: "Sole Proprietorship",
        auth_identity_id: identity.id,
        status: "pending",
        submitted_at: new Date(),
      })
      return id
    }

    const approve = async (id: string, token: string) =>
      api.patch(`/admin/seller-applications/${id}`, { status: "approved" }, { headers: bearer(token), ...noThrow })

    // Mercur derives the seller handle from the shop name and handles are
    // unique, so approving a second "Sari-Sari Store" failed with a 500 the
    // admin panel didn't even show
    it("approves two shops with the same name, keeping the name and giving distinct handles", async () => {
      const { token } = await createAdmin(getContainer())
      const first = await approve(await application("Sari-Sari Store"), token)
      const second = await approve(await application("Sari-Sari Store"), token)

      expect([first.status, second.status]).toEqual([200, 200])
      const sellers = await pgOf(getContainer())("seller")
        .whereIn("id", [first.data.application.seller_id, second.data.application.seller_id])
        .select("name", "handle")
      expect(sellers.map((s: { name: string }) => s.name)).toEqual(["Sari-Sari Store", "Sari-Sari Store"])
      expect(new Set(sellers.map((s: { handle: string }) => s.handle)).size).toBe(2)
    })
  },
})
