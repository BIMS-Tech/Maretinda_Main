import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { sign } from "jsonwebtoken"
import {
  applicationBody,
  applyCustomMigrations,
  bearer,
  createAdmin,
  createCustomer,
  createPublishableKey,
  noThrow,
  pgOf,
} from "../helpers"
import { issueVerificationToken, sellerVerificationLink } from "../../src/lib/email-verification"

jest.setTimeout(300 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let pk: string
    let seq = 0

    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })
    beforeEach(async () => {
      process.env.EMAIL_VERIFICATION_REQUIRED = "true"
      pk = await createPublishableKey(getContainer())
    })
    afterAll(() => {
      process.env.EMAIL_VERIFICATION_REQUIRED = "false"
    })

    const store = (token?: string) => ({
      headers: { "x-publishable-api-key": pk, ...(token ? bearer(token) : {}) },
      ...noThrow,
    })
    const cartFor = async (customerId: string) => {
      const cart = await getContainer()
        .resolve(Modules.CART)
        .createCarts({ currency_code: "php", customer_id: customerId, email: "c@example.test" })
      return cart.id as string
    }
    const confirm = (token: string) => api.post("/store/email-verification/confirm", { token }, store())

    describe("buyers", () => {
      it("can't pay or place an order until they confirm their email", async () => {
        const { customer, token } = await createCustomer(getContainer())
        const cartId = await cartFor(customer.id)

        const complete = await api.post(`/store/carts/${cartId}/complete`, {}, store(token))
        expect(complete.status).toBe(403)
        expect(complete.data).toMatchObject({ code: "email_not_verified" })
        expect(complete.data.message).toContain(customer.email)

        // Without a sign-in the cart's own buyer is checked
        const anonymous = await api.post(`/store/carts/${cartId}/complete`, {}, store())
        expect(anonymous.data?.code).toBe("email_not_verified")

        // The payment step is refused too, so no online payment is taken first
        const [collection] = await getContainer()
          .resolve(Modules.PAYMENT)
          .createPaymentCollections([{ currency_code: "php", amount: 100 }])
        await getContainer()
          .resolve(ContainerRegistrationKeys.LINK)
          .create({ [Modules.CART]: { cart_id: cartId }, [Modules.PAYMENT]: { payment_collection_id: collection.id } })
        const session = await api.post(
          `/store/payment-collections/${collection.id}/payment-sessions`,
          { provider_id: "pp_system_default" },
          store(token)
        )
        expect(session.status).toBe(403)
        expect(session.data.code).toBe("email_not_verified")

        const status = await api.get("/store/email-verification", store(token))
        expect(status.data).toMatchObject({ verified: false, required: true, email: customer.email })
      })

      it("confirm with the emailed link; opening it again is harmless", async () => {
        const { customer, token } = await createCustomer(getContainer())
        const link = await issueVerificationToken(pgOf(getContainer()), "customer", customer.id, customer.email)

        const first = await confirm(link)
        expect(first.status).toBe(200)
        expect(first.data).toMatchObject({ confirmed: true, kind: "customer", already: false })
        const again = await confirm(link)
        expect(again.status).toBe(200)
        expect(again.data).toMatchObject({ confirmed: true, already: true })

        expect((await api.get("/store/email-verification", store(token))).data.verified).toBe(true)
        const complete = await api.post(`/store/carts/${await cartFor(customer.id)}/complete`, {}, store(token))
        expect(complete.data?.code).not.toBe("email_not_verified")
      })

      it("refuses unknown and expired links, and links sent to an address the account no longer uses", async () => {
        const pg = pgOf(getContainer())
        const { customer } = await createCustomer(getContainer())

        expect((await confirm("not-a-real-token")).data.code).toBe("invalid")

        const expired = await issueVerificationToken(pg, "customer", customer.id, customer.email)
        await pg("email_verification_token").where({ subject_id: customer.id }).update({ expires_at: new Date(Date.now() - 1000) })
        const late = await confirm(expired)
        expect(late.status).toBe(400)
        expect(late.data.code).toBe("expired")

        const old = await issueVerificationToken(pg, "customer", customer.id, customer.email)
        await getContainer().resolve(Modules.CUSTOMER).updateCustomers(customer.id, { email: `new-${Date.now()}@example.test` })
        expect((await confirm(old)).data.code).toBe("changed")
      })

      it("Google sign-ups, guest checkouts and buyers support has confirmed can order", async () => {
        const c = getContainer()
        const google = await createCustomer(c)
        await c.resolve(Modules.AUTH).createAuthIdentities([
          { provider_identities: [{ provider: "google", entity_id: `g-${Date.now()}` }], app_metadata: { customer_id: google.customer.id } },
        ])
        expect((await api.get("/store/email-verification", store(google.token))).data.verified).toBe(true)
        expect(await pgOf(c)("customer_email_verified").where("customer_id", google.customer.id).first("method")).toEqual({ method: "google" })

        const guest = await createCustomer(c, { has_account: false })
        const guestOrder = await api.post(`/store/carts/${await cartFor(guest.customer.id)}/complete`, {}, store())
        expect(guestOrder.data?.code).not.toBe("email_not_verified")

        const helped = await createCustomer(c)
        const { token: admin } = await createAdmin(c)
        const before = await api.get(`/admin/customers/${helped.customer.id}/email-verification`, { headers: bearer(admin), ...noThrow })
        expect(before.data).toMatchObject({ verified: false })
        const marked = await api.post(`/admin/customers/${helped.customer.id}/email-verification`, {}, { headers: bearer(admin), ...noThrow })
        expect(marked.status).toBe(200)
        const after = await api.get(`/admin/customers/${helped.customer.id}/email-verification`, { headers: bearer(admin), ...noThrow })
        expect(after.data).toMatchObject({ verified: true, method: "admin" })
      })

      it("can ask for a new link until they have confirmed", async () => {
        const pg = pgOf(getContainer())
        const { customer, token } = await createCustomer(getContainer())
        const resend = await api.post("/store/email-verification/resend", {}, store(token))
        expect(resend.status).toBe(200)
        expect(resend.data).toMatchObject({ verified: false })
        expect(await pg("email_verification_token").where({ kind: "customer", subject_id: customer.id }).count("* as n").first()).toEqual({ n: "1" })

        await pg("customer_email_verified").insert({ customer_id: customer.id, email: customer.email.toLowerCase(), method: "admin" })
        expect((await api.post("/store/email-verification/resend", {}, store(token))).data).toMatchObject({ verified: true, sent: false })
        expect((await api.post("/store/email-verification/resend", {}, store())).status).toBe(401)
      })
    })

    describe("seller applicants", () => {
      /** A pending application with its own login, as the seller panel's chat leaves it. */
      async function application() {
        const n = ++seq
        const email = `verify-applicant${n}-${Date.now()}@example.test`
        const [identity] = await getContainer()
          .resolve(Modules.AUTH)
          .createAuthIdentities([{ provider_identities: [{ provider: "emailpass", entity_id: email }] }])
        const id = `sapp_verify_${n}_${Date.now()}`
        await pgOf(getContainer())("seller_application").insert({
          id,
          email,
          first_name: "Applicant",
          last_name: `${n}`,
          business_name: `Verify Shop ${n} ${Date.now()}`,
          form_of_organization: "Sole Proprietorship",
          auth_identity_id: identity.id,
          status: "pending",
          submitted_at: new Date(),
        })
        const token = sign(
          { actor_id: "", actor_type: "seller", auth_identity_id: identity.id, app_metadata: {} },
          process.env.JWT_SECRET || "supersecret",
          { expiresIn: "1h" }
        )
        return { id, email, token }
      }
      const approve = async (id: string, admin: string) =>
        api.patch(`/admin/seller-applications/${id}`, { status: "approved" }, { headers: bearer(admin), ...noThrow })

      it("are approved only once their email is confirmed", async () => {
        const { token: admin } = await createAdmin(getContainer())
        const app = await application()

        const status = await api.get("/store/seller-application/status", store(app.token))
        expect(status.data).toMatchObject({ status: "pending", email_verified: false })

        const early = await approve(app.id, admin)
        expect(early.status).toBe(409)
        expect(early.data.code).toBe("email_not_verified")

        const url = await sellerVerificationLink(pgOf(getContainer()), app.id, app.email)
        const done = await confirm(new URL(url).searchParams.get("token")!)
        expect(done.data).toMatchObject({ confirmed: true, kind: "seller_application" })
        expect((await api.get("/store/seller-application/status", store(app.token))).data.email_verified).toBe(true)

        expect((await approve(app.id, admin)).status).toBe(200)
      })

      it("the team can mark an applicant's email as confirmed when the link never arrived", async () => {
        const { token: admin } = await createAdmin(getContainer())
        const app = await application()
        const marked = await api.post(`/admin/seller-applications/${app.id}/email-verified`, {}, { headers: bearer(admin), ...noThrow })
        expect(marked.status).toBe(200)
        expect(marked.data.application.email_verified_by).toMatch(/^admin:/)
        expect((await approve(app.id, admin)).status).toBe(200)
      })

      it("a new application waits for confirmation and the applicant can resend the link", async () => {
        const email = `verify-new-${Date.now()}@example.test`
        const ip = { "cf-connecting-ip": `198.51.100.${200 + (++seq % 50)}` }
        const reg = await api.post("/auth/seller/emailpass/register", { email, password: "Applicant-pass-1" }, { headers: ip, ...noThrow })
        const sent = await api.post("/store/seller-application", applicationBody(email), {
          headers: { "x-publishable-api-key": pk, ...ip, ...bearer(reg.data.token) },
          ...noThrow,
        })
        expect(sent.status).toBe(201)

        const pg = pgOf(getContainer())
        const row = await pg("seller_application").where("id", sent.data.application_id).first("email_verified_at")
        expect(row.email_verified_at).toBeNull()
        const links = () => pg("email_verification_token").where({ kind: "seller_application", subject_id: sent.data.application_id }).count("* as n").first()
        expect(await links()).toEqual({ n: "1" })

        const resend = await api.post("/store/email-verification/resend", {}, { ...store(reg.data.token), headers: { ...store(reg.data.token).headers, ...ip } })
        expect(resend.data).toMatchObject({ verified: false })
        expect(await links()).toEqual({ n: "2" })
      })
    })
  },
})
