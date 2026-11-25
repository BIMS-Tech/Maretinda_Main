import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { applyCustomMigrations, createSeller, givePlan, seedPlans } from "../helpers"
import { alertLowStock, alertLowStockForVariants, stockOfVariants } from "../../src/lib/low-stock"

jest.setTimeout(300 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ getContainer }) => {
    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })

    /** A shop's variant with real stock at one warehouse, as the seller panel sets it up. */
    async function stockedVariant(stocked: number, reserved = 0, manage_inventory = true, plan = "Growth") {
      const c = getContainer()
      const stamp = `${Date.now()}${Math.random().toString(36).slice(2, 6)}`
      const { seller } = await createSeller(c, { email: `shop-${stamp}@example.test` })
      await seedPlans(c)
      await givePlan(c, seller.id, { plan_name: plan })
      const [product] = await c.resolve(Modules.PRODUCT).createProducts([
        {
          title: `Tee ${stamp}`,
          options: [{ title: "Size", values: ["M"] }],
          variants: [{ title: "M", sku: `TEE-${stamp}`, options: { Size: "M" }, manage_inventory }],
        },
      ])
      const variant = product.variants[0]
      const inventory = c.resolve(Modules.INVENTORY)
      const [item] = await inventory.createInventoryItems([{ sku: `TEE-${stamp}` }])
      const location = await c.resolve(Modules.STOCK_LOCATION).createStockLocations({ name: `WH ${stamp}` })
      await inventory.createInventoryLevels([{ inventory_item_id: item.id, location_id: location.id, stocked_quantity: stocked }])
      const link = c.resolve(ContainerRegistrationKeys.LINK)
      await link.create({ [Modules.PRODUCT]: { variant_id: variant.id }, [Modules.INVENTORY]: { inventory_item_id: item.id } })
      await link.create({ seller: { seller_id: seller.id }, [Modules.PRODUCT]: { product_id: product.id } })
      // Reservations come from placed orders; set them directly rather than placing orders
      const set = (stocked_quantity: number, reserved_quantity: number) =>
        c.resolve(ContainerRegistrationKeys.PG_CONNECTION)("inventory_level")
          .where({ inventory_item_id: item.id, location_id: location.id })
          .update({ stocked_quantity, reserved_quantity })
      await set(stocked, reserved)
      return { variant, product, seller, set }
    }

    const levels = async (variantId: string) =>
      (await alertLowStockForVariants(getContainer(), [variantId])).map((d) => [d.level, d.available])

    it("counts what buyers can still order: stocked minus reserved", async () => {
      const { variant, seller } = await stockedVariant(10, 4)
      const [stock] = await stockOfVariants(getContainer().resolve(ContainerRegistrationKeys.PG_CONNECTION), [variant.id])
      expect(stock).toMatchObject({ available: 6, seller_id: seller.id, seller_email: seller.email })
    })

    it("warns once when stock runs low, once more when it runs out, and again after a restock", async () => {
      const { variant, set } = await stockedVariant(10, 4)
      expect(await levels(variant.id)).toEqual([]) // 6 left

      await set(10, 6)
      expect(await levels(variant.id)).toEqual([["low", 4]])
      await set(10, 7)
      expect(await levels(variant.id)).toEqual([]) // already told it's low

      await set(10, 10)
      expect(await levels(variant.id)).toEqual([["out", 0]])
      expect(await levels(variant.id)).toEqual([])

      await set(12, 10) // a few back in: no news
      expect(await levels(variant.id)).toEqual([])
      await set(12, 12) // and out again: news
      expect(await levels(variant.id)).toEqual([["out", 0]])

      await set(30, 12) // properly restocked: re-armed
      expect(await levels(variant.id)).toEqual([])
      await set(30, 27)
      expect(await levels(variant.id)).toEqual([["low", 3]])
    })

    it("alerts only shops whose plan has them: Growth and Premium, not Starter", async () => {
      for (const [plan, expected] of [["Starter", []], ["Growth", [["low", 2]]], ["Premium", [["low", 2]]]] as const) {
        const { variant } = await stockedVariant(2, 0, true, plan)
        expect(await levels(variant.id)).toEqual(expected)
      }
    })

    it("checks the variants in a placed order and skips ones that don't track stock", async () => {
      const tracked = await stockedVariant(3)
      const untracked = await stockedVariant(0, 0, false)
      const order: any = await getContainer()
        .resolve(Modules.ORDER)
        .createOrders({
          currency_code: "php",
          email: "buyer@example.test",
          items: [
            { title: "Tee", quantity: 1, unit_price: 300, variant_id: tracked.variant.id, product_id: tracked.product.id },
            { title: "Tee", quantity: 1, unit_price: 300, variant_id: untracked.variant.id, product_id: untracked.product.id },
          ],
        } as any)
      const due = await alertLowStock(getContainer(), [order.id])
      expect(due.map((d) => [d.variant_id, d.level])).toEqual([[tracked.variant.id, "low"]])
    })
  },
})
