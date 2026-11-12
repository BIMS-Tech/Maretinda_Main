import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import SettlementRouterService from "../../src/services/settlement-router"
import { unsettledLines } from "../../src/lib/settlement-lines"
import { applyCustomMigrations, bearer, createAdmin, createSeller, pgOf } from "../helpers"

jest.setTimeout(180 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })

    const bank = { dft_bank_name: "Metrobank", dft_account_number: "1234567890", dft_beneficiary_name: "Shop Inc" }

    async function payment(over: Record<string, any>) {
      const pg = pgOf(getContainer())
      const ref = `REF${Math.random().toString(36).slice(2, 10)}`
      await pg("giyapay_transaction").insert({ id: `txn_${ref}`, reference_number: ref, amount: 1000, status: "SUCCESS", ...over })
      return ref
    }

    /** One cart paid once, split by Mercur into an order per seller. */
    async function splitOrders(cartId: string, parts: { sellerId: string; price: number }[]) {
      const container = getContainer()
      const link = container.resolve(ContainerRegistrationKeys.LINK)
      const [set] = await (container.resolve("marketplace") as any).createOrderSets([{ cart_id: cartId, sales_channel_id: "sc_test", payment_collection_id: "pay_col_test" }])
      const orders: any[] = []
      for (const part of parts) {
        const order = await container.resolve(Modules.ORDER).createOrders({
          currency_code: "php",
          email: "buyer@example.test",
          items: [{ title: "Item", quantity: 1, unit_price: part.price }],
        })
        await link.create({ seller: { seller_id: part.sellerId }, [Modules.ORDER]: { order_id: order.id } })
        await link.create({ marketplace: { order_set_id: set.id }, [Modules.ORDER]: { order_id: order.id } })
        orders.push(order)
      }
      return orders
    }

    beforeEach(async () => {
      // The service creates this table lazily; make sure it exists before inserting
      await api.get("/admin/giyapay/transactions", { headers: bearer((await createAdmin(getContainer())).token) }).catch(() => null)
    })

    it("divides a two-seller payment between both sellers by their order totals", async () => {
      const pg = pgOf(getContainer())
      const a = await createSeller(getContainer())
      const b = await createSeller(getContainer())
      await pg("seller").whereIn("id", [a.seller.id, b.seller.id]).update(bank)
      await splitOrders("cart_two", [{ sellerId: a.seller.id, price: 770 }, { sellerId: b.seller.id, price: 444 }])
      const ref = await payment({ cart_id: "cart_two", seller_id: a.seller.id, amount: 1214 })

      const lines = await unsettledLines(pg)
      expect(lines.map((l) => [l.seller_id, l.amount]).sort()).toEqual([[a.seller.id, 770], [b.seller.id, 444]].sort())
      expect(lines.map((l) => l.reference_number).sort()).toEqual([`${ref}-1`, `${ref}-2`])
    })

    it("never pays a subscription payment back to the seller, or a cancelled order", async () => {
      const pg = pgOf(getContainer())
      const { seller } = await createSeller(getContainer())
      await pg("seller").where("id", seller.id).update(bank)
      await payment({ order_id: `vrenew_growth_monthly_${seller.id}_1760000000000`, seller_id: seller.id, amount: 1499 })
      const [order] = await splitOrders("cart_cancelled", [{ sellerId: seller.id, price: 500 }])
      await pg("order").where("id", order.id).update({ canceled_at: new Date() })
      await payment({ cart_id: "cart_cancelled", seller_id: seller.id, amount: 500 })

      expect(await unsettledLines(pg)).toEqual([])
    })

    it("a payment goes into one bank file only, and a missed day is caught up", async () => {
      const pg = pgOf(getContainer())
      const { seller } = await createSeller(getContainer())
      await pg("seller").where("id", seller.id).update(bank)
      await payment({ seller_id: seller.id, amount: 1000, created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000) })
      const router = new SettlementRouterService(getContainer())

      const first = await router.routeSettlements(undefined, new Date().toISOString(), "test")
      expect(first.tama_transaction_count).toBe(1)

      const second = await router.routeSettlements(undefined, new Date().toISOString(), "test")
      expect(second.tama_transaction_count).toBeUndefined()
      expect(await unsettledLines(pg)).toEqual([])

      // Deleting the batch (it was never sent) makes the payment owed again
      const admin = await createAdmin(getContainer())
      await api.delete(`/admin/tama/${first.tama_generation_id}`, { headers: bearer(admin.token) })
      expect(await unsettledLines(pg)).toHaveLength(1)
    })
  },
})
