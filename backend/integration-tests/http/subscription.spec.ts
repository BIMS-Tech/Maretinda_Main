import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import SubscriptionService from "../../src/services/subscription"
import { giyapayCallbackSignature } from "../../src/lib/giyapay-signature"
import {
  applyCustomMigrations,
  bearer,
  createAdmin,
  createPublishableKey,
  createSeller,
  noThrow,
  pgOf,
  seedPlans,
} from "../helpers"

jest.setTimeout(180 * 1000)

const DAY = 24 * 60 * 60 * 1000

medusaIntegrationTestRunner({
  inApp: true,
  env: { SELLER_PANEL_URL: "https://seller.example.test" },
  testSuite: ({ api, getContainer }) => {
    let pk: string

    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })

    beforeEach(async () => {
      await seedPlans(getContainer())
      pk = await createPublishableKey(getContainer())
    })

    describe("GET /store/subscription/plans", () => {
      it("lists active plans cheapest first", async () => {
        await pgOf(getContainer())("subscription_plan").insert({
          id: "subplan_legacy",
          name: "Legacy",
          price: 1,
          status: "inactive",
        })

        const res = await api.get("/store/subscription/plans", { headers: { "x-publishable-api-key": pk } })

        expect(res.status).toBe(200)
        expect(res.data.plans.map((p: any) => p.name)).toEqual(["Starter", "Growth", "Premium"])
      })
    })

    describe("POST /vendor/subscription/trial", () => {
      it("rejects unauthenticated requests", async () => {
        const res = await api.post("/vendor/subscription/trial", { plan_name: "Growth" }, noThrow)
        expect(res.status).toBe(401)
      })

      it("requires plan_name", async () => {
        const { token } = await createSeller(getContainer())
        const res = await api.post("/vendor/subscription/trial", {}, { headers: bearer(token), ...noThrow })
        expect(res.status).toBe(400)
      })

      // The first month is free, as every page and the onboarding chat say
      it("starts a one-month free trial", async () => {
        const { seller, token } = await createSeller(getContainer())
        const before = Date.now()

        const res = await api.post("/vendor/subscription/trial", { plan_name: "Growth" }, { headers: bearer(token) })

        expect(res.status).toBe(200)
        const sub = res.data.subscription
        expect(sub).toMatchObject({
          seller_id: seller.id,
          plan_name: "Growth",
          is_trial: true,
          status: "active",
          payment_reference: "trial",
        })
        expect(Number(sub.price)).toBe(0)
        const lengthDays = (new Date(sub.end_date).getTime() - before) / DAY
        expect(lengthDays).toBeGreaterThan(29.9)
        expect(lengthDays).toBeLessThan(30.1)
      })

      it("only allows one trial per seller", async () => {
        const { token } = await createSeller(getContainer())
        await api.post("/vendor/subscription/trial", { plan_name: "Growth" }, { headers: bearer(token) })

        const again = await api.post(
          "/vendor/subscription/trial",
          { plan_name: "Premium" },
          { headers: bearer(token), ...noThrow }
        )

        expect(again.status).toBe(409)
        expect(again.data.message).toMatch(/already been used/)
      })

      it("blocks concurrent double-trial requests", async () => {
        const { seller } = await createSeller(getContainer())
        const service = new SubscriptionService(getContainer())

        const results = await Promise.allSettled([
          service.startTrial(seller.id, "Growth"),
          service.startTrial(seller.id, "Growth"),
          service.startTrial(seller.id, "Growth"),
        ])

        expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1)
        const rows = await pgOf(getContainer())("seller_subscription").where({ seller_id: seller.id })
        expect(rows).toHaveLength(1)
      })

      it("refuses a trial to a seller who has paid before", async () => {
        const { seller, token } = await createSeller(getContainer())
        await new SubscriptionService(getContainer()).renewSubscription({
          sellerId: seller.id,
          planName: "Starter",
          billingPeriod: "monthly",
          price: 499,
          paymentReference: "REF1",
        })

        const res = await api.post(
          "/vendor/subscription/trial",
          { plan_name: "Growth" },
          { headers: bearer(token), ...noThrow }
        )
        expect(res.status).toBe(409)
      })

      it("returns 404 for an unknown plan", async () => {
        const { token } = await createSeller(getContainer())
        const res = await api.post(
          "/vendor/subscription/trial",
          { plan_name: "Platinum" },
          { headers: bearer(token), ...noThrow }
        )
        expect(res.status).toBe(404)
      })

      it("refuses a trial on a plan without trial days", async () => {
        await pgOf(getContainer())("subscription_plan").where({ name: "Premium" }).update({ trial_days: 0 })
        const { token } = await createSeller(getContainer())

        const res = await api.post(
          "/vendor/subscription/trial",
          { plan_name: "Premium" },
          { headers: bearer(token), ...noThrow }
        )
        expect(res.status).toBe(400)
        expect(res.data.message).toMatch(/does not offer a free trial/)
      })
    })

    describe("GET /vendor/subscription/status", () => {
      it("reports no subscription for a new seller", async () => {
        const { token } = await createSeller(getContainer())
        const res = await api.get("/vendor/subscription/status", { headers: bearer(token) })

        expect(res.data).toEqual({ has_subscription: false, has_ever_subscribed: false, subscription: null, plan: null })
      })

      it("returns the active subscription with its plan", async () => {
        const { token } = await createSeller(getContainer())
        await api.post("/vendor/subscription/trial", { plan_name: "Growth" }, { headers: bearer(token) })

        const res = await api.get("/vendor/subscription/status", { headers: bearer(token) })

        expect(res.data.has_subscription).toBe(true)
        expect(res.data.subscription.plan_name).toBe("Growth")
        expect(res.data.plan.name).toBe("Growth")
      })

      it("stops granting access the moment a subscription passes its end date", async () => {
        const { seller, token } = await createSeller(getContainer())
        await pgOf(getContainer())("seller_subscription").insert({
          id: "vsub_overdue",
          seller_id: seller.id,
          plan_name: "Growth",
          price: 1499,
          start_date: new Date(Date.now() - 31 * DAY),
          end_date: new Date(Date.now() - 60 * 1000),
          status: "active",
        })

        const res = await api.get("/vendor/subscription/status", { headers: bearer(token) })

        expect(res.data).toMatchObject({ has_subscription: false, has_ever_subscribed: true })
      })
    })

    describe("SubscriptionService", () => {
      it("expireOverdue flips only overdue active rows to expired", async () => {
        const { seller } = await createSeller(getContainer())
        const pg = pgOf(getContainer())
        const base = { seller_id: seller.id, plan_name: "Growth", price: 1499, start_date: new Date() }
        await pg("seller_subscription").insert([
          { ...base, id: "vsub_old", end_date: new Date(Date.now() - DAY), status: "active" },
          { ...base, id: "vsub_live", end_date: new Date(Date.now() + DAY), status: "active" },
          { ...base, id: "vsub_cancelled", end_date: new Date(Date.now() - DAY), status: "cancelled" },
        ])

        const count = await new SubscriptionService(getContainer()).expireOverdue()

        expect(count).toBe(1)
        const statuses = Object.fromEntries(
          (await pg("seller_subscription").select("id", "status")).map((r: any) => [r.id, r.status])
        )
        expect(statuses).toEqual({ vsub_old: "expired", vsub_live: "active", vsub_cancelled: "cancelled" })
      })

      it("renewSubscription cancels the current plan and starts a yearly one", async () => {
        const { seller } = await createSeller(getContainer())
        const service = new SubscriptionService(getContainer())
        const trial = await service.startTrial(seller.id, "Growth")

        const renewed = await service.renewSubscription({
          sellerId: seller.id,
          planName: "Premium",
          billingPeriod: "yearly",
          price: 39990,
          paymentReference: "REF-Y",
        })

        const pg = pgOf(getContainer())
        expect((await pg("seller_subscription").where({ id: trial.id }).first()).status).toBe("cancelled")
        expect(renewed).toMatchObject({ plan_name: "Premium", billing_period: "yearly", is_trial: false })
        const days = (new Date(renewed.end_date).getTime() - new Date(renewed.start_date).getTime()) / DAY
        expect(days).toBeGreaterThanOrEqual(365)
        expect(days).toBeLessThanOrEqual(366)
        expect((await service.getActiveSubscription(seller.id)).id).toBe(renewed.id)
      })

      it("adminExtendTrial pushes the end date out and adminEndTrial expires it", async () => {
        const { seller } = await createSeller(getContainer())
        const service = new SubscriptionService(getContainer())
        const trial = await service.startTrial(seller.id, "Growth")

        const extended = await service.adminExtendTrial(trial.id, 10)
        const gained = (new Date(extended.end_date).getTime() - new Date(trial.end_date).getTime()) / DAY
        expect(Math.round(gained)).toBe(10)

        const ended = await service.adminEndTrial(trial.id)
        expect(ended.status).toBe("expired")
        expect(await service.getActiveSubscription(seller.id)).toBeUndefined()
      })

      it("refuses to extend or end a paid subscription as if it were a trial", async () => {
        const { seller } = await createSeller(getContainer())
        const service = new SubscriptionService(getContainer())
        const paid = await service.renewSubscription({
          sellerId: seller.id,
          planName: "Growth",
          billingPeriod: "monthly",
          price: 1499,
          paymentReference: "REF-M",
        })

        await expect(service.adminExtendTrial(paid.id, 5)).rejects.toThrow("not a trial")
        await expect(service.adminEndTrial(paid.id)).rejects.toThrow("not a trial")
      })
    })

    describe("paying for a plan through GiyaPay", () => {
      const SECRET = "subscription-secret"

      async function payFor(token: string, sellerId: string, plan: string, amount: string) {
        const checkout = await api.post("/vendor/subscription/checkout", { plan_name: plan, billing_period: "monthly" }, { headers: bearer(token), ...noThrow })
        expect(checkout.status).toBe(200)
        // GiyaPay sends back its own nonce and order_id=undefined, signed over the panel's URL
        const params = { nonce: "gp-nonce", order_id: "undefined", refno: `REF-${Date.now()}`, timestamp: String(Date.now()), amount }
        const signature = giyapayCallbackSignature("https://seller.example.test/subscription", params, SECRET)
        return api.post("/vendor/subscription/activate", { ...params, signature }, { headers: bearer(token), ...noThrow })
      }

      beforeEach(async () => {
        await pgOf(getContainer())("giyapay_subscription_config").insert({ id: `gsc_${Date.now()}`, merchant_id: "SUB", merchant_secret: SECRET, is_enabled: true })
      })

      it("activates the plan that was paid for", async () => {
        const { seller, token } = await createSeller(getContainer())

        const res = await payFor(token, seller.id, "Premium", "399900")

        expect(res.status).toBe(200)
        expect(res.data.subscription).toMatchObject({ plan_name: "Premium", status: "active" })
      })

      it("treats a checkout started again later as new, not expired", async () => {
        const { seller, token } = await createSeller(getContainer())
        // An earlier checkout the seller abandoned hours ago
        await api.post("/vendor/subscription/checkout", { plan_name: "Starter", billing_period: "monthly" }, { headers: bearer(token) })
        await pgOf(getContainer())("subscription_payment_intent").where({ seller_id: seller.id }).update({ created_at: new Date(Date.now() - 3 * 60 * 60 * 1000) })

        const res = await payFor(token, seller.id, "Premium", "399900")

        expect(res.status).toBe(200)
        expect(res.data.subscription).toMatchObject({ plan_name: "Premium", status: "active" })
      })
    })

    describe("POST /admin/subscriptions/assign", () => {
      it("replaces the seller's active plan", async () => {
        const { seller, token: sellerToken } = await createSeller(getContainer())
        const { token } = await createAdmin(getContainer())
        await api.post("/vendor/subscription/trial", { plan_name: "Growth" }, { headers: bearer(sellerToken) })

        const res = await api.post(
          "/admin/subscriptions/assign",
          { seller_id: seller.id, plan_name: "Premium", duration_days: 90 },
          { headers: bearer(token) }
        )

        expect(res.status).toBe(201)
        expect(res.data.subscription).toMatchObject({ plan_name: "Premium", payment_reference: "admin_assigned" })
        const active = await pgOf(getContainer())("seller_subscription").where({ seller_id: seller.id, status: "active" })
        expect(active.map((s: any) => s.plan_name)).toEqual(["Premium"])
      })

      it("is admin-only", async () => {
        const { seller, token: sellerToken } = await createSeller(getContainer())
        const res = await api.post(
          "/admin/subscriptions/assign",
          { seller_id: seller.id, plan_name: "Premium" },
          { headers: bearer(sellerToken), ...noThrow }
        )
        expect(res.status).toBe(401)
      })
    })
  },
})
