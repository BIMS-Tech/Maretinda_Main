import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { captureCodPayment, resetCodPaymentToAuthorized } from "../../src/lib/cod-payment"
import { applyCustomMigrations, bearer, createAdmin, createSeller, noThrow, pgOf } from "../helpers"

jest.setTimeout(180 * 1000)

/**
 * Runs the COD helpers against real Medusa/Mercur tables. The original bug
 * here was writing payment.status / payment.captured_amount — columns that
 * don't exist — so a fake knex can't catch regressions of that kind.
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })

    /**
     * An order paid by COD, in the state Mercur leaves it after placement:
     * the system payment captured (wrongly, for COD) and the split recorded.
     */
    async function placedCodOrder(sellerId?: string) {
      const container = getContainer()
      const orderModule = container.resolve(Modules.ORDER)
      const paymentModule = container.resolve(Modules.PAYMENT)
      const link = container.resolve(ContainerRegistrationKeys.LINK)

      const order = await orderModule.createOrders({
        currency_code: "php",
        email: "buyer@example.test",
        items: [{ title: "Barong", quantity: 1, unit_price: 1499 }],
      })

      const collection = await paymentModule.createPaymentCollections({ currency_code: "php", amount: 1499 })
      const session = await paymentModule.createPaymentSession(collection.id, {
        provider_id: "pp_system_default",
        amount: 1499,
        currency_code: "php",
        data: {},
      })
      const payment = await paymentModule.authorizePaymentSession(session.id, {})
      await paymentModule.capturePayment({ payment_id: payment.id, amount: 1499 })

      await link.create({
        [Modules.ORDER]: { order_id: order.id },
        [Modules.PAYMENT]: { payment_collection_id: collection.id },
      })
      if (sellerId) {
        await link.create({ seller: { seller_id: sellerId }, [Modules.ORDER]: { order_id: order.id } })
      }

      await (container.resolve("split_order_payment") as any).createSplitOrderPayments({
        status: "captured",
        currency_code: "php",
        authorized_amount: 1499,
        captured_amount: 1499,
        payment_collection_id: collection.id,
      })

      return { order, collection, payment }
    }

    async function captureState(collectionId: string, paymentId: string) {
      const pg = pgOf(getContainer())
      const pc = await pg("payment_collection").where({ id: collectionId }).first()
      const payment = await pg("payment").where({ id: paymentId }).first()
      const liveCaptures = await pg("capture").where({ payment_id: paymentId }).whereNull("deleted_at")
      const split = await pg("split_order_payment").where({ payment_collection_id: collectionId }).first()
      return {
        collectionStatus: pc.status,
        collectionCaptured: Number(pc.captured_amount),
        paymentCapturedAt: payment.captured_at,
        liveCaptures: liveCaptures.length,
        splitStatus: split.status,
        splitCaptured: Number(split.captured_amount),
      }
    }

    async function adminPaymentStatus(orderId: string) {
      const { token } = await createAdmin(getContainer())
      const res = await api.get(`/admin/orders/${orderId}?fields=payment_status`, { headers: bearer(token) })
      return res.data.order.payment_status
    }

    describe("resetCodPaymentToAuthorized", () => {
      it("reverses Mercur's auto-capture across all four places", async () => {
        const { collection, payment } = await placedCodOrder()

        await resetCodPaymentToAuthorized(pgOf(getContainer()), {
          paymentCollectionId: collection.id,
          paymentId: payment.id,
        })

        expect(await captureState(collection.id, payment.id)).toEqual({
          collectionStatus: "authorized",
          collectionCaptured: 0,
          paymentCapturedAt: null,
          liveCaptures: 0,
          splitStatus: "pending",
          splitCaptured: 0,
        })
      })

      it("makes the admin order list read Authorized instead of Captured", async () => {
        const { order, collection, payment } = await placedCodOrder()
        expect(await adminPaymentStatus(order.id)).toBe("captured")

        await resetCodPaymentToAuthorized(pgOf(getContainer()), {
          paymentCollectionId: collection.id,
          paymentId: payment.id,
        })

        expect(await adminPaymentStatus(order.id)).toBe("authorized")
      })
    })

    describe("captureCodPayment", () => {
      it("records the cash collection once, even if called twice", async () => {
        const { collection, payment } = await placedCodOrder()
        const pg = pgOf(getContainer())
        const ids = { paymentCollectionId: collection.id, paymentId: payment.id }
        await resetCodPaymentToAuthorized(pg, ids)

        await captureCodPayment(pg, { ...ids, amount: 1499 })
        await captureCodPayment(pg, { ...ids, amount: 1499 })

        const state = await captureState(collection.id, payment.id)
        expect(state).toMatchObject({
          collectionStatus: "completed",
          collectionCaptured: 1499,
          liveCaptures: 1,
          splitStatus: "captured",
          splitCaptured: 1499,
        })
        expect(state.paymentCapturedAt).toBeInstanceOf(Date)
      })
    })

    describe("POST /vendor/orders/:id/capture", () => {
      it("lets the seller mark a COD order paid", async () => {
        const { seller, token } = await createSeller(getContainer())
        const { order, collection, payment } = await placedCodOrder(seller.id)
        await resetCodPaymentToAuthorized(pgOf(getContainer()), {
          paymentCollectionId: collection.id,
          paymentId: payment.id,
        })

        const res = await api.post(`/vendor/orders/${order.id}/capture`, {}, { headers: bearer(token) })

        expect(res.status).toBe(200)
        expect(res.data.payment_id).toBe(payment.id)
        expect(await adminPaymentStatus(order.id)).toBe("captured")
      })

      it("returns 404 for an order with no COD payment", async () => {
        const { seller, token } = await createSeller(getContainer())
        const order = await getContainer()
          .resolve(Modules.ORDER)
          .createOrders({ currency_code: "php", email: "b@example.test", items: [{ title: "X", quantity: 1, unit_price: 1 }] })
        await getContainer()
          .resolve(ContainerRegistrationKeys.LINK)
          .create({ seller: { seller_id: seller.id }, [Modules.ORDER]: { order_id: order.id } })

        const res = await api.post(`/vendor/orders/${order.id}/capture`, {}, { headers: bearer(token), ...noThrow })
        expect(res.status).toBe(404)
      })

      it("refuses to capture another seller's order", async () => {
        const owner = await createSeller(getContainer())
        const other = await createSeller(getContainer())
        const { order, collection } = await placedCodOrder(owner.seller.id)

        const res = await api.post(`/vendor/orders/${order.id}/capture`, {}, { headers: bearer(other.token), ...noThrow })

        expect([403, 404]).toContain(res.status)
        const pc = await pgOf(getContainer())("payment_collection").where({ id: collection.id }).first()
        expect(Number(pc.captured_amount)).toBe(1499) // unchanged from placement, not re-captured by them
      })
    })
  },
})
