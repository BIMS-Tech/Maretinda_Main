import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import { applyCustomMigrations, bearer, createAdmin, createCustomer, createSeller, givePlan, makeReady, noThrow, pgOf } from "../helpers"

jest.setTimeout(300 * 1000)

/**
 * The admin dashboard's figures, worked out on the server with the same
 * rules the rest of the marketplace uses. The dashboard used to count one
 * page of each list in the browser, divide peso totals by 100, and show the
 * oldest orders as "recent".
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })
    const overview = async () => {
      const res = await api.get("/admin/marketplace-overview", { headers: bearer((await createAdmin(getContainer())).token), ...noThrow })
      expect(res.status).toBe(200)
      return res.data
    }

    it("tells shops that can sell from closed ones, and why they're closed", async () => {
      const c = getContainer()
      const selling = (await createSeller(c)).seller
      await givePlan(c, selling.id)
      await makeReady(c, selling.id)
      const noPlan = (await createSeller(c)).seller
      await makeReady(c, noPlan.id)
      const unfinished = (await createSeller(c)).seller
      await givePlan(c, unfinished.id)

      const { sellers } = await overview()
      expect(sellers).toMatchObject({ total: 3, selling: 1, closed_no_plan: 1, closed_setup: 1 })
    })

    it("counts paid plans, trials and monthly recurring revenue", async () => {
      const c = getContainer()
      await givePlan(c, (await createSeller(c)).seller.id, { plan_name: "Growth", price: 1499, billing_period: "monthly", is_trial: false })
      await givePlan(c, (await createSeller(c)).seller.id, { plan_name: "Premium", price: 35990, billing_period: "yearly", is_trial: false })
      await givePlan(c, (await createSeller(c)).seller.id, { plan_name: "Starter", price: 499, is_trial: true })
      const { subscriptions } = await overview()
      expect(subscriptions).toMatchObject({ paid: 2, trials: 1 })
      // A yearly plan counts as a twelfth of its price each month
      expect(subscriptions.mrr).toBeCloseTo(1499 + 35990 / 12, 2)
    })

    it("totals orders in pesos and lists the newest first", async () => {
      const c = getContainer()
      const { customer } = await createCustomer(c, { first_name: "Maria", last_name: "Santos" })
      const orders = c.resolve(Modules.ORDER)
      const [older] = await orders.createOrders([
        { currency_code: "php", email: "m@example.test", customer_id: customer.id, items: [{ title: "Barong", quantity: 1, unit_price: 374 }] },
      ])
      await pgOf(c)("order").where({ id: older.id }).update({ created_at: new Date(Date.now() - 40 * 86_400_000) })
      const [newer] = await orders.createOrders([
        { currency_code: "php", email: "m@example.test", customer_id: customer.id, items: [{ title: "Terno", quantity: 2, unit_price: 770 }] },
      ])

      const data = await overview()
      expect(data.orders).toMatchObject({ total: 2, last_30_days: 1, sales_30_days: 1540 })
      expect(data.recent_orders[0]).toMatchObject({ id: newer.id, total: 1540, customer_name: "Maria Santos" })
      expect(data.recent_orders.map((o: any) => o.id)).toEqual([newer.id, older.id])
    })

    it("counts the work waiting for an admin", async () => {
      const c = getContainer()
      const pg = pgOf(c)
      await pg("seller_application").insert([
        { id: "sapp_1", email: "a@example.test", status: "pending", business_name: "A" },
        { id: "sapp_2", email: "b@example.test", status: "approved", business_name: "B" },
      ])
      // verification_status is our own column; the seller module doesn't set it
      const { seller } = await createSeller(c)
      await pg("seller").where("id", seller.id).update({ verification_status: "pending_review" })
      const { requests } = await overview()
      expect(requests).toMatchObject({ seller_applications: 1, verifications: 1, returns_escalated: 0 })
    })

    describe("a seller's standing", () => {
      const standing = async (id: string) =>
        api.get(`/admin/sellers/${id}/standing`, { headers: bearer((await createAdmin(getContainer())).token), ...noThrow })

      it("says an open shop's plan and that setup is done", async () => {
        const c = getContainer()
        const { seller } = await createSeller(c)
        await givePlan(c, seller.id, { plan_name: "Premium", is_trial: false })
        await makeReady(c, seller.id)
        const res = await standing(seller.id)
        expect(res.status).toBe(200)
        expect(res.data).toMatchObject({ open: true, plan: { name: "Premium", trial: false }, setup: { ready: true, missing: [] } })
      })

      it("says what keeps a closed shop closed", async () => {
        const { seller } = await createSeller(getContainer())
        const { data } = await standing(seller.id)
        expect(data).toMatchObject({ open: false, plan: null, setup: { ready: false } })
        expect(data.setup.missing).toContain("settlement bank details")
      })

      it("404s for a seller that doesn't exist", async () => {
        expect((await standing("sel_nope")).status).toBe(404)
      })
    })

    it("finds a seller's plans by shop name or email", async () => {
      const c = getContainer()
      const { seller } = await createSeller(c, { name: "Bahay Kubo Crafts", email: "kubo@example.test" })
      await givePlan(c, seller.id)
      await givePlan(c, (await createSeller(c)).seller.id)
      const as = { headers: bearer((await createAdmin(c)).token), ...noThrow }
      for (const q of ["kubo crafts", "KUBO@example", seller.id]) {
        const res = await api.get(`/admin/subscriptions?q=${encodeURIComponent(q)}`, as)
        expect(res.status).toBe(200)
        expect(res.data.subscriptions.map((s: any) => s.seller_id)).toEqual([seller.id])
      }
    })

    it("is for admins only", async () => {
      const { token } = await createSeller(getContainer())
      expect((await api.get("/admin/marketplace-overview", { headers: bearer(token), ...noThrow })).status).toBe(401)
    })
  },
})
