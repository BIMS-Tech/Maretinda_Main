import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import { applyCustomMigrations, bearer, createAdmin, createPublishableKey, noThrow, pgOf } from "../helpers"

jest.setTimeout(300 * 1000)

const PASSWORD = "Test-pass-123"
const payloadOf = (token: string) => JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString())

/**
 * Medusa checks a password without looking at the account type, so a seller's
 * email and password are accepted on the shopper sign-in and answered with a
 * token that belongs to no shopper. These routes tell the store whose sign-in
 * it is, and let that person start shopping with it.
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let pk: string
    let seq = 0
    let calls = 0

    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })
    beforeEach(async () => {
      pk = await createPublishableKey(getContainer())
    })

    // A new address each time: the route is rate limited per buyer
    const store = (token?: string) => ({
      headers: {
        "x-publishable-api-key": pk,
        "cf-connecting-ip": `203.0.113.${++calls % 250}`,
        ...(token ? bearer(token) : {}),
      },
      ...noThrow,
    })
    const email = () => `person${++seq}-${Date.now()}@example.test`
    const signIn = (actor: string, address: string, password = PASSWORD) =>
      api.post(`/auth/${actor}/emailpass`, { email: address, password }, noThrow)
    const state = async (token: string) => (await api.get("/store/auth/shopper-profile", store(token))).data
    const startShopping = (token: string) => api.post("/store/auth/shopper-profile", {}, store(token))

    /** A real email/password sign-in with nothing attached to it yet. */
    async function identity(address = email()) {
      const { data } = await api.post("/auth/seller/emailpass/register", { email: address, password: PASSWORD })
      return { address, authIdentityId: payloadOf(data.token).auth_identity_id as string }
    }

    /** A seller who signs in with a real password. */
    async function seller(over: { name?: string } = {}) {
      const id = await identity()
      const sellerModule = getContainer().resolve("seller") as any
      const [shop] = await sellerModule.createSellers([{ name: "Santos Crafts", handle: `santos-${seq}-${Date.now()}` }])
      const [member] = await sellerModule.createMembers([
        { name: over.name ?? "Maria Santos", email: id.address, seller_id: shop.id, phone: "+639171234567" },
      ])
      await getContainer().resolve(Modules.AUTH).updateAuthIdentities({ id: id.authIdentityId, app_metadata: { seller_id: member.id } })
      return { ...id, shop, member }
    }

    describe("whose sign-in is it", () => {
      it("accepts a seller's password on the shopper sign-in, with no shopper behind it", async () => {
        const s = await seller()
        const res = await signIn("customer", s.address)
        expect(res.status).toBe(200)
        expect(payloadOf(res.data.token).actor_id).toBe("")
        expect((await api.get("/store/customers/me", store(res.data.token))).status).toBe(401)
      })

      it("recognises a seller", async () => {
        const s = await seller()
        const { data } = await signIn("customer", s.address)
        expect(await state(data.token)).toMatchObject({ kind: "seller", email: s.address, shop_name: "Santos Crafts", can_shop: true })
      })

      it("recognises a seller applicant and where the application stands", async () => {
        const id = await identity()
        await pgOf(getContainer())("seller_application").insert({
          id: `sapp_${seq}_${Date.now()}`,
          email: id.address,
          first_name: "Maria",
          last_name: "Santos",
          shop_name: "Santos Crafts",
          status: "pending",
          auth_identity_id: id.authIdentityId,
        })
        const { data } = await signIn("customer", id.address)
        expect(await state(data.token)).toMatchObject({ kind: "applicant", application_status: "pending", shop_name: "Santos Crafts", can_shop: true })
      })

      it("recognises a sign-up that never finished", async () => {
        const id = await identity()
        const { data } = await signIn("customer", id.address)
        expect(await state(data.token)).toMatchObject({ kind: "unfinished", email: id.address, can_shop: true })
      })

      it("doesn't say a team sign-in is one, and won't turn it into a shopper", async () => {
        const id = await identity()
        const { user } = await createAdmin(getContainer())
        await getContainer().resolve(Modules.AUTH).updateAuthIdentities({ id: id.authIdentityId, app_metadata: { user_id: user.id } })
        const { data } = await signIn("customer", id.address)
        const found = await state(data.token)
        expect(found).toMatchObject({ kind: "other", can_shop: false })
        expect(JSON.stringify(found)).not.toMatch(/admin|team|user_id/i)
        expect((await startShopping(data.token)).status).toBe(403)
      })

      it("answers nothing without a valid sign-in", async () => {
        expect((await api.get("/store/auth/shopper-profile", store())).status).toBe(401)
        expect((await api.get("/store/auth/shopper-profile", store("not.a.token"))).status).toBe(401)
        expect((await startShopping("not.a.token")).status).toBe(401)
      })
    })

    describe("start shopping with the same sign-in", () => {
      it("gives a seller a shopper account that works, and leaves the shop's sign-in alone", async () => {
        const s = await seller()
        const { data } = await signIn("customer", s.address)

        const created = await startShopping(data.token)
        expect(created.status).toBe(200)
        const me = await api.get("/store/customers/me", store(created.data.token))
        expect(me.status).toBe(200)
        expect(me.data.customer).toMatchObject({ email: s.address, first_name: "Maria", last_name: "Santos", has_account: true })

        // Next sign-ins go straight in, on both sides
        const again = await signIn("customer", s.address)
        expect(payloadOf(again.data.token).actor_id).toBe(me.data.customer.id)
        const asSeller = await signIn("seller", s.address)
        expect(payloadOf(asSeller.data.token).actor_id).toBe(s.member.id)
      })

      it("uses the sign-in's own email, whatever is sent", async () => {
        const s = await seller()
        const { data } = await signIn("customer", s.address)
        const created = await api.post("/store/auth/shopper-profile", { email: "victim@example.test" }, store(data.token))
        const me = await api.get("/store/customers/me", store(created.data.token))
        expect(me.data.customer.email).toBe(s.address)
      })

      it("counts the email as confirmed when the seller already confirmed it", async () => {
        const s = await seller()
        const pg = pgOf(getContainer())
        await pg("seller_application").insert({
          id: `sapp_${seq}_${Date.now()}`,
          email: s.address,
          status: "approved",
          seller_id: s.shop.id,
          auth_identity_id: s.authIdentityId,
          email_verified_at: new Date(),
        })
        const { data } = await signIn("customer", s.address)
        const created = await startShopping(data.token)
        const customerId = payloadOf(created.data.token).actor_id
        expect(await pg("customer_email_verified").where("customer_id", customerId).first()).toMatchObject({ email: s.address })
      })

      it("doesn't count an email nobody confirmed", async () => {
        const id = await identity()
        const { data } = await signIn("customer", id.address)
        const created = await startShopping(data.token)
        const customerId = payloadOf(created.data.token).actor_id
        expect(await pgOf(getContainer())("customer_email_verified").where("customer_id", customerId).first()).toBeUndefined()
      })

      it("lets someone whose shopper account was removed start again", async () => {
        const id = await identity()
        await getContainer().resolve(Modules.AUTH).updateAuthIdentities({ id: id.authIdentityId, app_metadata: { customer_id: null } as any })
        const { data } = await signIn("customer", id.address)
        const created = await startShopping(data.token)
        expect(created.status).toBe(200)
        expect((await api.get("/store/customers/me", store(created.data.token))).status).toBe(200)
      })

      it("never joins onto someone else's shopper account with the same email", async () => {
        const id = await identity()
        const owner: any = await getContainer()
          .resolve(Modules.CUSTOMER)
          .createCustomers({ email: id.address, first_name: "Google", has_account: true })
        const { data } = await signIn("customer", id.address)
        expect(await state(data.token)).toMatchObject({ can_shop: false, existing_shopper: true })
        const res = await startShopping(data.token)
        expect(res.status).toBe(409)
        expect(res.data.code).toBe("existing_shopper")
        const row = await pgOf(getContainer())("auth_identity").where("id", id.authIdentityId).first("app_metadata")
        expect(row.app_metadata?.customer_id ?? null).toBeNull()
        expect(owner.id).toBeTruthy()
      })

      it("does nothing twice", async () => {
        const s = await seller()
        const { data } = await signIn("customer", s.address)
        const [a, b] = await Promise.all([startShopping(data.token), startShopping(data.token)])
        expect([a.status, b.status].filter((x) => x === 200).length).toBeGreaterThan(0)
        const rows = await pgOf(getContainer())("customer").where({ email: s.address, has_account: true }).whereNull("deleted_at")
        expect(rows).toHaveLength(1)
      })
    })

    describe("deleting the shopper account", () => {
      it("keeps the shop's sign-in working", async () => {
        const s = await seller()
        const { data } = await signIn("customer", s.address)
        const created = await startShopping(data.token)

        expect((await api.delete("/store/account", store(created.data.token))).status).toBe(200)

        const asSeller = await signIn("seller", s.address)
        expect(asSeller.status).toBe(200)
        expect(payloadOf(asSeller.data.token).actor_id).toBe(s.member.id)
        // The shopper side is gone: the sign-in no longer leads to a shopper
        const asShopper = await signIn("customer", s.address)
        expect(payloadOf(asShopper.data.token).actor_id).toBe("")
        expect(await state(asShopper.data.token)).toMatchObject({ kind: "seller", can_shop: true })
      })

      it("keeps an applicant's sign-in, so the application isn't lost", async () => {
        const id = await identity()
        await pgOf(getContainer())("seller_application").insert({
          id: `sapp_${seq}_${Date.now()}`,
          email: id.address,
          status: "pending",
          auth_identity_id: id.authIdentityId,
        })
        const { data } = await signIn("customer", id.address)
        const created = await startShopping(data.token)
        expect((await api.delete("/store/account", store(created.data.token))).status).toBe(200)
        expect((await signIn("seller", id.address)).status).toBe(200)
      })
    })
  },
})
