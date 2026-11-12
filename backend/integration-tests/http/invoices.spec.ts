import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { issueOrderInvoice, issueSubscriptionInvoice } from "../../src/lib/invoice"
import { applyCustomMigrations, bearer, createAdmin, createCustomer, createPublishableKey, createSeller, givePlan, noThrow, pgOf } from "../helpers"

jest.setTimeout(180 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })

    async function placedOrder(sellerId: string, customerId?: string) {
      const container = getContainer()
      const order = await container.resolve(Modules.ORDER).createOrders({
        currency_code: "php",
        email: "buyer@example.test",
        customer_id: customerId,
        shipping_address: { first_name: "Juan", last_name: "Dela Cruz", address_1: "1 Rizal St", address_2: "Lahug", city: "Cebu City", province: "Cebu", postal_code: "6000", country_code: "ph" },
        items: [{ title: "Barong", quantity: 2, unit_price: 700 }],
        shipping_methods: [{ name: "Standard", amount: 120 }],
      })
      await container.resolve(ContainerRegistrationKeys.LINK).create({ seller: { seller_id: sellerId }, [Modules.ORDER]: { order_id: order.id } })
      return order
    }

    it("issues one invoice per order in the seller's own gapless series", async () => {
      const pg = pgOf(getContainer())
      const { seller } = await createSeller(getContainer())
      await pg("seller").where("id", seller.id).update({ tax_id: "123-456-789-00000", address_line: "12 Mango Ave", city: "Cebu City" })
      const first = await placedOrder(seller.id)
      const second = await placedOrder(seller.id)

      const a = await issueOrderInvoice(pg, first.id)
      const again = await issueOrderInvoice(pg, first.id)
      const b = await issueOrderInvoice(pg, second.id)

      expect(a!.number).toMatch(/-00000001$/)
      expect(again!.number).toBe(a!.number)
      expect(b!.number).toMatch(/-00000002$/)
      expect(a!.total).toBe(1520)
      expect(a!.pdf.subarray(0, 5).toString()).toBe("%PDF-")

      const row = await pg("invoice").where("id", a!.id).first()
      expect(row.data.issuer).toMatchObject({ name: seller.name, tin: "123-456-789-00000", vat_registered: false })
      expect(row.data.buyer.name).toBe("Juan Dela Cruz")
      expect(row.data.lines).toEqual([{ description: "Barong", quantity: 2, unit_price: 700 }])
      expect(row.data.shipping).toBe(120)
    })

    it("two requests racing for the same order get the same invoice", async () => {
      const pg = pgOf(getContainer())
      const { seller } = await createSeller(getContainer())
      const order = await placedOrder(seller.id)
      const [a, b] = await Promise.all([issueOrderInvoice(pg, order.id), issueOrderInvoice(pg, order.id)])
      expect(a!.number).toBe(b!.number)
      expect(Number((await pg("invoice").where("reference_id", order.id).count("id as c").first()).c)).toBe(1)
    })

    it("invoices a paid subscription from the platform, and never a free trial", async () => {
      const pg = pgOf(getContainer())
      const { seller } = await createSeller(getContainer())
      await givePlan(getContainer(), seller.id, { id: "vsub_paid_1", payment_reference: "GP-1", billing_period: "monthly" })
      const paid = await issueSubscriptionInvoice(pg, "vsub_paid_1")
      expect(paid!.number).toBe("MRT-00000001")
      expect(paid!.total).toBe(1499)

      const other = await createSeller(getContainer())
      await givePlan(getContainer(), other.seller.id, { id: "vsub_trial_1", price: 0, is_trial: true })
      expect(await issueSubscriptionInvoice(pg, "vsub_trial_1")).toBeNull()
    })

    it("a buyer downloads only their own order's invoice", async () => {
      const key = await createPublishableKey(getContainer())
      const { seller } = await createSeller(getContainer())
      const owner = await createCustomer(getContainer())
      const stranger = await createCustomer(getContainer())
      const order = await placedOrder(seller.id, owner.customer.id)
      const headers = (t: string) => ({ headers: { ...bearer(t), "x-publishable-api-key": key }, ...noThrow, responseType: "arraybuffer" as const })

      const mine = await api.get(`/store/account/orders/${order.id}/invoice`, headers(owner.token))
      expect(mine.status).toBe(200)
      expect(mine.headers["content-type"]).toContain("application/pdf")
      expect(Buffer.from(mine.data).subarray(0, 5).toString()).toBe("%PDF-")

      expect((await api.get(`/store/account/orders/${order.id}/invoice`, headers(stranger.token))).status).toBe(404)
      expect((await api.get(`/store/account/orders/${order.id}/invoice`, { headers: { "x-publishable-api-key": key }, ...noThrow })).status).toBe(401)
    })

    it("a seller lists and downloads only their own invoices; admins see all", async () => {
      const pg = pgOf(getContainer())
      const a = await createSeller(getContainer())
      const b = await createSeller(getContainer())
      await givePlan(getContainer(), a.seller.id)
      await givePlan(getContainer(), b.seller.id)
      const invoice = await issueOrderInvoice(pg, (await placedOrder(a.seller.id)).id)

      const list = await api.get("/vendor/invoices", { headers: bearer(a.token) })
      expect(list.data.invoices.map((i: any) => i.id)).toEqual([invoice!.id])
      expect(list.data.invoices[0].pdf).toBeUndefined()
      expect((await api.get("/vendor/invoices", { headers: bearer(b.token) })).data.count).toBe(0)

      expect((await api.get(`/vendor/invoices/${invoice!.id}`, { headers: bearer(a.token), ...noThrow })).status).toBe(200)
      expect((await api.get(`/vendor/invoices/${invoice!.id}`, { headers: bearer(b.token), ...noThrow })).status).toBe(404)

      const admin = await createAdmin(getContainer())
      expect((await api.get("/admin/invoices", { headers: bearer(admin.token) })).data.count).toBe(1)
      expect((await api.get(`/admin/invoices/${invoice!.id}`, { headers: bearer(admin.token), ...noThrow })).status).toBe(200)
    })
  },
})
