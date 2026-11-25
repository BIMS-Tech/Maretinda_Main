import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { applyCustomMigrations, bearer, createPublishableKey, createSeller, givePlan, makeReady, noThrow, pgOf } from "../helpers"

jest.setTimeout(300 * 1000)

/**
 * The guided delivery setup and the stock page: what a seller without any
 * warehouse knowledge needs before buyers can order.
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })

    const pickup = {
      name: "Main store",
      address_1: "1 Rizal St",
      address_2: "Balibago",
      city: "Angeles City",
      province: "Pampanga",
      postal_code: "2009",
      phone: "0917 123 4567",
    }

    /** A shop with its documents approved but no delivery set up yet. */
    async function shop() {
      const c = getContainer()
      const pg = pgOf(c)
      await createPublishableKey(c)
      if (!(await pg("sales_channel").first("id"))) await c.resolve(Modules.SALES_CHANNEL).createSalesChannels({ name: "Store" })
      if (!(await pg("shipping_profile").first("id"))) {
        await c.resolve(Modules.FULFILLMENT).createShippingProfiles([{ name: "Default", type: "default" }])
      }
      const s = await createSeller(c, { handle: `shop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })
      await givePlan(c, s.seller.id)
      return { ...s, as: { headers: bearer(s.token), ...noThrow } }
    }

    async function productOf(sellerId: string, title: string, variants: string[] = ["M"], manage_inventory = true) {
      const c = getContainer()
      const [product] = await c.resolve(Modules.PRODUCT).createProducts([
        {
          title,
          status: "published" as any,
          options: [{ title: "Size", values: variants }],
          variants: variants.map((v) => ({ title: v, sku: `${title}-${v}-${Date.now()}`, options: { Size: v }, manage_inventory })),
        },
      ])
      const link = c.resolve(ContainerRegistrationKeys.LINK)
      await link.create({ seller: { seller_id: sellerId }, [Modules.PRODUCT]: { product_id: product.id } })
      if (manage_inventory) {
        for (const v of product.variants) {
          const [item] = await c.resolve(Modules.INVENTORY).createInventoryItems([{ sku: v.sku! }])
          await link.create({ [Modules.PRODUCT]: { variant_id: v.id }, [Modules.INVENTORY]: { inventory_item_id: item.id } })
        }
      }
      return product
    }

    describe("delivery setup", () => {
      it("does every step at once, and says what was missing before", async () => {
        const s = await shop()
        const before = await api.get("/vendor/delivery-setup", s.as)
        expect(before.data).toMatchObject({ ready: false, location: null, missing: ["pickup location", "delivery fee"] })

        const saved = await api.post("/vendor/delivery-setup", { pickup, fees: { standard: 120, express: 250 } }, s.as)
        expect(saved.status).toBe(200)
        expect(saved.data).toMatchObject({ ready: true, missing: [], location: { name: "Main store", city: "Angeles City", province: "Pampanga" } })
        expect(saved.data.options.map((o: any) => [o.name, o.fee]).sort()).toEqual([["Express Delivery", 250], ["Standard Delivery", 120]])

        // Buyers also need a way to send things back, and free delivery from ₱499
        const pg = pgOf(getContainer())
        const options = await pg("seller_seller_fulfillment_shipping_option as l")
          .join("shipping_option as so", "so.id", "l.shipping_option_id")
          .where("l.seller_id", s.seller.id)
          .whereNull("l.deleted_at")
          .whereNull("so.deleted_at")
          .pluck("so.name")
        expect(options.filter((n: string) => n.startsWith("Return to")).length).toBe(1)
        const free = await pg("shipping_option_price_set as l")
          .join("price as p", "p.price_set_id", "l.price_set_id")
          .join("price_rule as r", "r.price_id", "p.id")
          .whereIn("l.shipping_option_id", saved.data.options.map((o: any) => o.id))
          .whereNull("p.deleted_at")
          .where("p.amount", 0)
          .select("r.attribute", "r.value")
        expect(free.length).toBe(2)
        expect(free[0]).toMatchObject({ attribute: "item_total", value: "499" })
      })

      it("running it again changes the address and fees instead of adding more, and can switch an option off and on", async () => {
        const s = await shop()
        await api.post("/vendor/delivery-setup", { pickup, fees: { standard: 120, express: 250 } }, s.as)
        const changed = await api.post(
          "/vendor/delivery-setup",
          { pickup: { ...pickup, name: "Warehouse", city: "Mabalacat City" }, fees: { standard: 90, express: null } },
          s.as
        )
        expect(changed.data.location).toMatchObject({ name: "Warehouse", city: "Mabalacat City" })
        expect(changed.data.options.map((o: any) => [o.name, o.fee])).toEqual([["Standard Delivery", 90]])

        const again = await api.post("/vendor/delivery-setup", { pickup, fees: { standard: 90, express: 300 } }, s.as)
        expect(again.data.options.map((o: any) => [o.name, o.fee]).sort()).toEqual([["Express Delivery", 300], ["Standard Delivery", 90]])

        const pg = pgOf(getContainer())
        const locations = await pg("seller_seller_stock_location_stock_location").where("seller_id", s.seller.id).whereNull("deleted_at")
        expect(locations.length).toBe(1)
        const zones = await pg("service_zone as z")
          .join("location_fulfillment_set as l", "l.fulfillment_set_id", "z.fulfillment_set_id")
          .where("l.stock_location_id", locations[0].stock_location_id)
          .whereNull("z.deleted_at")
        expect(zones.length).toBe(1)
      })

      it("explains what is wrong with the form", async () => {
        const s = await shop()
        const post = (body: any) => api.post("/vendor/delivery-setup", body, s.as)
        expect((await post({ pickup: { ...pickup, postal_code: "20" }, fees: { standard: 120 } })).data.message).toMatch(/4-digit ZIP/)
        expect((await post({ pickup: { ...pickup, phone: "123" }, fees: { standard: 120 } })).data.message).toMatch(/phone number/)
        expect((await post({ pickup, fees: {} })).data.message).toMatch(/standard delivery fee/i)
        expect((await post({ pickup, fees: { standard: -1 } })).data.message).toMatch(/between ₱0/)
        expect((await api.post("/vendor/delivery-setup", {}, noThrow)).status).toBe(401)
      })

      it("a verified shop's products wait for delivery, then go live by themselves", async () => {
        const c = getContainer()
        const s = await shop()
        await makeReady(c, s.seller.id)
        // Verified and set up, but undo the delivery makeReady added
        await pgOf(c)("seller_seller_stock_location_stock_location").where("seller_id", s.seller.id).delete()

        const made = await api.post(
          "/vendor/products",
          {
            title: "Bayong",
            status: "proposed",
            options: [{ title: "Size", values: ["M"] }],
            variants: [{ title: "M", options: { Size: "M" }, manage_inventory: true, prices: [{ currency_code: "php", amount: 350 }] }],
          },
          s.as
        )
        const row = () => pgOf(c)("product").where("id", made.data.product.id).first("status", "metadata")
        expect(await row()).toMatchObject({ status: "draft", metadata: { publish_when_ready: true } })

        const saved = await api.post("/vendor/delivery-setup", { pickup, fees: { standard: 0 } }, s.as)
        expect(saved.data).toMatchObject({ ready: true, published: 1 })
        expect((await row()).status).toBe("published")
      })
    })

    describe("stock", () => {
      it("needs a pickup location, then saves what is on hand and shows what buyers can order", async () => {
        const s = await shop()
        const product = await productOf(s.seller.id, "Tote", ["S", "M"])
        const [small, medium] = product.variants
        const refused = await api.post("/vendor/stock", { updates: [{ variant_id: small.id, quantity: 4 }] }, s.as)
        expect(refused.status).toBe(400)
        expect(refused.data.message).toMatch(/pickup location/)

        await api.post("/vendor/delivery-setup", { pickup, fees: { standard: 120 } }, s.as)
        const before = await api.get("/vendor/stock", s.as)
        expect(before.data.counts).toMatchObject({ all: 2, unset: 2, low: 0, out: 2 })

        const saved = await api.post(
          "/vendor/stock",
          { updates: [{ variant_id: small.id, quantity: 4 }, { variant_id: medium.id, quantity: 30 }] },
          s.as
        )
        expect(saved.data).toEqual({ saved: 2 })
        const after = await api.get("/vendor/stock", s.as)
        expect(after.data.counts).toMatchObject({ all: 2, unset: 0, low: 1, out: 0 })
        expect(after.data.stock.map((r: any) => [r.variant_title, r.on_hand, r.available]).sort()).toEqual([["M", 30, 30], ["S", 4, 4]])

        await api.post("/vendor/stock", { updates: [{ variant_id: small.id, quantity: 0 }] }, s.as)
        const low = await api.get("/vendor/stock?filter=out", s.as)
        expect(low.data.stock.map((r: any) => r.variant_title)).toEqual(["S"])
      })

      it("can't go below what is sold and waiting to ship, and saves nothing when one row is wrong", async () => {
        const s = await shop()
        const product = await productOf(s.seller.id, "Cap", ["S", "M"])
        const [small, medium] = product.variants
        await api.post("/vendor/delivery-setup", { pickup, fees: { standard: 120 } }, s.as)
        await api.post("/vendor/stock", { updates: [{ variant_id: small.id, quantity: 10 }, { variant_id: medium.id, quantity: 10 }] }, s.as)
        const pg = pgOf(getContainer())
        const item = await pg("product_variant_inventory_item").where("variant_id", small.id).first("inventory_item_id")
        await pg("inventory_level").where("inventory_item_id", item.inventory_item_id).update({ reserved_quantity: 3 })

        const bad = await api.post(
          "/vendor/stock",
          { updates: [{ variant_id: medium.id, quantity: 99 }, { variant_id: small.id, quantity: 2 }] },
          s.as
        )
        expect(bad.status).toBe(400)
        expect(bad.data.message).toMatch(/Cap \(S\): 3 are already sold and waiting to ship/)
        const rows = (await api.get("/vendor/stock", s.as)).data.stock
        expect(rows.map((r: any) => [r.variant_title, r.on_hand, r.reserved, r.available]).sort()).toEqual([["M", 10, 0, 10], ["S", 10, 3, 7]])
      })

      it("only touches the shop's own items, and refuses quantities that make no sense", async () => {
        const mine = await shop()
        const other = await shop()
        await api.post("/vendor/delivery-setup", { pickup, fees: { standard: 120 } }, mine.as)
        const theirs = await productOf(other.seller.id, "Not yours")
        const unlimited = await productOf(mine.seller.id, "Made to order", ["M"], false)
        const post = (updates: any) => api.post("/vendor/stock", { updates }, mine.as)

        expect((await post([{ variant_id: theirs.variants[0].id, quantity: 1 }])).data.message).toMatch(/isn't in your shop/)
        expect((await post([{ variant_id: unlimited.variants[0].id, quantity: 1 }])).data.message).toMatch(/doesn't track stock/)
        for (const quantity of [-1, 1.5, "", "abc", null]) {
          expect((await post([{ variant_id: unlimited.variants[0].id, quantity }])).data.message).toMatch(/whole number/)
        }
        expect((await post([])).data.message).toMatch(/at least one/)
        const list = (await api.get("/vendor/stock", mine.as)).data
        expect(list.stock.map((r: any) => r.product_title)).toEqual(["Made to order"])
      })
    })
  },
})
