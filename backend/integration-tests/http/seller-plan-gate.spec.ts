import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  applyCustomMigrations,
  bearer,
  createCustomer,
  createPublishableKey,
  createSeller,
  givePlan,
  makeReady,
  noThrow,
  seedPlans,
} from "../helpers"

jest.setTimeout(300 * 1000)

const DAY = 24 * 60 * 60 * 1000

/**
 * A seller's plan (paid or the free month) is what lets them sell. The panel
 * hides everything without one; these check the API holds the same line, so a
 * lapsed seller can't keep listing or selling by calling /vendor and /store
 * directly. Orders already placed stay workable, so buyers still get them.
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let pk: string
    const store = () => ({ headers: { "x-publishable-api-key": pk }, ...noThrow })

    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })

    beforeEach(async () => {
      await seedPlans(getContainer())
      pk = await createPublishableKey(getContainer())
    })

    describe("the seller API", () => {
      const asSeller = (token: string) => ({ headers: bearer(token), ...noThrow })

      it("lets a seller with no plan look but not change their shop", async () => {
        const { token } = await createSeller(getContainer())

        expect((await api.get("/vendor/stock-locations", asSeller(token))).status).toBe(200)
        const res = await api.post("/vendor/stock-locations", { name: "Warehouse" }, asSeller(token))

        expect(res.status).toBe(403)
        expect(res.data).toMatchObject({ code: "plan_required" })
        expect(res.data.message).toMatch(/plan/i)
      })

      it("treats a plan past its end date as no plan", async () => {
        const { seller, token } = await createSeller(getContainer())
        await givePlan(getContainer(), seller.id, { end_date: new Date(Date.now() - DAY) })

        const res = await api.post("/vendor/stock-locations", { name: "Warehouse" }, asSeller(token))

        expect(res.status).toBe(403)
      })

      it("lets a seller on a plan make changes", async () => {
        const { seller, token } = await createSeller(getContainer())
        await givePlan(getContainer(), seller.id)

        const res = await api.post("/vendor/stock-locations", { name: "Warehouse" }, asSeller(token))

        expect(res.status).toBe(201)
      })

      it("still lets a seller with no plan start the free month", async () => {
        const { token } = await createSeller(getContainer())

        const res = await api.post("/vendor/subscription/trial", { plan_name: "Growth" }, asSeller(token))

        expect(res.status).toBe(200)
      })

      it("still lets a lapsed seller work orders already placed", async () => {
        const { token } = await createSeller(getContainer())

        const res = await api.post("/vendor/orders/order_missing/capture", {}, asSeller(token))

        expect(res.status).not.toBe(403)
      })
    })

    describe("buying from a shop with no plan", () => {
      async function productOf(sellerId: string) {
        const container = getContainer()
        const [product] = await container.resolve(Modules.PRODUCT).createProducts([
          {
            title: `Item ${Date.now()}`,
            status: "published",
            options: [{ title: "Size", values: ["M"] }],
            variants: [{ title: "M", options: { Size: "M" }, manage_inventory: false }],
          },
        ])
        await container.resolve(ContainerRegistrationKeys.LINK).create({
          seller: { seller_id: sellerId },
          [Modules.PRODUCT]: { product_id: product.id },
        })
        return product
      }

      async function cartWith(product?: any) {
        const container = getContainer()
        const { customer } = await createCustomer(container)
        const [salesChannel] = await container.resolve(Modules.SALES_CHANNEL).createSalesChannels([{ name: `SC ${Date.now()}` }])
        const region = await container.resolve(Modules.REGION).createRegions({ name: `PH ${Date.now()}`, currency_code: "php" })
        return container.resolve(Modules.CART).createCarts({
          currency_code: "php",
          email: "buyer@example.test",
          customer_id: customer.id,
          region_id: region.id,
          sales_channel_id: salesChannel.id,
          items: product
            ? [{ title: "Barong", quantity: 1, unit_price: 1499, product_id: product.id, variant_id: product.variants[0].id, requires_shipping: false }]
            : [],
        })
      }

      it("won't add its product to a cart", async () => {
        const { seller } = await createSeller(getContainer(), { name: "Closed Shop" })
        const product = await productOf(seller.id)
        const cart = await cartWith()

        const res = await api.post(`/store/carts/${cart.id}/line-items`, { variant_id: product.variants[0].id, quantity: 1 }, store())

        expect(res.status).toBe(400)
        expect(res.data.message).toMatch(/Closed Shop isn't taking orders/)
      })

      it("won't check out a cart that already holds its product", async () => {
        const { seller } = await createSeller(getContainer(), { name: "Closed Shop" })
        const cart = await cartWith(await productOf(seller.id))

        const res = await api.post(`/store/carts/${cart.id}/complete`, {}, store())

        expect(res.status).toBe(400)
        expect(res.data.message).toMatch(/Closed Shop isn't taking orders/)
      })

      it("lists the closed shops that have products, so the storefront can hide them", async () => {
        const closed = await createSeller(getContainer(), { handle: `closed-${Date.now()}` })
        const open = await createSeller(getContainer(), { handle: `open-${Date.now()}` })
        const empty = await createSeller(getContainer(), { handle: `empty-${Date.now()}` })
        await givePlan(getContainer(), open.seller.id)
        await makeReady(getContainer(), open.seller.id)
        await productOf(closed.seller.id)
        await productOf(open.seller.id)

        const res = await api.get("/store/closed-shops", store())

        expect(res.status).toBe(200)
        expect(res.data.handles).toContain(closed.seller.handle)
        expect(res.data.handles).not.toContain(open.seller.handle)
        expect(res.data.handles).not.toContain(empty.seller.handle)
      })

      it("lets a shop on a plan through the check", async () => {
        const { seller } = await createSeller(getContainer(), { name: "Open Shop" })
        await givePlan(getContainer(), seller.id)
        await makeReady(getContainer(), seller.id)
        const cart = await cartWith(await productOf(seller.id))

        const res = await api.post(`/store/carts/${cart.id}/complete`, {}, store())

        expect(JSON.stringify(res.data)).not.toMatch(/isn't taking orders/)
      })
    })
  },
})
