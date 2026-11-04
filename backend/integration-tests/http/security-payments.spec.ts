import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import GiyaPayService from "../../src/services/giyapay"
import { giyapayCallbackSignature } from "../../src/lib/giyapay-signature"
import { applyCustomMigrations, bearer, createPublishableKey, createSeller, noThrow, pgOf, seedPlans } from "../helpers"

jest.setTimeout(180 * 1000)

const SECRET = "test-merchant-secret"
const CALLBACK = "http://localhost:8000/giyapay/success"

let refSeq = 0
const callback = (over: Record<string, string> = {}) => ({
  nonce: "nonce123",
  order_id: "undefined",
  refno: `REF${Date.now()}${++refSeq}`,
  timestamp: "1767225600",
  amount: "149900",
  ...over,
})
const signed = (params: ReturnType<typeof callback>, secret = SECRET) => ({
  ...params,
  signature: giyapayCallbackSignature(CALLBACK, params, secret),
})

/**
 * What an attacker can do to money: place orders without paying, forge payments,
 * replay them, or turn someone else's payment into a free subscription.
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })

    beforeEach(async () => {
      await seedPlans(getContainer())
      await new GiyaPayService(getContainer()).createOrUpdateConfig({
        merchantId: "MERCHANT1",
        merchantSecret: SECRET,
        sandboxMode: true,
        isEnabled: true,
      })
    })

    const transactions = () => pgOf(getContainer())("giyapay_transaction").select("*")

    const insertTxn = (over: Record<string, any>) =>
      pgOf(getContainer())("giyapay_transaction").insert({
        id: `txn_${Date.now()}_${++refSeq}`,
        reference_number: `REF-${refSeq}`,
        amount: 1499,
        currency: "PHP",
        status: "SUCCESS",
        gateway: "GCASH",
        created_at: new Date(),
        updated_at: new Date(),
        ...over,
      })

    /** A real cart + payment collection + GiyaPay session, as checkout creates them. */
    async function giyapaySession(amount = 1499) {
      const container = getContainer()
      const cart = await container.resolve(Modules.CART).createCarts({ currency_code: "php", email: "b@example.test" })
      const paymentModule = container.resolve(Modules.PAYMENT)
      const collection = await paymentModule.createPaymentCollections({ currency_code: "php", amount })
      await container.resolve(ContainerRegistrationKeys.LINK).create({
        [Modules.CART]: { cart_id: cart.id },
        [Modules.PAYMENT]: { payment_collection_id: collection.id },
      })
      const session = await paymentModule.createPaymentSession(collection.id, {
        provider_id: "pp_giyapay_giyapay",
        amount,
        currency_code: "php",
        data: {},
      })
      return { cart, collection, session, paymentModule }
    }

    describe("placing an order without paying", () => {
      it("refuses to authorize a GiyaPay session with no verified payment", async () => {
        const { session, paymentModule } = await giyapaySession()
        await expect(paymentModule.authorizePaymentSession(session.id, {})).rejects.toThrow(/not authorized/)
      })

      it("an anonymous call to the payment webhook can't authorize anything", async () => {
        const { session, paymentModule } = await giyapaySession()
        const result = await (paymentModule as any).getWebhookActionAndData({
          provider: "giyapay_giyapay",
          payload: { data: { session_id: session.id, amount: 1499 }, rawData: "{}", headers: {} },
        })
        expect(result.action).toBe("not_supported")
      })

      it("refuses a client-supplied 'paid' status in the session data", async () => {
        const { session, paymentModule } = await giyapaySession()
        await expect(
          paymentModule.authorizePaymentSession(session.id, { status: "paid", reference_number: "FAKE" } as any)
        ).rejects.toThrow(/not authorized/)
      })

      it("authorizes once a verified payment covers this exact cart", async () => {
        const { cart, session, paymentModule } = await giyapaySession()
        await insertTxn({ cart_id: cart.id, amount: 1499 })

        const payment = await paymentModule.authorizePaymentSession(session.id, {})

        expect(payment.provider_id).toBe("pp_giyapay_giyapay")
      })

      it("refuses an underpayment", async () => {
        const { cart, session, paymentModule } = await giyapaySession(1499)
        await insertTxn({ cart_id: cart.id, amount: 1 })
        await expect(paymentModule.authorizePaymentSession(session.id, {})).rejects.toThrow(/not authorized/)
      })

      it("refuses a payment made for a different cart", async () => {
        const { session, paymentModule } = await giyapaySession()
        await insertTxn({ cart_id: "cart_someone_else", amount: 1499 })
        await expect(paymentModule.authorizePaymentSession(session.id, {})).rejects.toThrow(/not authorized/)
      })

      it("refuses a transaction that didn't succeed", async () => {
        const { cart, session, paymentModule } = await giyapaySession()
        await insertTxn({ cart_id: cart.id, amount: 1499, status: "PENDING" })
        await expect(paymentModule.authorizePaymentSession(session.id, {})).rejects.toThrow(/not authorized/)
      })
    })

    describe("POST /giyapay/update-transaction (anonymous)", () => {
      it("cannot turn a failed payment into a successful one", async () => {
        await insertTxn({ reference_number: "REF-FAILED", status: "FAILED" })

        await api.post("/giyapay/update-transaction", { reference_number: "REF-FAILED" }, noThrow)

        const [txn] = await transactions()
        expect(txn.status).toBe("FAILED")
      })

      it("cannot rewrite order_id to forge a subscription payment", async () => {
        await insertTxn({ reference_number: "REF-CART", cart_id: "cart_abc", order_id: null })

        await api.post(
          "/giyapay/update-transaction",
          { reference_number: "REF-CART", order_id: "vsub_premium_1767225600000" },
          noThrow
        )
        await api.post(
          "/giyapay/update-transaction",
          { reference_number: "REF-CART", order_id: "vrenew_premium_yearly_sel_x_1767225600000" },
          noThrow
        )

        const [txn] = await transactions()
        expect(txn.order_id).toBeNull()
      })

      it("cannot move a payment onto another cart", async () => {
        await insertTxn({ reference_number: "REF-BOUND", cart_id: "cart_original" })

        await api.post("/giyapay/update-transaction", { reference_number: "REF-BOUND", cart_id: "cart_attacker" }, noThrow)

        const [txn] = await transactions()
        expect(txn.cart_id).toBe("cart_original")
      })

      it("cannot attach an order that wasn't created from this payment's cart", async () => {
        await insertTxn({ reference_number: "REF-X", cart_id: "cart_mine", order_id: null })

        await api.post("/giyapay/update-transaction", { reference_number: "REF-X", order_id: "order_of_someone_else" }, noThrow)

        const [txn] = await transactions()
        expect(txn.order_id).toBeNull()
      })

      it("still records the real order set after checkout", async () => {
        const pg = pgOf(getContainer())
        await insertTxn({ reference_number: "REF-OK", cart_id: "cart_real", order_id: null })
        await pg("order_set").insert({
          id: "ordset_real",
          cart_id: "cart_real",
          sales_channel_id: "sc_1",
          customer_id: "cus_1",
          payment_collection_id: "pc_1",
          created_at: new Date(),
          updated_at: new Date(),
        })

        const res = await api.post("/giyapay/update-transaction", {
          reference_number: "REF-OK",
          order_id: "ordset_real",
          cart_id: "cart_real",
        })

        expect(res.status).toBe(200)
        const [txn] = await transactions()
        expect(txn.order_id).toBe("ordset_real")
      })
    })

    describe("POST /giyapay/verify replays", () => {
      it("records a replayed callback only once", async () => {
        const body = { ...signed(callback()), cart_id: "cart_a" }

        await api.post("/giyapay/verify", body)
        await api.post("/giyapay/verify", body)

        expect(await transactions()).toHaveLength(1)
      })

      it("refuses to re-spend one payment on a second cart", async () => {
        const params = signed(callback())
        await api.post("/giyapay/verify", { ...params, cart_id: "cart_a" })

        const res = await api.post("/giyapay/verify", { ...params, cart_id: "cart_b" }, noThrow)

        expect(res.status).toBe(409)
        const [txn] = await transactions()
        expect(txn.cart_id).toBe("cart_a")
      })
    })

    describe("POST /store/subscription/activate-renewal", () => {
      let pk: string
      const store = () => ({ headers: { "x-publishable-api-key": pk }, ...noThrow })
      beforeEach(async () => {
        pk = await createPublishableKey(getContainer())
      })

      const legacyOrderId = (sellerId: string, plan = "growth") => `vrenew_${plan}_monthly_${sellerId}_1767225600000`

      it("activates a genuine, correctly priced payment once", async () => {
        const { seller } = await createSeller(getContainer())
        const order_id = legacyOrderId(seller.id)
        await insertTxn({ reference_number: "REF-R1", order_id, amount: 1499 })

        const res = await api.post("/store/subscription/activate-renewal", { reference_number: "REF-R1", order_id }, store())

        expect(res.status).toBe(200)
        expect(res.data.subscription.plan_name).toBe("Growth")
      })

      it("cannot replay one payment to keep extending a subscription", async () => {
        const { seller } = await createSeller(getContainer())
        const order_id = legacyOrderId(seller.id)
        await insertTxn({ reference_number: "REF-R2", order_id, amount: 1499 })

        await api.post("/store/subscription/activate-renewal", { reference_number: "REF-R2", order_id }, store())
        const again = await api.post("/store/subscription/activate-renewal", { reference_number: "REF-R2", order_id }, store())

        expect(again.status).toBe(409)
        const rows = await pgOf(getContainer())("seller_subscription").where({ payment_reference: "REF-R2" })
        expect(rows).toHaveLength(1)
      })

      it("cannot buy Premium with a payment that only covers Starter", async () => {
        const { seller } = await createSeller(getContainer())
        const order_id = legacyOrderId(seller.id, "premium")
        await insertTxn({ reference_number: "REF-R3", order_id, amount: 499 })

        const res = await api.post("/store/subscription/activate-renewal", { reference_number: "REF-R3", order_id }, store())

        expect(res.status).toBe(400)
        const rows = await pgOf(getContainer())("seller_subscription").where({ seller_id: seller.id })
        expect(rows).toHaveLength(0)
      })

      it("the full forgery chain fails: failed payment + anonymous update + activation", async () => {
        const { seller } = await createSeller(getContainer())
        const order_id = legacyOrderId(seller.id, "premium")
        await insertTxn({ reference_number: "REF-CHAIN", status: "FAILED", amount: 39990 })

        await api.post("/giyapay/update-transaction", { reference_number: "REF-CHAIN", order_id }, noThrow)
        await api.post("/store/subscription/activate-renewal", { reference_number: "REF-CHAIN", order_id }, store())

        const rows = await pgOf(getContainer())("seller_subscription").where({ seller_id: seller.id })
        expect(rows).toHaveLength(0)
      })
    })

    describe("POST /store/vendor/register", () => {
      it("rejects a subscription payment smaller than the plan's price", async () => {
        const pk = await createPublishableKey(getContainer())
        await insertTxn({ reference_number: "REF-V1", order_id: "vsub_premium_1767225600000", amount: 1 })

        const res = await api.post(
          "/store/vendor/register",
          { name: "Shop", email: "s@example.test", password: "longenough1", payment_reference: "REF-V1", plan_name: "Premium" },
          { headers: { "x-publishable-api-key": pk }, ...noThrow }
        )

        expect(res.status).toBe(400)
        expect(res.data.message).toMatch(/amount/i)
      })
    })

    describe("GET /store/giyapay/transaction", () => {
      it("doesn't expose payment secrets to whoever guesses an order id", async () => {
        const pk = await createPublishableKey(getContainer())
        await insertTxn({
          reference_number: "REF-LEAK",
          order_id: "order_leak",
          payment_data: JSON.stringify({ signature: "secret-signature", nonce: "secret-nonce" }),
        })

        const res = await api.get("/store/giyapay/transaction?order_id=order_leak", {
          headers: { "x-publishable-api-key": pk },
        })

        expect(res.status).toBe(200)
        expect(JSON.stringify(res.data)).not.toContain("secret-signature")
        expect(res.data.gateway).toBe("GCASH")
      })
    })

    describe("POST /vendor/subscription/activate", () => {
      it("rejects a forged callback", async () => {
        const { token } = await createSeller(getContainer())
        const res = await api.post(
          "/vendor/subscription/activate",
          { order_id: "x", refno: "R", nonce: "n", timestamp: "1", amount: "39990000", signature: "f".repeat(128) },
          { headers: bearer(token), ...noThrow }
        )
        expect(res.status).toBe(400)
      })
    })
  },
})
