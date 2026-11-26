import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { issueCreditNote, issueFeesInvoice, issueOrderInvoice, issueSubscriptionInvoice } from "../../src/lib/invoice"
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

    afterEach(() => {
      delete process.env.INVOICE_PTI_NUMBER
      delete process.env.SELLER_INVOICING_ENABLED
    })

    it("issues one order summary per order in the seller's own gapless series", async () => {
      const pg = pgOf(getContainer())
      const { seller } = await createSeller(getContainer())
      await pg("seller").where("id", seller.id).update({ tax_id: "123-456-789-00000", address_line: "12 Mango Ave", city: "Cebu City" })
      const first = await placedOrder(seller.id)
      const second = await placedOrder(seller.id)

      const a = await issueOrderInvoice(pg, first.id)
      const again = await issueOrderInvoice(pg, first.id)
      const b = await issueOrderInvoice(pg, second.id)

      expect(a!.number).toMatch(/^OS-[A-Z0-9]{6}-\d{4}-0000001$/)
      expect(a!).toMatchObject({ document: "summary", official: false })
      expect(again!.number).toBe(a!.number)
      expect(b!.number).toMatch(/-0000002$/)
      expect(a!.total).toBe(1520)
      expect(a!.pdf.subarray(0, 5).toString()).toBe("%PDF-")

      const row = await pg("invoice").where("id", a!.id).first()
      expect(row.data.issuer).toMatchObject({ name: seller.name, tin: "123-456-789-00000", vat_registered: false })
      expect(row.unique_id).toMatch(/^MRT[0-9A-F]{16}$/)
      expect(row.data.verify_url).toContain(`/verify-invoice/${row.unique_id}`)
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
      expect(paid!.number).toMatch(/^MRT-BS-\d{4}-0000001$/)
      expect(paid!).toMatchObject({ document: "statement", official: false, total: 1499 })
      const data = (await pg("invoice").where("id", paid!.id).first("data")).data
      expect(data.issuer).toMatchObject({ name: "BIMS TECHNOLOGIES INC.", tin: "767-899-470-00000", vat_registered: true })
      expect(data.buyer.merchant_id).toMatch(/^MRT-M-\d{5}$/)

      const other = await createSeller(getContainer())
      await givePlan(getContainer(), other.seller.id, { id: "vsub_trial_1", price: 0, is_trial: true })
      expect(await issueSubscriptionInvoice(pg, "vsub_trial_1")).toBeNull()
    })

    it("becomes an invoice in its own series once the BIR permit is set; shops' order documents need their own switch too", async () => {
      const pg = pgOf(getContainer())
      const { seller } = await createSeller(getContainer())
      await givePlan(getContainer(), seller.id, { id: "vsub_before" })
      const before = await issueSubscriptionInvoice(pg, "vsub_before")
      process.env.INVOICE_PTI_NUMBER = "PTI-081-2026-00001"
      await givePlan(getContainer(), seller.id, { id: "vsub_after" })
      const after = await issueSubscriptionInvoice(pg, "vsub_after")
      expect(before!.number).toMatch(/^MRT-BS-/)
      expect(after!).toMatchObject({ document: "invoice", official: true })
      expect(after!.number).toMatch(/^MRT-\d{4}-0000001$/)

      expect((await issueOrderInvoice(pg, (await placedOrder(seller.id)).id))!.document).toBe("summary")
      process.env.SELLER_INVOICING_ENABLED = "true"
      const official = await issueOrderInvoice(pg, (await placedOrder(seller.id)).id)
      expect(official!).toMatchObject({ document: "invoice", official: true })
      expect(official!.number).toMatch(/^S-[A-Z0-9]{6}-\d{4}-0000001$/)
    })

    it("an issued document can't be changed or deleted, only reduced by a credit note", async () => {
      const pg = pgOf(getContainer())
      const { seller } = await createSeller(getContainer())
      await givePlan(getContainer(), seller.id, { id: "vsub_credit" })
      const original = await issueSubscriptionInvoice(pg, "vsub_credit")

      await expect(pg("invoice").where("id", original!.id).update({ total: 1 })).rejects.toThrow(/cannot be changed or deleted/)
      await expect(pg("invoice").where("id", original!.id).delete()).rejects.toThrow(/cannot be changed or deleted/)

      const credit = await issueCreditNote(pg, original!.id, { amount: 499, reason: "Overbilling" })
      expect(credit).toMatchObject({ document: "adjustment", total: 499 })
      expect((await issueCreditNote(pg, original!.id, { amount: 1001, reason: "x" })) as any).toEqual({ error: "At most ₱1000.00 of this document is left to credit." })
      const row = await pg("invoice").where("id", (credit as any).id).first("corrects_id", "data")
      expect(row.corrects_id).toBe(original!.id)
      expect(row.data.original).toMatchObject({ number: original!.number, reason: "Overbilling" })

      const order = await issueOrderInvoice(pg, (await placedOrder(seller.id)).id)
      expect(((await issueCreditNote(pg, order!.id, { amount: 1, reason: "x" })) as any).error).toMatch(/corrected by the shop/)
    })

    it("bills a shop for the fees its payouts deducted in a month", async () => {
      const pg = pgOf(getContainer())
      const { seller } = await createSeller(getContainer())
      const at = new Date("2026-10-15T04:00:00Z")
      await pg("settlement_line").insert([
        { transaction_id: "gt_1", seller_id: seller.id, reference_number: "R1", kind: "dft", generation_id: "g1", gross_amount: 1000, net_amount: 970, created_at: at },
        { transaction_id: "gt_2", seller_id: seller.id, reference_number: "R2", kind: "dft", generation_id: "g1", gross_amount: 200, net_amount: 190, created_at: at },
        { transaction_id: "gt_3", seller_id: seller.id, reference_number: "R3", kind: "legacy", generation_id: "g0", gross_amount: 500, net_amount: 500, created_at: at },
      ])
      const doc = await issueFeesInvoice(pg, seller.id, "2026-10")
      expect(doc!.total).toBe(40)
      const data = (await pg("invoice").where("id", doc!.id).first("data")).data
      expect(data.lines).toEqual([
        { description: "Payment processing fee, October 2026", quantity: 1, unit_price: 30 },
        { description: "Payout fee, October 2026 (2 payments)", quantity: 1, unit_price: 10 },
      ])
      expect((await issueFeesInvoice(pg, seller.id, "2026-10"))!.id).toBe(doc!.id)
      expect(await issueFeesInvoice(pg, seller.id, "2026-09")).toBeNull()
    })

    it("anyone with the QR code can check a document, without seeing who bought", async () => {
      const key = await createPublishableKey(getContainer())
      const pg = pgOf(getContainer())
      const { seller } = await createSeller(getContainer())
      const doc = await issueOrderInvoice(pg, (await placedOrder(seller.id)).id)
      const { unique_id } = await pg("invoice").where("id", doc!.id).first("unique_id")
      const res = await api.get(`/store/invoice-verify/${unique_id}`, { headers: { "x-publishable-api-key": key } })
      expect(res.data.document).toMatchObject({ number: doc!.number, document: "summary", issuer: seller.name, total: 1520, credited: 0 })
      expect(JSON.stringify(res.data)).not.toContain("Juan")
      expect((await api.get("/store/invoice-verify/MRT0000000000000000", { headers: { "x-publishable-api-key": key }, ...noThrow })).status).toBe(404)
      expect((await api.get("/store/invoice-verify/nope", { headers: { "x-publishable-api-key": key }, ...noThrow })).status).toBe(404)
    })

    it("admins get a document's data as JSON and issue credit notes", async () => {
      const pg = pgOf(getContainer())
      const { seller } = await createSeller(getContainer())
      await givePlan(getContainer(), seller.id, { id: "vsub_admin" })
      const doc = await issueSubscriptionInvoice(pg, "vsub_admin")
      const admin = await createAdmin(getContainer())
      const json = await api.get(`/admin/invoices/${doc!.id}?format=json`, { headers: bearer(admin.token) })
      expect(json.data).toMatchObject({ number: doc!.number, document: "statement", totals: { total: 1499, vat: 160.61 } })
      const refused = await api.post(`/admin/invoices/${doc!.id}/credit-notes`, { amount: 10 }, { headers: bearer(admin.token), ...noThrow })
      expect(refused.status).toBe(400)
      const made = await api.post(`/admin/invoices/${doc!.id}/credit-notes`, { amount: 10, reason: "Goodwill discount" }, { headers: bearer(admin.token) })
      expect(made.status).toBe(201)
      expect((await api.get(`/admin/invoices/${doc!.id}?format=json`, { headers: bearer(admin.token) })).data.credited_by).toHaveLength(1)
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
