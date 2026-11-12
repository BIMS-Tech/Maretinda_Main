import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { applyCustomMigrations, bearer, createAdmin, createCustomer, createSeller, noThrow, tokenFor } from "../helpers"

jest.setTimeout(300 * 1000)

/**
 * A seller who won't decide a return escalates it to Maretinda. Mercur has
 * no admin route for that, so escalated returns had nowhere to go: the
 * admin's Order Return screen called a route that didn't exist.
 */
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    beforeAll(async () => {
      await applyCustomMigrations(getContainer())
    })

    const admin = async () => ({ headers: bearer((await createAdmin(getContainer())).token), ...noThrow })
    // Like a buyer's request: tied to their order and the seller who sold it
    const returnRequest = async (status: string) => {
      const container = getContainer()
      const { customer } = await createCustomer(container)
      const { seller, member } = await createSeller(container)
      const [order] = await container.resolve(Modules.ORDER).createOrders([
        { currency_code: "php", email: "b@example.test", customer_id: customer.id, items: [{ title: "Barong", quantity: 1, unit_price: 1499 }] },
      ])
      const [request] = await (container.resolve("order_return") as any).createOrderReturnRequests([
        {
          customer_id: customer.id,
          customer_note: "Arrived torn",
          status,
          vendor_reviewer_note: "Not our fault, the courier's",
          vendor_review_date: new Date(),
        },
      ])
      const link = container.resolve(ContainerRegistrationKeys.LINK)
      await link.create([
        { order_return: { order_return_request_id: request.id }, [Modules.ORDER]: { order_id: order.id } },
        { seller: { seller_id: seller.id }, order_return: { order_return_request_id: request.id } },
      ])
      return { ...request, order, seller, sellerToken: tokenFor("seller", member.id) }
    }

    it("lists escalated returns with the seller's reasoning", async () => {
      const escalated = await returnRequest("escalated")
      await returnRequest("pending")
      const res = await api.get("/admin/return-request?status=escalated&limit=20&offset=0", await admin())
      expect(res.status).toBe(200)
      expect(res.data.count).toBe(1)
      expect(res.data.order_return_request[0]).toMatchObject({
        id: escalated.id,
        status: "escalated",
        customer_note: "Arrived torn",
        seller_reviewer_note: "Not our fault, the courier's",
        order: { id: escalated.order.id },
        seller: { id: escalated.seller.id },
      })
    })

    it("lets an admin turn down an escalated return, with a note", async () => {
      const escalated = await returnRequest("escalated")
      const res = await api.post(
        `/admin/return-request/${escalated.id}`,
        { status: "canceled", admin_reviewer_note: "Photos show the item was used" },
        await admin()
      )
      expect(res.status).toBe(200)
      const saved = await (getContainer().resolve("order_return") as any).retrieveOrderReturnRequest(escalated.id)
      expect(saved).toMatchObject({ status: "canceled", admin_reviewer_note: "Photos show the item was used" })
      expect(saved.admin_reviewer_id).toBeTruthy()
    })

    it("only decides returns that were escalated", async () => {
      const pending = await returnRequest("pending")
      const res = await api.post(
        `/admin/return-request/${pending.id}`,
        { status: "canceled", admin_reviewer_note: "x" },
        await admin()
      )
      expect(res.status).toBe(400)
    })

    it.each([[{ status: "withdrawn", admin_reviewer_note: "x" }], [{ status: "canceled" }]])("refuses %j", async (body) => {
      const escalated = await returnRequest("escalated")
      expect((await api.post(`/admin/return-request/${escalated.id}`, body, await admin())).status).toBe(400)
    })

    it.each(["escalated", "withdrawn"])("lets the seller mark a return %s", async (status) => {
      const pending = await returnRequest("pending")
      const res = await api.post(
        `/vendor/return-request/${pending.id}`,
        { status, vendor_reviewer_note: "Over to Maretinda" },
        { headers: bearer(pending.sellerToken), ...noThrow }
      )
      expect(res.status).toBe(200)
      const saved = await (getContainer().resolve("order_return") as any).retrieveOrderReturnRequest(pending.id)
      expect(saved.status).toBe(status)
    })

    it("doesn't let one seller answer another's return", async () => {
      const pending = await returnRequest("pending")
      const other = await returnRequest("pending")
      const res = await api.post(
        `/vendor/return-request/${pending.id}`,
        { status: "withdrawn", vendor_reviewer_note: "x" },
        { headers: bearer(other.sellerToken), ...noThrow }
      )
      expect(res.status).toBeGreaterThanOrEqual(400)
      expect((await (getContainer().resolve("order_return") as any).retrieveOrderReturnRequest(pending.id)).status).toBe("pending")
    })

    it("only answers a return once", async () => {
      const done = await returnRequest("escalated")
      const res = await api.post(
        `/vendor/return-request/${done.id}`,
        { status: "withdrawn", vendor_reviewer_note: "x" },
        { headers: bearer(done.sellerToken), ...noThrow }
      )
      expect(res.status).toBe(400)
    })

    it("is for admins only", async () => {
      const { token } = await createSeller(getContainer())
      const res = await api.get("/admin/return-request", { headers: bearer(token), ...noThrow })
      expect(res.status).toBe(401)
    })
  },
})
