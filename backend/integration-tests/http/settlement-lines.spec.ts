import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import SettlementRouterService from "../../src/services/settlement-router"
import { PAYOUT_HOLD_DAYS, payoutLines, unsettledLines } from "../../src/lib/settlement-lines"
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
    async function splitOrders(cartId: string, parts: { sellerId: string; price: number; quantity?: number }[]) {
      const container = getContainer()
      const link = container.resolve(ContainerRegistrationKeys.LINK)
      const [set] = await (container.resolve("marketplace") as any).createOrderSets([{ cart_id: cartId, sales_channel_id: "sc_test", payment_collection_id: "pay_col_test" }])
      const orders: any[] = []
      for (const part of parts) {
        const order = await container.resolve(Modules.ORDER).createOrders({
          currency_code: "php",
          email: "buyer@example.test",
          items: [{ title: "Item", quantity: part.quantity ?? 1, unit_price: part.price }],
        })
        await link.create({ seller: { seller_id: part.sellerId }, [Modules.ORDER]: { order_id: order.id } })
        await link.create({ marketplace: { order_set_id: set.id }, [Modules.ORDER]: { order_id: order.id } })
        orders.push(order)
      }
      return orders
    }

    const DAY = 24 * 3600 * 1000

    /** The order's parcel arrived this many days ago. */
    async function deliver(orderId: string, daysAgo: number) {
      const pg = pgOf(getContainer())
      const id = `ful_${Math.random().toString(36).slice(2, 12)}`
      const at = new Date(Date.now() - daysAgo * DAY)
      await pg("fulfillment").insert({ id, location_id: "sloc_test", packed_at: at, shipped_at: at, delivered_at: at })
      await pg("order_fulfillment").insert({ id: `ordful_${id}`, order_id: orderId, fulfillment_id: id })
      return at
    }

    /** A buyer's return request on the order, for this many of its first item. */
    async function returnRequest(order: any, status: string, quantity = 1) {
      const pg = pgOf(getContainer())
      const id = `oretreq_${Math.random().toString(36).slice(2, 12)}`
      await pg("order_return_request").insert({ id, customer_id: "cus_test", customer_note: "Wrong size", status })
      await pg("order_return_order_return_request_order_order").insert({ id: `l_${id}`, order_id: order.id, order_return_request_id: id })
      await pg("order_return_request_line_item").insert({ id: `li_${id}`, line_item_id: order.items[0].id, quantity, return_request_id: id })
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
      const orders = await splitOrders("cart_two", [{ sellerId: a.seller.id, price: 770 }, { sellerId: b.seller.id, price: 444 }])
      for (const o of orders) await deliver(o.id, PAYOUT_HOLD_DAYS + 1)
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
      const [order] = await splitOrders("cart_once", [{ sellerId: seller.id, price: 1000 }])
      await deliver(order.id, PAYOUT_HOLD_DAYS + 2)
      await payment({ cart_id: "cart_once", seller_id: seller.id, amount: 1000, created_at: new Date(Date.now() - 20 * DAY) })
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

    describe("the 14-day hold", () => {
      async function paidOrder(price = 800, quantity = 1) {
        const pg = pgOf(getContainer())
        const { seller } = await createSeller(getContainer())
        await pg("seller").where("id", seller.id).update(bank)
        const cart = `cart_${Math.random().toString(36).slice(2, 10)}`
        const [order] = await splitOrders(cart, [{ sellerId: seller.id, price, quantity }])
        await payment({ cart_id: cart, seller_id: seller.id, amount: price * quantity })
        const lines = () => payoutLines(pg, { sellerId: seller.id })
        return { order, seller, lines }
      }

      it("pays nothing before delivery, then waits 14 days from delivery", async () => {
        const { order, lines } = await paidOrder()
        expect((await lines())[0]).toMatchObject({ hold: "not_delivered", release_at: null })

        const at = await deliver(order.id, 3)
        const [line] = await lines()
        expect(line.hold).toBe("holding")
        expect(line.release_at!.getTime()).toBe(at.getTime() + PAYOUT_HOLD_DAYS * DAY)
        expect((await unsettledLines(pgOf(getContainer()))).map((l) => l.order_id)).not.toContain(order.id)
      })

      it("holds an order while a return is open, and pays the rest once it is refunded", async () => {
        const { order, lines } = await paidOrder(500, 2)
        await deliver(order.id, PAYOUT_HOLD_DAYS + 1)
        await returnRequest(order, "escalated")
        expect((await lines())[0].hold).toBe("return_open")

        await pgOf(getContainer())("order_return_request").update({ status: "refunded" }).whereIn(
          "id",
          pgOf(getContainer())("order_return_order_return_request_order_order").where("order_id", order.id).select("order_return_request_id")
        )
        const [line] = await lines()
        expect(line.hold).toBeNull()
        expect(line.order_amount).toBe(1000)
        expect(line.amount).toBe(500)
      })

      it("a declined return does not hold the payout", async () => {
        const { order, lines } = await paidOrder()
        await deliver(order.id, PAYOUT_HOLD_DAYS + 1)
        await returnRequest(order, "withdrawn")
        expect((await lines())[0]).toMatchObject({ hold: null, amount: 800 })
      })
    })
  },
})
