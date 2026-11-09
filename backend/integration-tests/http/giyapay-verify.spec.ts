import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import GiyaPayService from "../../src/services/giyapay"
import { giyapayCallbackSignature } from "../../src/lib/giyapay-signature"
import { applyCustomMigrations, noThrow, pgOf } from "../helpers"

jest.setTimeout(180 * 1000)

const SECRET = "test-merchant-secret"
// Must match what the verify route rebuilds from STOREFRONT_URL (.env.test).
const CALLBACK = "http://localhost:8000/giyapay/success"

const callback = (over: Record<string, string> = {}) => ({
  nonce: "nonce123",
  order_id: "order_01TEST",
  refno: `REF${Date.now()}`,
  timestamp: "1767225600",
  amount: "149900",
  ...over,
})

const signed = (params: ReturnType<typeof callback>, secret = SECRET, url = CALLBACK) => ({
  ...params,
  signature: giyapayCallbackSignature(url, params, secret),
})

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })

    const configure = (secret = SECRET) =>
      new GiyaPayService(getContainer()).createOrUpdateConfig({
        merchantId: "MERCHANT1",
        merchantSecret: secret,
        sandboxMode: true,
        isEnabled: true,
      })

    const transactions = () => pgOf(getContainer())("giyapay_transaction").select("*")

    describe("POST /giyapay/verify", () => {
      it("rejects a callback missing required parameters", async () => {
        const { signature, ...rest } = signed(callback())
        const res = await api.post("/giyapay/verify", rest, noThrow)
        expect(res.status).toBe(400)
        expect(res.data.message).toBe("Missing required parameters")
      })

      it("fails closed when no merchant secret is configured", async () => {
        const res = await api.post("/giyapay/verify", signed(callback()), noThrow)
        expect(res.status).toBe(500)
        expect(res.data.success).toBe(false)
      })

      it("accepts a correctly signed callback and records the payment in pesos", async () => {
        await configure()
        const params = callback({ cart_id: "cart_01TEST" } as any)

        const res = await api.post("/giyapay/verify", { ...signed(params), payment_method: "GCASH", cart_id: "cart_01TEST" })

        expect(res.status).toBe(200)
        expect(res.data).toMatchObject({ success: true, order_id: "order_01TEST", refno: params.refno })
        const [txn] = await transactions()
        expect(txn).toMatchObject({
          reference_number: params.refno,
          order_id: "order_01TEST",
          cart_id: "cart_01TEST",
          status: "SUCCESS",
          gateway: "GCASH",
        })
        expect(Number(txn.amount)).toBe(1499)
      })

      it("rejects a forged signature and records nothing", async () => {
        await configure()
        const res = await api.post("/giyapay/verify", { ...callback(), signature: "f".repeat(128) }, noThrow)

        expect(res.status).toBe(400)
        expect(res.data.message).toBe("Invalid signature")
        expect(await transactions()).toHaveLength(0)
      })

      it("rejects a callback whose amount was tampered with after signing", async () => {
        await configure()
        const genuine = signed(callback())
        const res = await api.post("/giyapay/verify", { ...genuine, amount: "100" }, noThrow)
        expect(res.status).toBe(400)
      })

      it("rejects a callback signed with another merchant's secret", async () => {
        await configure()
        const res = await api.post("/giyapay/verify", signed(callback(), "someone-elses-secret"), noThrow)
        expect(res.status).toBe(400)
      })

      it("rejects a callback signed for a different success URL", async () => {
        await configure()
        const res = await api.post(
          "/giyapay/verify",
          signed(callback(), SECRET, "https://evil.example/giyapay/success"),
          noThrow
        )
        expect(res.status).toBe(400)
      })

      it("stores a literal 'undefined' cart id as the order id instead", async () => {
        await configure()
        await api.post("/giyapay/verify", { ...signed(callback()), cart_id: "undefined" })

        const [txn] = await transactions()
        expect(txn.cart_id).toBe("order_01TEST")
      })

      it("verifies subscription renewals with the subscription merchant secret", async () => {
        await configure("main-secret")
        await pgOf(getContainer())("giyapay_subscription_config").insert({
          id: "gsc_1",
          merchant_id: "SUBMERCHANT",
          merchant_secret: "subscription-secret",
          is_enabled: true,
        })
        const params = callback({ order_id: "vrenew_growth_monthly_abc" })

        const withMain = await api.post("/giyapay/verify", signed(params, "main-secret"), noThrow)
        const withSub = await api.post("/giyapay/verify", signed(params, "subscription-secret"), noThrow)

        expect(withMain.status).toBe(400)
        expect(withSub.status).toBe(200)
        const [txn] = await transactions()
        expect(txn.seller_id).toBeNull()
      })
    })
  },
})
