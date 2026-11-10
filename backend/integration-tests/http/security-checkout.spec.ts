import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import GiyaPayService from "../../src/services/giyapay"
import {
  applyCustomMigrations,
  bearer,
  createCustomer,
  createPublishableKey,
  createSeller,
  noThrow,
  pgOf,
  givePlan,
  makeReady,
} from "../helpers"

jest.setTimeout(180 * 1000)

/**
 * The real checkout route, not just the payment module: POST
 * /store/carts/:id/complete is what an attacker would call directly.
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
      await new GiyaPayService(getContainer()).createOrUpdateConfig({
        merchantId: "MERCHANT1",
        merchantSecret: "secret",
        sandboxMode: true,
        isEnabled: true,
      })
    })

    /** A checkout-ready cart with one seller's item, a chosen provider and a session. */
    async function readyCart(providerId: string) {
      const container = getContainer()
      const { seller } = await createSeller(container)
      await givePlan(container, seller.id)
      await makeReady(container, seller.id)
      const { customer } = await createCustomer(container)
      const [product] = await container.resolve(Modules.PRODUCT).createProducts([
        {
          title: `Item ${Date.now()}`,
          status: "published",
          options: [{ title: "Size", values: ["M"] }],
          variants: [{ title: "M", options: { Size: "M" }, manage_inventory: false }],
        },
      ])
      await container.resolve(ContainerRegistrationKeys.LINK).create({
        seller: { seller_id: seller.id },
        [Modules.PRODUCT]: { product_id: product.id },
      })
      const [salesChannel] = await container.resolve(Modules.SALES_CHANNEL).createSalesChannels([{ name: `SC ${Date.now()}` }])
      const region = await container.resolve(Modules.REGION).createRegions({ name: `PH ${Date.now()}`, currency_code: "php" })

      const cartModule = container.resolve(Modules.CART)
      const cart = await cartModule.createCarts({
        currency_code: "php",
        email: "buyer@example.test",
        customer_id: customer.id,
        region_id: region.id,
        sales_channel_id: salesChannel.id,
        items: [
          {
            title: "Barong",
            quantity: 1,
            unit_price: 1499,
            product_id: product.id,
            variant_id: product.variants[0].id,
            requires_shipping: false,
          },
        ],
      })

      const paymentModule = container.resolve(Modules.PAYMENT)
      const collection = await paymentModule.createPaymentCollections({ currency_code: "php", amount: 1499 })
      await container.resolve(ContainerRegistrationKeys.LINK).create({
        [Modules.CART]: { cart_id: cart.id },
        [Modules.PAYMENT]: { payment_collection_id: collection.id },
      })
      await paymentModule.createPaymentSession(collection.id, {
        provider_id: providerId,
        amount: 1499,
        currency_code: "php",
        data: {},
      })
      return { cart, collection, seller }
    }

    const ordersFrom = async (cartId: string) =>
      (await pgOf(getContainer())("order_set").where({ cart_id: cartId })).length

    // These carts have no shipping method, so a cart that clears payment stops at
    // the next step with a shipping error. That difference is the point: unpaid
    // stops AT payment, paid and COD get PAST it. Placing a whole order is covered
    // by manual cases CHK-05 and CHK-07.
    const PAST_PAYMENT = /shipping method/i

    it("stops an unpaid GiyaPay cart at payment, even with a fake 'paid' body", async () => {
      const { cart } = await readyCart("pp_giyapay_giyapay")

      const res = await api.post(
        `/store/carts/${cart.id}/complete`,
        { payment_data: { status: "paid", reference_number: "FAKE", signature: "x" } },
        store()
      )

      expect(res.status).toBeGreaterThanOrEqual(400)
      expect(res.data.message).not.toMatch(PAST_PAYMENT)
      expect(await ordersFrom(cart.id)).toBe(0)
    })

    it("lets the same cart past payment once a verified payment is on record", async () => {
      const { cart } = await readyCart("pp_giyapay_giyapay")
      await pgOf(getContainer())("giyapay_transaction").insert({
        id: "txn_paid",
        reference_number: "REF-PAID",
        cart_id: cart.id,
        amount: 1499,
        status: "SUCCESS",
        created_at: new Date(),
        updated_at: new Date(),
      })

      const res = await api.post(`/store/carts/${cart.id}/complete`, {}, store())

      expect(res.data.message).toMatch(PAST_PAYMENT)
    })

    it("still stops a cart whose verified payment is too small", async () => {
      const { cart } = await readyCart("pp_giyapay_giyapay")
      await pgOf(getContainer())("giyapay_transaction").insert({
        id: "txn_small",
        reference_number: "REF-SMALL",
        cart_id: cart.id,
        amount: 14.99,
        status: "SUCCESS",
        created_at: new Date(),
        updated_at: new Date(),
      })

      const res = await api.post(`/store/carts/${cart.id}/complete`, {}, store())

      expect(res.data.message).not.toMatch(PAST_PAYMENT)
    })

    it("cash on delivery still gets past payment without any online payment", async () => {
      const { cart } = await readyCart("pp_system_default")

      const res = await api.post(`/store/carts/${cart.id}/complete`, {}, store())

      expect(res.data.message).toMatch(PAST_PAYMENT)
    })

    it("an anonymous wishlist read returns nobody's data", async () => {
      const res = await api.get("/store/wishlist", store())
      expect(res.data.wishlists ?? []).toEqual([])
    })

    describe("customer-only routes reject anonymous callers", () => {
      it.each([
        ["GET", "/store/chat"],
        ["POST", "/store/chat"],
        ["GET", "/store/vouchers/my"],
        ["POST", "/store/vouchers/collect"],
        ["DELETE", "/store/vouchers/collect"],
        ["POST", "/store/flash-sale-cart-items"],
        ["POST", "/store/reviews"],
        ["GET", "/store/reviews"],
        ["POST", "/store/auth/link-google"],
        ["GET", "/store/chat/stream"],
      ])("%s %s", async (method, url) => {
        const res = await api.request({ method, url, data: method === "GET" ? undefined : {}, ...store() })
        expect(res.status).toBe(401)
      })
    })
  },
})
