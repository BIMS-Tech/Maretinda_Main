import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import { applicationBody, applyCustomMigrations, bearer, createAdmin, createPublishableKey, noThrow, pgOf } from "../helpers"

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

    describe("the application form", () => {
      /** Registers a login the way the panel does, then sends the application under it. */
      async function apply(body: Record<string, unknown>) {
        const pk = await createPublishableKey(getContainer())
        const email = String(body.email)
        // Each applicant from their own address, so the per-address limits don't trip
        const ip = { "cf-connecting-ip": `198.51.100.${++seq % 250}` }
        const reg = await api.post("/auth/seller/emailpass/register", { email, password: "Applicant-pass-1" }, { headers: ip, ...noThrow })
        const token = reg.data?.token
        return api.post("/store/seller-application", body, {
          headers: { "x-publishable-api-key": pk, ...ip, ...(token ? bearer(token) : {}) },
          ...noThrow,
        })
      }
      const fresh = () => `apply-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.test`

      it("needs a TIN, a PH mobile, a full address, what they sell, and both agreements", async () => {
        const cases: [Record<string, unknown>, RegExp][] = [
          [{ business_tin: "12345" }, /TIN/],
          [{ mobile_number: "12345" }, /mobile/],
          [{ business_postal_code: "20" }, /ZIP/],
          [{ business_city: "" }, /address/],
          [{ main_category: "" }, /mainly sell/],
          [{ product_source: "Smuggled" }, /products come from/],
          [{ vat_registered: "maybe" }, /VAT/],
          [{ terms_accepted: false }, /Seller Agreement/],
          [{ privacy_consent: undefined }, /privacy/],
          [{ form_of_organization: "Corporation" }, /signatory/],
        ]
        for (const [over, message] of cases) {
          const res = await apply(applicationBody(fresh(), over))
          expect([res.status, res.data.message]).toEqual([400, expect.stringMatching(message)])
        }
      })

      it("records consent and the cleaned details, and refuses a second pending application", async () => {
        const email = fresh()
        const first = await apply(applicationBody(email, { email: email.toUpperCase() }))
        expect(first.status).toBe(201)
        const row = await pgOf(getContainer())("seller_application").where("id", first.data.application_id).first()
        expect(row).toMatchObject({
          email,
          mobile_number: "+639171234567",
          business_tin: "123-456-789-000",
          shop_name: "Santos Crafts",
          vat_registered: false,
          business_address: "1 Rizal St, Balibago, Angeles City, Pampanga 2009",
          terms_version: expect.any(String),
        })
        expect(row.terms_accepted_at).toBeTruthy()
        expect(row.privacy_consent_at).toBeTruthy()
        expect(row.auth_identity_id).toBeTruthy()

        const again = await apply(applicationBody(email))
        expect(again.status).toBe(409)
      })

      it("approval opens the shop under its shop name with the TIN, VAT status, phone and address", async () => {
        const email = fresh()
        const res = await apply(applicationBody(email, { vat_registered: true }))
        const { token } = await createAdmin(getContainer())
        const approved = await approve(res.data.application_id, token)
        expect(approved.status).toBe(200)
        const seller = await pgOf(getContainer())("seller").where("id", approved.data.application.seller_id).first()
        expect(seller).toMatchObject({
          name: "Santos Crafts",
          tax_id: "123-456-789-000",
          vat_registered: true,
          phone: "+639171234567",
          city: "Angeles City",
          postal_code: "2009",
          country_code: "ph",
          form_of_organization: "Sole Proprietorship",
        })
        expect(seller.address_line).toBe("1 Rizal St, Balibago, Pampanga")
      })
    })
  },
})
