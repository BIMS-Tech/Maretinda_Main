import { readdirSync, statSync } from "fs"
import path from "path"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
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
  givePlan,
  makeReady,
  noThrow,
  pgOf,
  tokenFor,
} from "../helpers"

jest.setTimeout(300 * 1000)

/** Every custom route file under a prefix, with [params] filled by a dummy id. */
function routesUnder(prefix: "admin" | "vendor"): { url: string; methods: string[] }[] {
  const root = path.join(__dirname, "..", "..", "src", "api", prefix)
  const out: { url: string; methods: string[] }[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name)
      if (statSync(full).isDirectory()) walk(full)
      else if (name === "route.ts") {
        const mod = require(full)
        const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"].filter((m) => typeof mod[m] === "function")
        const rel = path.relative(root, dir).replace(/\[\.\.\.[^\]]+\]/g, "x").replace(/\[[^\]]+\]/g, "x")
        out.push({ url: `/${prefix}${rel ? `/${rel}` : ""}`, methods })
      }
    }
  }
  walk(root)
  return out
}

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
      await new FlashSaleService(getContainer()).initTables()
      await new GiyaPayService(getContainer()).getConfig()
    })

    const call = (method: string, url: string, headers: Record<string, string> = {}) =>
      api.request({ method, url, headers, data: method === "GET" ? undefined : {}, ...noThrow })

    describe("every custom admin route is admin-only", () => {
      it("rejects anonymous, customer and seller callers", async () => {
        const customer = await createCustomer(getContainer())
        const seller = await createSeller(getContainer())
        const leaks: string[] = []

        for (const { url, methods } of routesUnder("admin")) {
          for (const method of methods) {
            for (const [who, headers] of [
              ["anonymous", {}],
              ["customer", bearer(customer.token)],
              ["seller", bearer(seller.token)],
            ] as const) {
              const res = await call(method, url, headers as any)
              if (res.status !== 401 && res.status !== 403) leaks.push(`${who} ${method} ${url} → ${res.status}`)
            }
          }
        }

        expect(leaks).toEqual([])
      })
    })

    describe("every custom vendor route is seller-only", () => {
      it("rejects anonymous and customer callers", async () => {
        const customer = await createCustomer(getContainer())
        const leaks: string[] = []

        for (const { url, methods } of routesUnder("vendor")) {
          for (const method of methods) {
            for (const [who, headers] of [
              ["anonymous", {}],
              ["customer", bearer(customer.token)],
            ] as const) {
              const res = await call(method, url, headers as any)
              if (res.status !== 401 && res.status !== 403) leaks.push(`${who} ${method} ${url} → ${res.status}`)
            }
          }
        }

        expect(leaks).toEqual([])
      })
    })

    describe("forged and tampered tokens", () => {
      const secret = () => process.env.JWT_SECRET!
      const claims = (id: string) => ({ actor_id: id, actor_type: "user", auth_identity_id: "x", app_metadata: {} })

      const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url")

      it.each([
        ["signed with the default 'supersecret'", (id: string) => sign(claims(id), "supersecret")],
        ["signed with an empty-ish key", (id: string) => sign(claims(id), "x")],
        ["alg:none", (id: string) => `${b64({ alg: "none", typ: "JWT" })}.${b64(claims(id))}.`],
        ["expired", (id: string) => sign(claims(id), secret(), { expiresIn: -60 })],
      ])("rejects an admin token %s", async (_label, forge) => {
        const { user } = await createAdmin(getContainer())
        const res = await api.get("/admin/users/me", { headers: bearer(forge(user.id)), ...noThrow })
        expect(res.status).toBe(401)
      })

      it("rejects a real token whose payload was edited", async () => {
        const { user, token } = await createAdmin(getContainer())
        const [h, , s] = token.split(".")
        const res = await api.get("/admin/users/me", {
          headers: bearer(`${h}.${b64({ ...claims(user.id), actor_id: "someone_else" })}.${s}`),
          ...noThrow,
        })
        expect(res.status).toBe(401)
      })

      it("a seller token relabelled as admin doesn't work", async () => {
        const { member } = await createSeller(getContainer())
        const res = await api.get("/admin/users/me", { headers: bearer(tokenFor("seller", member.id)), ...noThrow })
        expect(res.status).toBe(401)
      })
    })

    describe("a seller can't touch another seller's things", () => {
      let a: Awaited<ReturnType<typeof createSeller>>
      let b: Awaited<ReturnType<typeof createSeller>>
      const asB = () => ({ headers: bearer(b.token), ...noThrow })

      beforeEach(async () => {
        a = await createSeller(getContainer())
        b = await createSeller(getContainer())
        // On plans, so B's attempts reach the ownership checks under test
        await givePlan(getContainer(), a.seller.id)
        await givePlan(getContainer(), b.seller.id)
        await makeReady(getContainer(), a.seller.id)
        await makeReady(getContainer(), b.seller.id)
      })

      async function productOfA() {
        const container = getContainer()
        const [product] = await container.resolve(Modules.PRODUCT).createProducts([{ title: `P${Date.now()}`, status: "published" }])
        await pgOf(container)("seller_seller_product_product").insert({
          id: `link_${product.id}`,
          seller_id: a.seller.id,
          product_id: product.id,
        })
        return product
      }

      async function codOrderOfA() {
        const container = getContainer()
        const order = await container.resolve(Modules.ORDER).createOrders({
          currency_code: "php",
          email: "buyer@example.test",
          items: [{ title: "Barong", quantity: 1, unit_price: 1499 }],
        })
        const paymentModule = container.resolve(Modules.PAYMENT)
        const collection = await paymentModule.createPaymentCollections({ currency_code: "php", amount: 1499 })
        const session = await paymentModule.createPaymentSession(collection.id, {
          provider_id: "pp_system_default",
          amount: 1499,
          currency_code: "php",
          data: {},
        })
        await paymentModule.authorizePaymentSession(session.id, {})
        const link = container.resolve(ContainerRegistrationKeys.LINK)
        await link.create({ [Modules.ORDER]: { order_id: order.id }, [Modules.PAYMENT]: { payment_collection_id: collection.id } })
        await link.create({ seller: { seller_id: a.seller.id }, [Modules.ORDER]: { order_id: order.id } })
        return { order, collection }
      }

      it("mark another seller's COD order as paid", async () => {
        const { order } = await codOrderOfA()
        const res = await api.post(`/vendor/orders/${order.id}/capture`, {}, asB())
        expect([403, 404]).toContain(res.status)
      })

      it("book a courier against another seller's order", async () => {
        const { order } = await codOrderOfA()
        const res = await api.post(
          "/vendor/shipping-orders",
          { action: "create-order", providerId: "ninjavan", orderData: { medusa_order_id: order.id } },
          asB()
        )
        expect([403, 404]).toContain(res.status)
      })

      it("read, edit or delete another seller's reel", async () => {
        const created = await api.post(
          "/vendor/reels",
          { title: "A's reel", video_url: "https://cdn.example/a.mp4" },
          { headers: bearer(a.token) }
        )
        const id = (created.data.reel ?? created.data).id

        expect((await api.get(`/vendor/reels/${id}`, asB())).status).toBe(404)
        expect((await api.post(`/vendor/reels/${id}`, { title: "hacked" }, asB())).status).toBe(404)
        expect((await api.delete(`/vendor/reels/${id}`, asB())).status).toBe(404)
      })

      it("assign a brand to another seller's product", async () => {
        const product = await productOfA()
        const res = await api.post(`/vendor/products/${product.id}/brand`, { brand_id: "brand_x" }, asB())
        expect(res.status).toBe(403)
      })

      it("list another seller's product in a flash sale", async () => {
        const product = await productOfA()
        const pg = pgOf(getContainer())
        await pg.raw(
          `INSERT INTO flash_sale (id, title, status, starts_at, ends_at, created_at, updated_at)
           VALUES ('fs_1', 'Sale', 'scheduled', now(), now() + interval '1 day', now(), now())`
        )

        const res = await api.post(
          "/vendor/flash-sales/fs_1/items",
          { product_id: product.id, discount_type: "percentage", discount_value: 50 },
          asB()
        )

        expect(res.status).toBe(403)
        const rows = (await pg.raw(`SELECT id FROM flash_sale_item`)).rows
        expect(rows).toHaveLength(0)
      })

      it("read another seller's GiyaPay transactions", async () => {
        await pgOf(getContainer())("giyapay_transaction").insert({
          id: "txn_a",
          reference_number: "REF-A",
          amount: 100,
          status: "SUCCESS",
          seller_id: a.seller.id,
        })

        const res = await api.get("/vendor/giyapay/transactions", asB())

        expect(JSON.stringify(res.data)).not.toContain("REF-A")
      })

      // The review routes took any review id: any seller could read a buyer's
      // name and email off another shop's review, or rewrite that shop's reply
      it("read or reply to a review of another seller's product", async () => {
        const product = await productOfA()
        const pg = pgOf(getContainer())
        await pg("review").insert({
          id: "rev_a",
          reference: "product",
          rating: 5,
          customer_note: "Great barong",
          seller_note: "Salamat po!",
          created_at: new Date(),
          updated_at: new Date(),
        })
        await pg("product_product_review_review").insert({
          id: "link_rev_a",
          product_id: product.id,
          review_id: "rev_a",
          created_at: new Date(),
          updated_at: new Date(),
        })

        expect((await api.get(`/vendor/sellers/me/review/rev_a`, asB())).status).toBe(404)
        expect((await api.post(`/vendor/sellers/me/review/rev_a`, { seller_note: "fake reply" }, asB())).status).toBe(404)
        expect((await pg("review").where("id", "rev_a").first()).seller_note).toBe("Salamat po!")

        // The owner still can
        expect((await api.get(`/vendor/sellers/me/review/rev_a`, { headers: bearer(a.token), ...noThrow })).status).toBe(200)
      })

      it("read, change or delete another seller's 3D model", async () => {
        const product = await productOfA()
        const pg = pgOf(getContainer())
        await pg("product_3d_model").insert({
          id: "p3d_a",
          product_id: product.id,
          seller_id: a.seller.id,
          status: "succeeded",
          source_image_url: "https://cdn.example/a.png",
          provider_task_id: "task_a",
          is_primary: false,
        })

        const listed = await api.get(`/vendor/3d-models/products/${product.id}`, asB())
        expect(JSON.stringify(listed.data)).not.toContain("p3d_a")
        expect([403, 404]).toContain((await api.get(`/vendor/3d-models/tasks/p3d_a`, asB())).status)
        expect([403, 404]).toContain((await api.post(`/vendor/3d-models/p3d_a/set-primary`, {}, asB())).status)
        expect([403, 404]).toContain((await api.patch(`/vendor/3d-models/p3d_a`, { is_primary: true }, asB())).status)
        expect([403, 404]).toContain((await api.delete(`/vendor/3d-models/p3d_a`, asB())).status)
        const row = await pg("product_3d_model").where("id", "p3d_a").first()
        expect(row).toMatchObject({ is_primary: false })
      })

      it("read or post into another seller's buyer chat", async () => {
        const { customer } = await createCustomer(getContainer())
        const chat = new (require("../../src/services/chat").default)(getContainer())
        const conversation = await chat.getOrCreateConversation(a.seller.id, customer.id, "Barong")

        expect([403, 404]).toContain((await api.get(`/vendor/chat/${conversation.id}`, asB())).status)
        expect([403, 404]).toContain((await api.post(`/vendor/chat/${conversation.id}/message`, { body: "hi" }, asB())).status)
        const listed = await api.get(`/vendor/chat`, asB())
        expect(JSON.stringify(listed.data)).not.toContain(conversation.id)
      })

      it("change or withdraw another seller's flash sale entry", async () => {
        const product = await productOfA()
        const pg = pgOf(getContainer())
        await pg.raw(
          `INSERT INTO flash_sale (id, title, status, starts_at, ends_at, created_at, updated_at)
           VALUES ('fs_2', 'Sale', 'scheduled', now(), now() + interval '1 day', now(), now())`
        )
        const entered = await api.post(
          "/vendor/flash-sales/fs_2/items",
          { product_id: product.id, discount_type: "percentage", discount_value: 20 },
          { headers: bearer(a.token), ...noThrow }
        )
        const itemId = entered.data.item?.id
        expect(itemId).toBeTruthy()

        expect([403, 404]).toContain((await api.put(`/vendor/flash-sales/fs_2/items/${itemId}`, { discount_value: 90 }, asB())).status)
        expect([403, 404]).toContain((await api.delete(`/vendor/flash-sales/fs_2/items/${itemId}`, asB())).status)
        const row = (await pg.raw(`SELECT discount_value FROM flash_sale_item WHERE id = ?`, [itemId])).rows[0]
        expect(Number(row.discount_value)).toBe(20)
      })

      it("use another seller's promotion", async () => {
        await productOfA()
        const created = await api.post(
          "/vendor/promotions",
          {
            code: `A${Date.now()}`,
            type: "standard",
            status: "draft",
            application_method: { type: "percentage", target_type: "items", allocation: "across", value: 10, target_rules: [] },
          },
          { headers: bearer(a.token), ...noThrow }
        )
        const id = created.data.promotion?.id
        expect(id).toBeTruthy()

        expect([403, 404]).toContain((await api.get(`/vendor/promotions/${id}`, asB())).status)
        expect([403, 404]).toContain((await api.post(`/vendor/promotions/${id}`, { status: "active" }, asB())).status)
        expect([403, 404]).toContain((await api.delete(`/vendor/promotions/${id}`, asB())).status)
      })
    })

    describe("a malicious seller promotion", () => {
      let seller: Awaited<ReturnType<typeof createSeller>>
      beforeEach(async () => {
        seller = await createSeller(getContainer())
        await givePlan(getContainer(), seller.seller.id)
        await makeReady(getContainer(), seller.seller.id)
        const container = getContainer()
        const [product] = await container.resolve(Modules.PRODUCT).createProducts([{ title: `Mine${Date.now()}` }])
        await pgOf(container)("seller_seller_product_product").insert({
          id: `link_${product.id}`,
          seller_id: seller.seller.id,
          product_id: product.id,
        })
      })

      const create = (body: Record<string, any>) =>
        api.post(
          "/vendor/promotions",
          {
            code: `EVIL${Date.now()}`,
            type: "standard",
            status: "active",
            application_method: { type: "percentage", target_type: "items", value: 100, allocation: "across", target_rules: [] },
            ...body,
          },
          { headers: bearer(seller.token), ...noThrow }
        )

      const stored = async (id: string) =>
        getContainer()
          .resolve(Modules.PROMOTION)
          .retrievePromotion(id, { relations: ["application_method", "application_method.target_rules", "application_method.target_rules.values"] })

      it("can't be automatic (applied to every shopper's cart)", async () => {
        const res = await create({ is_automatic: true })
        if (res.status === 201) expect((await stored(res.data.promotion.id)).is_automatic).toBe(false)
        else expect(res.status).toBe(400)
      })

      it("can't discount other sellers' products", async () => {
        const res = await create({})
        expect(res.status).toBe(201)
        const promo: any = await stored(res.data.promotion.id)

        expect(promo.application_method.target_type).toBe("items")
        const rule = promo.application_method.target_rules.find((r: any) => r.attribute === "items.product.id")
        expect(rule).toBeTruthy()
        expect(rule.values.length).toBeGreaterThan(0)
      })

      it("can't name another seller's product as its target", async () => {
        const res = await create({
          application_method: {
            type: "percentage",
            target_type: "items",
            value: 100,
            allocation: "across",
            target_rules: [{ attribute: "items.product.id", operator: "in", values: ["prod_someone_else"] }],
          },
        })
        expect(res.status).toBe(400)
      })

      it("can't remove the rule that keeps it on the seller's own products", async () => {
        const res = await create({})
        const id = res.data.promotion.id
        const promo: any = await stored(id)
        const rule = promo.application_method.target_rules.find((r: any) => r.attribute === "items.product.id")

        const removal = await api.post(
          `/vendor/promotions/${id}/target-rules/batch`,
          { create: [], delete: [rule.id] },
          { headers: bearer(seller.token), ...noThrow }
        )

        expect(removal.status).toBe(400)
        const after: any = await stored(id)
        expect(after.application_method.target_rules.map((r: any) => r.id)).toContain(rule.id)
      })

      it("can't be switched to automatic afterwards", async () => {
        const res = await create({})
        await api.post(`/vendor/promotions/${res.data.promotion.id}`, { is_automatic: true }, { headers: bearer(seller.token), ...noThrow })
        expect((await stored(res.data.promotion.id)).is_automatic).toBe(false)
      })

      it("a seller with no products can't create one", async () => {
        const empty = await createSeller(getContainer())
        await givePlan(getContainer(), empty.seller.id)
        await makeReady(getContainer(), empty.seller.id)
        const res = await api.post(
          "/vendor/promotions",
          {
            code: `EMPTY${Date.now()}`,
            type: "standard",
            status: "active",
            application_method: { type: "percentage", target_type: "items", value: 100, allocation: "across", target_rules: [] },
          },
          { headers: bearer(empty.token), ...noThrow }
        )
        expect(res.status).toBe(400)
      })
    })

    describe("a customer can't touch another customer's things", () => {
      let pk: string
      const store = (token?: string) => ({
        headers: { "x-publishable-api-key": pk, ...(token ? bearer(token) : {}) },
        ...noThrow,
      })
      beforeEach(async () => {
        pk = await createPublishableKey(getContainer())
      })

      it("read or post into another customer's chat", async () => {
        const owner = await createCustomer(getContainer())
        const other = await createCustomer(getContainer())
        const { seller } = await createSeller(getContainer())
        const created = await api.post("/store/chat", { seller_id: seller.id, message: "hi", subject: "hi" }, store(owner.token))
        const id = (created.data.conversation ?? created.data).id
        expect(id).toBeTruthy()

        expect((await api.get(`/store/chat/${id}`, store(other.token))).status).toBe(404)
        expect([403, 404]).toContain((await api.post(`/store/chat/${id}/message`, { content: "x", body: "x" }, store(other.token))).status)
      })

      it("add flash sale items to another customer's cart", async () => {
        const owner = await createCustomer(getContainer())
        const other = await createCustomer(getContainer())
        const container = getContainer()
        const cart = await container.resolve(Modules.CART).createCarts({ currency_code: "php", customer_id: owner.customer.id, email: "o@example.test" })
        const [product] = await container.resolve(Modules.PRODUCT).createProducts([
          { title: `Sale${Date.now()}`, options: [{ title: "s", values: ["m"] }], variants: [{ title: "v", options: { s: "m" } }] },
        ])
        const pg = pgOf(container)
        await pg.raw(`INSERT INTO flash_sale (id, title, status, starts_at, ends_at, created_at, updated_at)
                      VALUES ('fs_c', 'S', 'active', now(), now() + interval '1 day', now(), now())`)
        await pg.raw(`INSERT INTO flash_sale_item (id, flash_sale_id, product_id, discount_type, discount_value, sold_count, item_status, created_at, updated_at)
                      VALUES ('fsi_c', 'fs_c', ?, 'percentage', 10, 0, 'approved', now(), now())`, [product.id])

        const res = await api.post(
          "/store/flash-sale-cart-items",
          { variant_id: product.variants[0].id, flash_sale_item_id: "fsi_c", cart_id: cart.id },
          store(other.token)
        )

        expect([403, 404]).toContain(res.status)
      })

      it("post a review using another customer's order", async () => {
        const owner = await createCustomer(getContainer())
        const attacker = await createCustomer(getContainer())
        const { seller } = await createSeller(getContainer())
        const order = await getContainer()
          .resolve(Modules.ORDER)
          .createOrders({
            customer_id: owner.customer.id,
            currency_code: "php",
            email: "o@example.test",
            items: [{ title: "X", quantity: 1, unit_price: 1 }],
          })

        const res = await api.post(
          "/store/reviews",
          { reference: "seller", reference_id: seller.id, rating: 5, customer_note: "fake", order_id: order.id },
          store(attacker.token)
        )

        expect([400, 403, 404]).toContain(res.status)
      })
    })
  },
})
