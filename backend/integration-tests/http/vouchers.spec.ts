import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import {
  applyCustomMigrations,
  bearer,
  createAdmin,
  createCustomer,
  createPublishableKey,
  createSeller,
  noThrow,
  pgOf,
} from "../helpers"

jest.setTimeout(180 * 1000)

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

    async function promotion(code: string, over: Record<string, any> = {}) {
      const { metadata: _metadata, ...rest } = over
      const promotionModule = getContainer().resolve(Modules.PROMOTION)
      const [p] = await promotionModule.createPromotions([
        {
          code,
          type: "standard",
          status: "active",
          application_method: {
            type: "fixed",
            target_type: "order",
            allocation: "across",
            value: 100,
            currency_code: "php",
          },
          ...rest,
        },
      ])
      if (over.metadata) {
        const { token } = await createAdmin(getContainer())
        await api.post(`/admin/promotions/${p.id}/metadata`, { metadata: over.metadata }, { headers: bearer(token) })
      }
      return p
    }

    const ownedBy = (sellerId: string, p: { id: string }) =>
      pgOf(getContainer()).raw(
        `INSERT INTO seller_seller_promotion_promotion (id, seller_id, promotion_id) VALUES (gen_random_uuid(), ?, ?)`,
        [sellerId, p.id]
      )

    async function placeOrderFor(customerId: string) {
      await getContainer()
        .resolve(Modules.ORDER)
        .createOrders({
          customer_id: customerId,
          currency_code: "php",
          email: "b@example.test",
          items: [{ title: "X", quantity: 1, unit_price: 100 }],
        })
    }

    describe("GET /store/vouchers", () => {
      it("lists active promotions with a peso discount label", async () => {
        await promotion("SAVE100")
        await promotion("DRAFT", { status: "draft" })

        const res = await api.get("/store/vouchers", store())

        expect(res.status).toBe(200)
        expect(res.data.vouchers.map((v: any) => [v.code, v.discount_label, v.scope])).toEqual([
          ["SAVE100", "₱100 off", "platform"],
        ])
      })

      it("filters to one seller's vouchers", async () => {
        const shopA = await createSeller(getContainer())
        const shopB = await createSeller(getContainer())
        await promotion("PLATFORM")
        await ownedBy(shopA.seller.id, await promotion("SHOP_A"))
        await ownedBy(shopB.seller.id, await promotion("SHOP_B"))

        const res = await api.get(`/store/vouchers?seller_id=${shopA.seller.id}`, store())

        expect(res.data.vouchers.map((v: any) => [v.code, v.scope, v.seller_name])).toEqual([
          ["SHOP_A", "seller", shopA.seller.name],
        ])
      })
    })

    describe("POST /store/vouchers/collect", () => {
      it("requires a signed-in customer", async () => {
        const p = await promotion("SAVE100")
        const res = await api.post("/store/vouchers/collect", { promotion_id: p.id }, store())
        expect(res.status).toBe(401)
      })

      it("saves a voucher to the customer's wallet, idempotently", async () => {
        const p = await promotion("SAVE100")
        const { token } = await createCustomer(getContainer())

        const first = await api.post("/store/vouchers/collect", { promotion_id: p.id }, store(token))
        const second = await api.post("/store/vouchers/collect", { promotion_id: p.id }, store(token))

        expect(first.status).toBe(200)
        expect(second.data.voucher.id).toBe(first.data.voucher.id)

        const mine = await api.get("/store/vouchers/my", store(token))
        expect(mine.data.vouchers.map((v: any) => [v.code, v.is_collected])).toEqual([["SAVE100", true]])
      })

      it("returns 404 for an unknown promotion", async () => {
        const { token } = await createCustomer(getContainer())
        const res = await api.post("/store/vouchers/collect", { promotion_id: "promo_nope" }, store(token))
        expect(res.status).toBe(404)
      })

      it("blocks returning customers from first-order vouchers", async () => {
        const p = await promotion("WELCOME", { metadata: { first_order_only: true } })
        const { customer, token } = await createCustomer(getContainer())
        await placeOrderFor(customer.id)

        const res = await api.post("/store/vouchers/collect", { promotion_id: p.id }, store(token))

        expect(res.status).toBe(400)
        expect(res.data.message).toMatch(/first-time buyers/)
      })

      it("lets a new customer collect a first-order voucher", async () => {
        const p = await promotion("WELCOME", { metadata: { first_order_only: true } })
        const { token } = await createCustomer(getContainer())

        const res = await api.post("/store/vouchers/collect", { promotion_id: p.id }, store(token))
        expect(res.status).toBe(200)
      })

      it("stores metadata the admin sets, and the description reaches shoppers", async () => {
        await promotion("DESCRIBED", { metadata: { description: "Payday treat" } })
        const res = await api.get("/store/vouchers", store())
        expect(res.data.vouchers[0].description).toBe("Payday treat")
      })

      it("removes a collected voucher", async () => {
        const p = await promotion("SAVE100")
        const { token } = await createCustomer(getContainer())
        await api.post("/store/vouchers/collect", { promotion_id: p.id }, store(token))

        const del = await api.delete("/store/vouchers/collect", { ...store(token), data: { promotion_id: p.id } })
        expect(del.status).toBe(200)

        const mine = await api.get("/store/vouchers/my", store(token))
        expect(mine.data.vouchers).toEqual([])
      })
    })

    describe("first-order vouchers at checkout (codes are public, collecting is optional)", () => {
      const cartFor = (customerId?: string) =>
        getContainer()
          .resolve(Modules.CART)
          .createCarts({ currency_code: "php", email: "c@example.test", ...(customerId ? { customer_id: customerId } : {}) })

      const apply = (cartId: string, code: string) =>
        api.post(`/store/carts/${cartId}/promotions`, { promo_codes: [code] }, store())

      it("refuses a returning customer who types the code in directly", async () => {
        await promotion("WELCOME", { metadata: { first_order_only: true } })
        const { customer } = await createCustomer(getContainer())
        await placeOrderFor(customer.id)
        const cart = await cartFor(customer.id)

        const res = await apply(cart.id, "WELCOME")

        expect(res.status).toBe(400)
        expect(res.data.message).toMatch(/first-time buyers/)
      })

      it("refuses it through the plain cart update too", async () => {
        await promotion("WELCOME", { metadata: { first_order_only: true } })
        const { customer } = await createCustomer(getContainer())
        await placeOrderFor(customer.id)
        const cart = await cartFor(customer.id)

        const res = await api.post(`/store/carts/${cart.id}`, { promo_codes: ["WELCOME"] }, store())

        expect(res.status).toBe(400)
      })

      it("refuses a guest cart, which could otherwise reuse it forever", async () => {
        await promotion("WELCOME", { metadata: { first_order_only: true } })
        const cart = await cartFor()
        expect((await apply(cart.id, "WELCOME")).status).toBe(400)
      })

      it("refuses a guest checkout's customer record (it has no account)", async () => {
        await promotion("WELCOME", { metadata: { first_order_only: true } })
        const { customer } = await createCustomer(getContainer(), { has_account: false })
        const cart = await cartFor(customer.id)

        const res = await apply(cart.id, "WELCOME")

        expect(res.status).toBe(400)
        expect(res.data.message).toMatch(/Sign in/)
      })

      it("lets a genuine first-time customer through the guard", async () => {
        await promotion("WELCOME", { metadata: { first_order_only: true } })
        const { customer } = await createCustomer(getContainer())
        const cart = await cartFor(customer.id)
        const res = await apply(cart.id, "WELCOME")
        expect(res.data.message ?? "").not.toMatch(/first-time|Sign in/)
      })

      it("doesn't affect ordinary vouchers", async () => {
        await promotion("EVERYONE")
        const { customer } = await createCustomer(getContainer())
        await placeOrderFor(customer.id)
        const cart = await cartFor(customer.id)
        const res = await apply(cart.id, "EVERYONE")
        expect(res.data.message ?? "").not.toMatch(/first-time|Sign in/)
      })
    })
  },
})
