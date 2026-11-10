import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import { applyCustomMigrations, bearer, createCustomer, createPublishableKey, noThrow } from "../helpers"

jest.setTimeout(180 * 1000)

/**
 * A buyer who signs in on another device gets the cart they left behind:
 * their most recent cart that still has items and wasn't checked out.
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let pk: string
    const as = (token?: string) => ({
      headers: { "x-publishable-api-key": pk, ...(token ? bearer(token) : {}) },
      ...noThrow,
    })

    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })

    beforeEach(async () => {
      pk = await createPublishableKey(getContainer())
    })

    const cartFor = (customerId: string, over: Record<string, any> = {}, items = 1) =>
      getContainer().resolve(Modules.CART).createCarts({
        currency_code: "php",
        customer_id: customerId,
        items: Array.from({ length: items }, () => ({ title: "Barong", quantity: 1, unit_price: 1499 })),
        ...over,
      })

    it("needs a signed-in buyer", async () => {
      expect((await api.get("/store/account/cart", as())).status).toBe(401)
    })

    it("returns the buyer's latest cart with items", async () => {
      const { customer, token } = await createCustomer(getContainer())
      await cartFor(customer.id)
      const latest = await cartFor(customer.id)
      await cartFor(customer.id, {}, 0)

      const res = await api.get("/store/account/cart", as(token))

      expect(res.status).toBe(200)
      expect(res.data.cart_id).toBe(latest.id)
    })

    it("ignores carts already checked out", async () => {
      const { customer, token } = await createCustomer(getContainer())
      await cartFor(customer.id, { completed_at: new Date() })

      const res = await api.get("/store/account/cart", as(token))

      expect(res.data.cart_id).toBeNull()
    })
  },
})
