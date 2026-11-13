import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import { applyCustomMigrations, bearer, createAdmin, createCustomer, createPublishableKey, createSeller, givePlan, makeReady, noThrow, pgOf } from "../helpers"

jest.setTimeout(180 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })

    async function shopWithProduct(open: boolean, status = "published") {
      const c = getContainer()
      const { seller, token } = await createSeller(c)
      await makeReady(c, seller.id)
      if (open) await givePlan(c, seller.id)
      const product = await (c.resolve(Modules.PRODUCT) as any).createProducts({ title: `Item of ${seller.handle}`, status })
      await pgOf(c)("seller_seller_product_product").insert({ id: `l_${product.id}`, seller_id: seller.id, product_id: product.id })
      return { seller, product, token }
    }

    describe("listing reports", () => {
      it("files a report against a real product or shop, and an admin closes it", async () => {
        const c = getContainer()
        const key = await createPublishableKey(c)
        const headers = { "x-publishable-api-key": key }
        const { seller, product } = await shopWithProduct(true)
        const report = (body: any) => api.post("/store/reports", body, { headers, ...noThrow })
        const details = { reason: "Counterfeit or fake item", comment: "The logo is misspelled on every photo." }

        expect((await report({ kind: "product", target: "prod_nope", ...details })).status).toBe(404)
        expect((await report({ kind: "product", target: product.id, reason: "Because", comment: details.comment })).status).toBe(400)
        expect((await report({ kind: "product", target: product.handle, ...details, email: "Buyer@Example.test" })).status).toBe(200)
        expect((await report({ kind: "seller", target: seller.handle, ...details })).status).toBe(200)

        const admin = bearer((await createAdmin(c)).token)
        const open = await api.get("/admin/listing-reports?status=open", { headers: admin })
        expect(open.data.open).toBe(2)
        const onProduct = open.data.reports.find((r: any) => r.kind === "product")
        expect(onProduct).toMatchObject({ target_id: product.id, seller_id: seller.id, seller_name: seller.name, reporter_email: "buyer@example.test", status: "open" })

        const closed = await api.post(`/admin/listing-reports/${onProduct.id}`, { status: "resolved", admin_note: "Listing removed" }, { headers: admin })
        expect(closed.data.report).toMatchObject({ status: "resolved", admin_note: "Listing removed" })
        expect(closed.data.report.resolved_at).toBeTruthy()
        expect((await api.get("/admin/listing-reports?status=open", { headers: admin })).data.open).toBe(1)
        expect((await api.post(`/admin/listing-reports/${onProduct.id}`, { status: "deleted" }, { headers: admin, ...noThrow })).status).toBe(400)
      })

      it("is admin-only to read and decide", async () => {
        const c = getContainer()
        const buyer = bearer((await createCustomer(c)).token)
        const seller = bearer((await createSeller(c)).token)
        for (const headers of [{}, buyer, seller]) {
          expect((await api.get("/admin/listing-reports", { headers, ...noThrow })).status).toBe(401)
          expect((await api.post("/admin/listing-reports/1", { status: "dismissed" }, { headers, ...noThrow })).status).toBe(401)
        }
      })
    })

    describe("sitemap", () => {
      it("lists published products of open shops only", async () => {
        const key = await createPublishableKey(getContainer())
        const open = await shopWithProduct(true)
        const draft = await shopWithProduct(true, "draft")
        const noPlan = await shopWithProduct(false)
        const suspended = await shopWithProduct(true)
        await pgOf(getContainer())("seller").where("id", suspended.seller.id).update({ store_status: "SUSPENDED" })

        const { data } = await api.get("/store/sitemap", { headers: { "x-publishable-api-key": key } })
        const products = data.products.map((p: any) => p.handle)
        const shops = data.shops.map((s: any) => s.handle)
        expect(products).toContain(open.product.handle)
        expect(products).not.toContain(draft.product.handle)
        expect(products).not.toContain(noPlan.product.handle)
        expect(products).not.toContain(suspended.product.handle)
        expect(shops).toContain(open.seller.handle)
        expect(shops).not.toContain(noPlan.seller.handle)
        expect(shops).not.toContain(suspended.seller.handle)
        expect(Array.isArray(data.categories)).toBe(true)
      })
    })

    describe("seller VAT status", () => {
      it("is saved from the verification form and defaults to non-VAT", async () => {
        const c = getContainer()
        const { seller, token } = await createSeller(c)
        await givePlan(c, seller.id)
        const row = () => pgOf(c)("seller").where("id", seller.id).first()
        expect((await row()).vat_registered).toBe(false)
        const saved = await api.post("/vendor/sellers/me/verification", { vat_registered: true }, { headers: bearer(token), ...noThrow })
        expect(saved.status).toBe(200)
        expect((await row()).vat_registered).toBe(true)
        // Anything but a boolean is ignored rather than coerced
        await api.post("/vendor/sellers/me/verification", { vat_registered: "no" }, { headers: bearer(token), ...noThrow })
        expect((await row()).vat_registered).toBe(true)
      })
    })
  },
})
