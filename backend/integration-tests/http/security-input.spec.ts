import crypto from "crypto"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import { sign } from "jsonwebtoken"
import FlashSaleService from "../../src/services/flash-sale"
import GiyaPayService from "../../src/services/giyapay"
import {
  applyCustomMigrations,
  bearer,
  createAdmin,
  createCustomer,
  createPublishableKey,
  createSeller,
  multipart,
  noThrow,
  pgOf,
} from "../helpers"

jest.setTimeout(300 * 1000)

const SQLI = `'; DROP TABLE customer; --`
const XSS = `<script>alert(1)</script>`

/** Values a careless or hostile client sends instead of what the form would. */
const HOSTILE: unknown[] = [
  null,
  [],
  {},
  "",
  SQLI,
  XSS,
  "x".repeat(50_000),
  -1,
  0,
  1e308,
  NaN,
  true,
  ["array"],
  { $ne: null },
  { __proto__: { admin: true } },
]

const STACK = /\bat .+\.(js|ts):\d+|node_modules|ECONNREFUSED|relation ".+" does not exist|syntax error at/i

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
      await new FlashSaleService(getContainer()).initTables()
      // Creates giyapay_transaction, which exists on any server that has taken a payment.
      await new GiyaPayService(getContainer()).getConfig()
    })

    beforeEach(async () => {
      pk = await createPublishableKey(getContainer())
    })

    describe("hostile input on public endpoints", () => {
      const endpoints: [string, string, (v: unknown) => Record<string, unknown>][] = [
        ["/giyapay/verify", "POST", (v) => ({ nonce: v, order_id: v, refno: v, timestamp: v, amount: v, signature: v, cart_id: v })],
        ["/giyapay/update-transaction", "POST", (v) => ({ reference_number: v, order_id: v, cart_id: v })],
        ["/webhooks/ninjavan", "POST", (v) => ({ tracking_id: v, event: v, status: v })],
        ["/webhooks/flyingtigers", "POST", (v) => ({ tracking_no: v, event: v })],
        ["/store/subscription/initiate-payment", "POST", (v) => ({ plan_name: v })],
        ["/store/subscription/activate-renewal", "POST", (v) => ({ reference_number: v, order_id: v })],
        ["/store/calculate-shipping", "POST", (v) => ({ origin_postal: v, dest_postal: v, parcel: { weight_kg: v, length_cm: v } })],
        ["/store/assistant", "POST", (v) => ({ question: v, history: v })],
      ]

      it.each(endpoints)("%s survives every hostile value without a crash or leak", async (url, method, body) => {
        const problems: string[] = []
        for (const v of HOSTILE) {
          const res = await api.request({ method, url, data: body(v), ...store() })
          const text = typeof res.data === "string" ? res.data : JSON.stringify(res.data)
          if (res.status >= 500) problems.push(`${JSON.stringify(v)?.slice(0, 40)} → ${res.status}`)
          if (STACK.test(text)) problems.push(`${JSON.stringify(v)?.slice(0, 40)} leaked internals`)
        }
        expect(problems).toEqual([])
      })

      it.each([
        ["/store/vouchers", "seller_id"],
        ["/store/giyapay/transaction", "order_id"],
        ["/store/subscription/verify-payment", "ref"],
        ["/store/reels", "limit"],
        ["/store/reels", "offset"],
        ["/store/trending", "limit"],
        ["/store/flash-sales", "limit"],
        ["/store/campaigns", "limit"],
      ])("GET %s?%s= survives hostile values", async (url, param) => {
        const problems: string[] = []
        for (const v of [SQLI, XSS, "-1", "NaN", "99999999999999", "1e308", "x".repeat(5000)]) {
          const res = await api.get(`${url}?${param}=${encodeURIComponent(v)}`, store())
          if (res.status >= 500) problems.push(`${v.slice(0, 30)} → ${res.status}`)
          if (STACK.test(JSON.stringify(res.data))) problems.push(`${v.slice(0, 30)} leaked internals`)
        }
        expect(problems).toEqual([])
      })

      it("SQL injection doesn't reach the database", async () => {
        await api.get(`/store/vouchers?seller_id=${encodeURIComponent(SQLI)}`, store())
        await api.post("/giyapay/update-transaction", { reference_number: SQLI }, noThrow)
        await api.post("/webhooks/ninjavan", { tracking_id: SQLI, event: "x" }, noThrow)
        const { rows } = await pgOf(getContainer()).raw(`SELECT to_regclass('public.customer') AS t`)
        expect(rows[0].t).toBe("customer")
      })

      it("malformed JSON gets a clean client error", async () => {
        const res = await api.post("/giyapay/verify", "{not json", {
          headers: { "content-type": "application/json" },
          ...noThrow,
        })
        expect(res.status).toBeGreaterThanOrEqual(400)
        expect(res.status).toBeLessThan(500)
        expect(STACK.test(JSON.stringify(res.data))).toBe(false)
      })
    })

    describe("courier webhooks can't be spoofed", () => {
      const shipment = async (provider: string, tracking: string) =>
        pgOf(getContainer())("seller_shipping_order").insert({
          id: `so_${tracking}`,
          seller_id: "sel_1",
          medusa_order_id: `order_${tracking}`,
          provider,
          tracking_number: tracking,
          status: "pending_pickup",
          created_at: new Date(),
          updated_at: new Date(),
        })

      const statusOf = async (tracking: string) =>
        (await pgOf(getContainer())("seller_shipping_order").where({ tracking_number: tracking }).first()).status

      it("an unsigned Ninja Van call can't mark a parcel delivered", async () => {
        await shipment("ninjavan", "NV1")
        const res = await api.post(
          "/webhooks/ninjavan",
          { tracking_id: "NV1", event: "Delivered, Received by Customer", status: "x" },
          noThrow
        )
        expect(res.status).toBe(401)
        expect(await statusOf("NV1")).toBe("pending_pickup")
      })

      it("a correctly signed Ninja Van call is accepted", async () => {
        await shipment("ninjavan", "NV2")
        const body = JSON.stringify({ tracking_id: "NV2", event: "Delivered, Received by Customer" })
        const hmac = crypto.createHmac("sha256", process.env.NINJAVAN_WEBHOOK_SECRET!).update(body).digest("base64")

        const res = await api.post("/webhooks/ninjavan", body, {
          headers: { "content-type": "application/json", "x-ninjavan-hmac-sha256": hmac },
          ...noThrow,
        })

        expect(res.status).toBe(200)
        expect(await statusOf("NV2")).toBe("delivered")
      })

      it("an unknown Ninja Van event doesn't wipe the shipment status", async () => {
        await shipment("ninjavan", "NV3")
        const body = JSON.stringify({ tracking_id: "NV3", event: "Teleported" })
        const hmac = crypto.createHmac("sha256", process.env.NINJAVAN_WEBHOOK_SECRET!).update(body).digest("base64")
        await api.post("/webhooks/ninjavan", body, {
          headers: { "content-type": "application/json", "x-ninjavan-hmac-sha256": hmac },
          ...noThrow,
        })
        expect(await statusOf("NV3")).toBe("pending_pickup")
      })

      it("an unsigned Flying Tigers call is rejected", async () => {
        await shipment("flyingtigers", "FT1")
        const res = await api.post("/webhooks/flyingtigers", { tracking_no: "FT1", event: "Delivered" }, noThrow)
        expect(res.status).toBe(401)
        expect(await statusOf("FT1")).toBe("pending_pickup")
      })

      it("a Flying Tigers call with a bad signature is rejected", async () => {
        await shipment("flyingtigers", "FT2")
        const res = await api.post("/webhooks/flyingtigers", { tracking_no: "FT2", event: "Delivered" }, {
          headers: { "x-fte-webhook-timestamp": "1", "x-fte-webhook-signature": "v1=deadbeef" },
          ...noThrow,
        })
        expect(res.status).toBe(401)
      })
    })

    describe("file uploads", () => {
      const send = (url: string, name: string, type: string, bytes: Buffer, headers: Record<string, string> = {}) => {
        const { body, headers: contentType } = multipart(name, type, bytes)
        return api.post(url, body, { headers: { ...contentType, ...headers }, ...noThrow })
      }
      const PNG = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex")
      const HTML = Buffer.from("<html><script>alert(document.cookie)</script></html>")
      const SVG = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>`)

      it("/upload refuses anonymous callers", async () => {
        const res = await send("/upload", "a.png", "image/png", PNG)
        expect(res.status).toBe(401)
      })

      it("/uploads-vendor refuses a customer's token", async () => {
        const { token } = await createCustomer(getContainer())
        const res = await send("/uploads-vendor", "a.png", "image/png", PNG, bearer(token))
        expect(res.status).toBe(401)
      })

      it("/uploads-vendor/video refuses a customer's token", async () => {
        const { token } = await createCustomer(getContainer())
        const res = await send("/uploads-vendor/video", "a.mp4", "video/mp4", PNG, bearer(token))
        expect(res.status).toBe(401)
      })

      it("rejects an HTML file disguised as a PNG", async () => {
        const res = await send("/store/uploads", "cat.png", "image/png", HTML, { "x-publishable-api-key": pk })
        expect(res.status).toBe(400)
      })

      it("rejects an HTML file disguised as a PDF", async () => {
        const res = await send("/store/uploads", "id.pdf", "application/pdf", HTML, { "x-publishable-api-key": pk })
        expect(res.status).toBe(400)
      })

      it("rejects SVG, which can carry script", async () => {
        const { token } = await createSeller(getContainer())
        const res = await send("/uploads-vendor", "logo.svg", "image/svg+xml", SVG, bearer(token))
        expect(res.status).toBe(400)
      })

      it("a genuine PNG passes validation (storage isn't configured in tests)", async () => {
        const res = await send("/store/uploads", "ok.png", "image/png", PNG, { "x-publishable-api-key": pk })
        expect(res.status).not.toBe(400)
      })

      it("rejects an executable type outright", async () => {
        const res = await send("/store/uploads", "x.exe", "application/x-msdownload", HTML, { "x-publishable-api-key": pk })
        expect(res.status).toBe(400)
      })
    })

    describe("static files", () => {
      it.each(["../package.json", "..%2fpackage.json", "%2e%2e/%2e%2e/.env", "....//....//etc/passwd", "../static-evil/x"])(
        "doesn't serve %s",
        async (p) => {
          const res = await api.get(`/static/${p}`, noThrow)
          expect(res.status).toBeGreaterThanOrEqual(400)
          expect(JSON.stringify(res.data)).not.toContain("dependencies")
        }
      )
    })

    describe("flash sale cart abuse", () => {
      async function sale(over: { stock_limit?: number; ends?: string; discount?: number } = {}) {
        const container = getContainer()
        const [product] = await container.resolve(Modules.PRODUCT).createProducts([
          { title: `F${Date.now()}`, options: [{ title: "s", values: ["m"] }], variants: [{ title: "v", options: { s: "m" } }] },
        ])
        const fsId = `fs_${crypto.randomBytes(4).toString("hex")}`
        const itemId = `fsi_${crypto.randomBytes(4).toString("hex")}`
        const pg = pgOf(container)
        await pg.raw(
          `INSERT INTO flash_sale (id, title, status, starts_at, ends_at, created_at, updated_at)
           VALUES (?, 'S', 'active', now() - interval '1 hour', now() + interval '${over.ends ?? "1 day"}', now(), now())`,
          [fsId]
        )
        await pg.raw(
          `INSERT INTO flash_sale_item (id, flash_sale_id, product_id, discount_type, discount_value, stock_limit, sold_count, item_status, created_at, updated_at)
           VALUES (?, ?, ?, 'percentage', ?, ?, 0, 'approved', now(), now())`,
          [itemId, fsId, product.id, over.discount ?? 10, over.stock_limit ?? null]
        )
        const { customer, token } = await createCustomer(container)
        const cart = await container.resolve(Modules.CART).createCarts({ currency_code: "php", customer_id: customer.id, email: "c@example.test" })
        return { itemId, variantId: product.variants[0].id, cartId: cart.id, token }
      }
      const soldOf = async (id: string) =>
        Number((await pgOf(getContainer()).raw(`SELECT sold_count FROM flash_sale_item WHERE id = ?`, [id])).rows[0].sold_count)

      it.each([[-5], [0], [1.5], ["abc"], [1e9]])("rejects quantity %s", async (quantity) => {
        const { itemId, variantId, cartId, token } = await sale()
        const res = await api.post(
          "/store/flash-sale-cart-items",
          { variant_id: variantId, flash_sale_item_id: itemId, cart_id: cartId, quantity },
          store(token)
        )
        expect(res.status).toBe(400)
        expect(await soldOf(itemId)).toBe(0)
      })

      it("won't sell past the sale's stock limit", async () => {
        const { itemId, variantId, cartId, token } = await sale({ stock_limit: 2 })
        const res = await api.post(
          "/store/flash-sale-cart-items",
          { variant_id: variantId, flash_sale_item_id: itemId, cart_id: cartId, quantity: 3 },
          store(token)
        )
        expect(res.status).toBe(400)
        expect(await soldOf(itemId)).toBe(0)
      })

      it("refuses a sale whose end time has passed even if the job hasn't closed it", async () => {
        const { itemId, variantId, cartId, token } = await sale({ ends: "-1 minute" })
        const res = await api.post(
          "/store/flash-sale-cart-items",
          { variant_id: variantId, flash_sale_item_id: itemId, cart_id: cartId },
          store(token)
        )
        expect(res.status).toBe(404)
      })

      it("requires a signed-in customer", async () => {
        const res = await api.post("/store/flash-sale-cart-items", { variant_id: "v", flash_sale_item_id: "f", cart_id: "c" }, store())
        expect(res.status).toBe(401)
      })
    })

    describe("flash sale applications", () => {
      const apply = async (body: Record<string, unknown>) => {
        const container = getContainer()
        const seller = await createSeller(container)
        const [product] = await container.resolve(Modules.PRODUCT).createProducts([{ title: `Own${Date.now()}` }])
        const pg = pgOf(container)
        await pg("seller_seller_product_product").insert({ id: `l_${product.id}`, seller_id: seller.seller.id, product_id: product.id })
        const fs = `fs_${crypto.randomBytes(4).toString("hex")}`
        await pg.raw(
          `INSERT INTO flash_sale (id, title, status, starts_at, ends_at, created_at, updated_at)
           VALUES (?, 'S', 'scheduled', now(), now() + interval '1 day', now(), now())`,
          [fs]
        )
        return api.post(`/vendor/flash-sales/${fs}/items`, { product_id: product.id, ...body }, { headers: bearer(seller.token), ...noThrow })
      }

      it.each([
        ["a discount over 100%", { discount_type: "percentage", discount_value: 150 }],
        ["a negative discount (a price increase)", { discount_type: "percentage", discount_value: -50 }],
        ["a zero discount", { discount_type: "fixed", discount_value: 0 }],
        ["an unknown type", { discount_type: "free", discount_value: 10 }],
        ["a text discount", { discount_type: "fixed", discount_value: "lots" }],
        ["a negative stock limit", { discount_type: "percentage", discount_value: 10, stock_limit: -1 }],
      ])("rejects %s", async (_label, body) => {
        expect((await apply(body)).status).toBe(400)
      })

      it("accepts a sensible application", async () => {
        expect((await apply({ discount_type: "percentage", discount_value: 20, stock_limit: 5 })).status).toBe(201)
      })
    })

    describe("reviews", () => {
      const post = async (body: Record<string, unknown>, token?: string) => {
        const { seller } = await createSeller(getContainer())
        return api.post("/store/reviews", { reference: "seller", reference_id: seller.id, rating: 5, ...body }, store(token))
      }

      it("anonymous visitors can't review", async () => {
        expect((await post({})).status).toBe(401)
      })

      it.each([[0], [6], [-1], [4.5], ["five"], [null]])("rejects rating %s", async (rating) => {
        const { token } = await createCustomer(getContainer())
        const res = await post({ rating }, token)
        expect(res.status).toBe(400)
      })

      it("can't review a seller you never bought from", async () => {
        const { token } = await createCustomer(getContainer())
        const res = await post({}, token)
        expect([400, 403]).toContain(res.status)
      })
    })

    describe("signup and login abuse", () => {
      it("throttles repeated login attempts against one account", async () => {
        const statuses: number[] = []
        for (let i = 0; i < 15; i++) {
          const res = await api.post("/auth/customer/emailpass", { email: "victim@example.test", password: `guess${i}` }, noThrow)
          statuses.push(res.status)
        }
        expect(statuses).toContain(429)
        expect(statuses.slice(0, 5)).not.toContain(429)
      })

      it("throttles seller applications (they send email to any address)", async () => {
        const statuses: number[] = []
        for (let i = 0; i < 10; i++) {
          const res = await api.post(
            "/store/seller-application",
            { first_name: "A", last_name: "B", email: `victim${i}@example.test`, business_name: "S", form_of_organization: "Others" },
            store()
          )
          statuses.push(res.status)
        }
        expect(statuses).toContain(429)
      })

      it("an application can't claim someone else's identity with an unsigned token", async () => {
        const forged = sign({ auth_identity_id: "authid_victim" }, "not-the-real-secret")
        await api.post(
          "/store/seller-application",
          { first_name: "A", last_name: "B", email: "a@example.test", business_name: "S", form_of_organization: "Others" },
          { headers: { "x-publishable-api-key": pk, ...bearer(forged) }, ...noThrow }
        )
        const row = await pgOf(getContainer())("seller_application").orderBy("submitted_at", "desc").first()
        if (row) expect(row.auth_identity_id).toBeNull()
      })

      it("rejects absurdly long application fields", async () => {
        const res = await api.post(
          "/store/seller-application",
          { first_name: "x".repeat(100_000), email: "a@example.test", business_name: "S" },
          { headers: { "x-publishable-api-key": pk, "cf-connecting-ip": "203.0.113.77" }, ...noThrow }
        )
        expect(res.status).toBe(400)
      })
    })

    describe("privilege escalation through a seller's own profile", () => {
      it("a seller can't verify themselves", async () => {
        const { seller, token } = await createSeller(getContainer())
        await api.post("/vendor/sellers/me", { verification_status: "verified", store_status: "ACTIVE" }, { headers: bearer(token), ...noThrow })
        const row = await pgOf(getContainer())("seller").where({ id: seller.id }).first()
        expect(row.verification_status).not.toBe("verified")
      })

      it("admins can still reach their routes", async () => {
        const { token } = await createAdmin(getContainer())
        expect((await api.get("/admin/users/me", { headers: bearer(token) })).status).toBe(200)
      })
    })
  },
})
