import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import { applyCustomMigrations, bearer, createPublishableKey, noThrow, pgOf } from "../helpers"

jest.setTimeout(180 * 1000)

/**
 * A buyer can delete their own account from Settings. Their personal details
 * go, their sign-in goes (so the email can sign up again), and orders stay for
 * the shops' and the tax records. Not while an order is still on its way.
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let pk: string
    const store = (token?: string) => ({
      headers: { "x-publishable-api-key": pk, ...(token ? bearer(token) : {}) },
      ...noThrow,
    })

    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })

    beforeEach(async () => {
      pk = await createPublishableKey(getContainer())
    })

    /** A registered buyer with a real email/password sign-in and an address. */
    async function registeredBuyer() {
      const email = `buyer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.test`
      const password = "Test-pass-123"
      const reg = await api.post("/auth/customer/emailpass/register", { email, password })
      const created = await api.post("/store/customers", { email, first_name: "Juan", last_name: "Dela Cruz" }, store(reg.data.token))
      const login = await api.post("/auth/customer/emailpass", { email, password })
      const token = login.data.token
      await api.post(
        "/store/customers/me/addresses",
        { first_name: "Juan", last_name: "Dela Cruz", address_1: "1 Rizal St", city: "Angeles City", country_code: "ph", phone: "+639171234567" },
        store(token)
      )
      return { email, password, token, customerId: created.data.customer.id }
    }

    async function orderFor(customerId: string, status = "pending") {
      return getContainer().resolve(Modules.ORDER).createOrders({
        currency_code: "php",
        email: "x@example.test",
        customer_id: customerId,
        status,
        items: [{ title: "Barong", quantity: 1, unit_price: 1499 }],
      } as any)
    }

    it("needs a signed-in buyer", async () => {
      expect((await api.delete("/store/account", store())).status).toBe(401)
    })

    it("removes the buyer's details and sign-in, so the email can sign up again", async () => {
      const buyer = await registeredBuyer()

      const res = await api.delete("/store/account", store(buyer.token))

      expect(res.status).toBe(200)
      const pg = pgOf(getContainer())
      const row = await pg("customer").where("id", buyer.customerId).first()
      expect(row.email).not.toBe(buyer.email)
      expect(row.first_name).toBeNull()
      expect(row.last_name).toBeNull()
      expect(row.deleted_at).not.toBeNull()
      expect(await pg("customer_address").where("customer_id", buyer.customerId).whereNull("deleted_at")).toHaveLength(0)
      expect((await api.post("/auth/customer/emailpass", { email: buyer.email, password: buyer.password }, noThrow)).status).toBe(401)
      expect((await api.post("/auth/customer/emailpass/register", { email: buyer.email, password: buyer.password }, noThrow)).status).toBe(200)
    })

    it("keeps the buyer's past orders", async () => {
      const buyer = await registeredBuyer()
      const order: any = await orderFor(buyer.customerId, "completed")

      expect((await api.delete("/store/account", store(buyer.token))).status).toBe(200)

      expect(await pgOf(getContainer())("order").where("id", order.id).whereNull("deleted_at").first()).toBeTruthy()
    })

    it("waits until no order is still on its way", async () => {
      const buyer = await registeredBuyer()
      await orderFor(buyer.customerId, "pending")

      const res = await api.delete("/store/account", store(buyer.token))

      expect(res.status).toBe(409)
      expect(res.data.message).toMatch(/on its way|on their way/)
      expect((await pgOf(getContainer())("customer").where("id", buyer.customerId).first()).email).toBe(buyer.email)
    })
  },
})
