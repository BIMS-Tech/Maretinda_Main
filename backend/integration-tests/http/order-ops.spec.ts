import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { recordAttempt, unconfirmedAttempts } from "../../src/lib/giyapay-attempts"
import { applyCustomMigrations, bearer, createAdmin, createCustomer, createPublishableKey, createSeller, givePlan, noThrow, pgOf } from "../helpers"

jest.setTimeout(180 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })

    describe("buyer cancels an order", () => {
      async function order(customerId: string, captured = 0) {
        const container = getContainer()
        const created = await container.resolve(Modules.ORDER).createOrders({
          currency_code: "php",
          email: "buyer@example.test",
          customer_id: customerId,
          items: [{ title: "Barong", quantity: 1, unit_price: 700 }],
        })
        const payments = container.resolve(Modules.PAYMENT)
        const collection = await payments.createPaymentCollections({ currency_code: "php", amount: 700 })
        await container.resolve(ContainerRegistrationKeys.LINK).create({
          [Modules.ORDER]: { order_id: created.id },
          [Modules.PAYMENT]: { payment_collection_id: collection.id },
        })
        if (captured) await pgOf(container)("payment_collection").where("id", collection.id).update({ captured_amount: captured })
        return created
      }

      it("cancels their own unpaid, unstarted order; not someone else's, not a paid one", async () => {
        const key = await createPublishableKey(getContainer())
        const owner = await createCustomer(getContainer())
        const stranger = await createCustomer(getContainer())
        const post = (id: string, token: string) =>
          api.post(`/store/account/orders/${id}/cancel`, {}, { headers: { ...bearer(token), "x-publishable-api-key": key }, ...noThrow })

        const cod = await order(owner.customer.id)
        expect((await post(cod.id, stranger.token)).status).toBe(404)
        const ok = await post(cod.id, owner.token)
        expect(ok.status).toBe(200)
        expect((await pgOf(getContainer())("order").where("id", cod.id).first()).status).toBe("canceled")
        expect((await post(cod.id, owner.token)).data.code).toBe("already_canceled")

        const paid = await order(owner.customer.id, 700)
        const refused = await post(paid.id, owner.token)
        expect(refused.status).toBe(409)
        expect(refused.data.code).toBe("paid_online")
        expect((await pgOf(getContainer())("order").where("id", paid.id).first()).status).not.toBe("canceled")
      })
    })

    describe("COD cash", () => {
      async function booking(sellerId: string, over: Record<string, any> = {}) {
        const id = `sso_${Math.random().toString(36).slice(2, 10)}`
        await pgOf(getContainer())("seller_shipping_order").insert({
          id,
          seller_id: sellerId,
          provider: "flyingtigers",
          status: "delivered",
          parcel_details: JSON.stringify({ is_cod: true, cod_amount: 890 }),
          ...over,
        })
        return id
      }

      it("follows the cash from courier to Maretinda to the seller, in that order", async () => {
        const a = await createSeller(getContainer())
        const b = await createSeller(getContainer())
        await givePlan(getContainer(), a.seller.id)
        await givePlan(getContainer(), b.seller.id)
        const mine = await booking(a.seller.id)
        await booking(a.seller.id, { status: "in_transit" })
        await booking(a.seller.id, { parcel_details: JSON.stringify({ is_cod: false }) })
        await booking(b.seller.id)
        const admin = bearer((await createAdmin(getContainer())).token)

        const start = await api.get("/admin/cod-remittances", { headers: admin })
        expect(start.data.summary.with_courier).toEqual({ count: 2, amount: 1780 })

        // Can't pay a seller cash that hasn't arrived
        const early = await api.post("/admin/cod-remittances", { ids: [mine], step: "paid", reference: "X" }, { headers: admin })
        expect(early.data.updated).toBe(0)

        await api.post("/admin/cod-remittances", { ids: [mine], step: "received", reference: "FT-REMIT-1" }, { headers: admin })
        await api.post("/admin/cod-remittances", { ids: [mine], step: "paid", reference: "BANK-1" }, { headers: admin })
        const end = await api.get("/admin/cod-remittances", { headers: admin })
        expect(end.data.summary.paid).toEqual({ count: 1, amount: 890 })
        expect(end.data.summary.with_courier.count).toBe(1)

        const sellerView = await api.get("/vendor/cod-remittances", { headers: bearer(a.token) })
        expect(sellerView.data.remittances.map((r: any) => [r.id, r.state, r.cod_paid_ref])).toEqual([[mine, "paid", "BANK-1"]])
        expect((await api.post("/admin/cod-remittances", { ids: [mine], step: "received", reference: "" }, { headers: admin, ...noThrow })).status).toBe(400)
      })
    })

    describe("admin audit log", () => {
      it("records an admin's change with secrets masked, and not their reads", async () => {
        const pg = pgOf(getContainer())
        const admin = await createAdmin(getContainer())
        await api.get("/admin/cod-remittances", { headers: bearer(admin.token) })
        await api.post("/admin/cod-remittances", { ids: ["x"], step: "received", reference: "R", api_key: "sk_live_1" }, { headers: bearer(admin.token) })
        await new Promise((r) => setTimeout(r, 200))

        const log = await api.get("/admin/audit-log", { headers: bearer(admin.token) })
        expect(log.data.entries).toHaveLength(1)
        expect(log.data.entries[0]).toMatchObject({ actor_id: admin.user.id, method: "POST", path: "/admin/cod-remittances", status: 200 })
        expect(log.data.entries[0].body).toMatchObject({ reference: "R", api_key: "[redacted]" })
        expect(Number((await pg("admin_audit_log").count("id as c").first()).c)).toBe(1)
      })
    })

    describe("payments that never came back", () => {
      async function cartAtGiyaPay() {
        const container = getContainer()
        const cart = await container.resolve(Modules.CART).createCarts({ currency_code: "php", email: "buyer@example.test" })
        const payments = container.resolve(Modules.PAYMENT)
        const collection = await payments.createPaymentCollections({ currency_code: "php", amount: 890 })
        await container.resolve(ContainerRegistrationKeys.LINK).create({
          [Modules.CART]: { cart_id: cart.id },
          [Modules.PAYMENT]: { payment_collection_id: collection.id },
        })
        await pgOf(container)("payment_session").insert({
          id: `payses_${Math.random().toString(36).slice(2, 10)}`,
          currency_code: "php",
          amount: 890,
          raw_amount: JSON.stringify({ value: "890", precision: 20 }),
          provider_id: "pp_giyapay_giyapay",
          status: "pending",
          payment_collection_id: collection.id,
        })
        return cart
      }

      it("lists a cart sent to GiyaPay with no confirmation, until it is paid or looked at", async () => {
        const pg = pgOf(getContainer())
        const admin = await createAdmin(getContainer())
        await api.get("/admin/giyapay/transactions", { headers: bearer(admin.token) }).catch(() => null)
        const lost = await cartAtGiyaPay()
        const paid = await cartAtGiyaPay()

        expect((await api.post("/giyapay/attempt", { cart_id: lost.id, method: "GCASH" })).data.success).toBe(true)
        expect(await recordAttempt(pg, paid.id)).toBe(true)
        expect((await api.post("/giyapay/attempt", { cart_id: "cart_nope" })).data.success).toBe(false)
        await pg("giyapay_transaction").insert({ id: "t1", reference_number: "R1", cart_id: paid.id, amount: 890, status: "SUCCESS" })

        expect(await unconfirmedAttempts(pg)).toEqual([])
        const later = new Date(Date.now() + 45 * 60 * 1000)
        const open = await unconfirmedAttempts(pg, later)
        expect(open.map((a: any) => [a.cart_id, a.amount, a.email, a.method])).toEqual([[lost.id, 890, "buyer@example.test", "GCASH"]])

        const res = await api.post("/admin/giyapay/unconfirmed", { id: open[0].id, note: "Not in GiyaPay: buyer abandoned" }, { headers: bearer(admin.token) })
        expect(res.data.resolved).toBe(true)
        expect(await unconfirmedAttempts(pg, later)).toEqual([])
      })
    })
  },
})
