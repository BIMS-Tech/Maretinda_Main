import crypto from "crypto"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import FlashSaleService from "../../src/services/flash-sale"
import { applyCustomMigrations, bearer, createCustomer, createPublishableKey, noThrow, pgOf } from "../helpers"

jest.setTimeout(300 * 1000)

/**
 * A flash sale's stock counts units bought, not units sitting in carts. On
 * production, ten add-to-carts that never became orders sold out a sale and
 * every later shopper got an error.
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let pk: string
    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
      await new FlashSaleService(getContainer() as any).initTables()
    })
    beforeEach(async () => {
      pk = await createPublishableKey(getContainer())
    })

    async function sale(stock_limit: number | null, sold_count = 0) {
      const container = getContainer()
      const [product] = await container.resolve(Modules.PRODUCT).createProducts([
        { title: `F${Date.now()}`, options: [{ title: "s", values: ["m"] }], variants: [{ title: "v", options: { s: "m" } }] },
      ])
      const fsId = `fs_${crypto.randomBytes(4).toString("hex")}`
      const itemId = `fsi_${crypto.randomBytes(4).toString("hex")}`
      const pg = pgOf(container)
      await pg.raw(
        `INSERT INTO flash_sale (id, title, status, starts_at, ends_at, created_at, updated_at)
         VALUES (?, 'S', 'active', now() - interval '1 hour', now() + interval '1 day', now(), now())`,
        [fsId]
      )
      await pg.raw(
        `INSERT INTO flash_sale_item (id, flash_sale_id, product_id, discount_type, discount_value, stock_limit, sold_count, item_status, created_at, updated_at)
         VALUES (?, ?, ?, 'fixed', 100, ?, ?, 'approved', now(), now())`,
        [itemId, fsId, product.id, stock_limit, sold_count]
      )
      return { itemId, product }
    }
    const soldOf = async (id: string) =>
      Number((await pgOf(getContainer()).raw(`SELECT sold_count FROM flash_sale_item WHERE id = ?`, [id])).rows[0].sold_count)

    async function order(itemId: string, quantity: number, status = "pending") {
      const [o] = await getContainer().resolve(Modules.ORDER).createOrders([
        {
          currency_code: "php",
          email: "b@example.test",
          status: status as any,
          items: [{ title: "Denim", quantity, unit_price: 457, metadata: { flash_sale_item_id: itemId } }],
        },
      ])
      return o
    }

    it("units left in carts that were never checked out don't count as sold", async () => {
      const { itemId } = await sale(10, 10)
      await new FlashSaleService(getContainer() as any).recountSold()
      expect(await soldOf(itemId)).toBe(0)
    })

    it("counts units in placed orders but not in cancelled ones", async () => {
      const { itemId } = await sale(10)
      await order(itemId, 2)
      await order(itemId, 3, "canceled")
      await new FlashSaleService(getContainer() as any).recountSold([itemId])
      expect(await soldOf(itemId)).toBe(2)
    })

    it("tells whether units are left without taking them", async () => {
      const { itemId } = await sale(3, 1)
      const service = new FlashSaleService(getContainer() as any)
      expect(await service.hasStock(itemId, 2)).toBe(true)
      expect(await service.hasStock(itemId, 3)).toBe(false)
      expect(await soldOf(itemId)).toBe(1)
    })

    describe("checkout", () => {
      async function cartWith(itemId: string, productId: string, variantId: string, quantity: number) {
        const container = getContainer()
        const { customer, token } = await createCustomer(container)
        const cartModule = container.resolve(Modules.CART)
        const cart = await cartModule.createCarts({ currency_code: "php", customer_id: customer.id, email: "c@example.test" })
        await cartModule.addLineItems(cart.id, [
          { title: "Denim", quantity, unit_price: 457, product_id: productId, variant_id: variantId, metadata: { flash_sale_item_id: itemId } },
        ])
        return { cartId: cart.id, as: { headers: { "x-publishable-api-key": pk, ...bearer(token) }, ...noThrow } }
      }

      it("refuses flash-sale units the sale no longer has, and says so", async () => {
        const { itemId, product } = await sale(2, 2)
        const { cartId, as } = await cartWith(itemId, product.id, product.variants[0].id, 1)
        const res = await api.post(`/store/carts/${cartId}/complete`, {}, as)
        expect(res.status).toBe(400)
        expect(res.data).toMatchObject({ code: "flash_sale_sold_out" })
        expect(res.data.message).toMatch(/sold out/i)
      })

      it("claims the units when a buyer checks out", async () => {
        const { itemId, product } = await sale(5, 0)
        const { cartId, as } = await cartWith(itemId, product.id, product.variants[0].id, 2)
        const res = await api.post(`/store/carts/${cartId}/complete`, {}, as)
        // The cart has no payment, so completion itself fails after the guard
        expect(res.data?.code).not.toBe("flash_sale_sold_out")
        expect(await soldOf(itemId)).toBe(2)
      })
    })
  },
})
