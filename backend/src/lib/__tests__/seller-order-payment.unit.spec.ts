import { sellerNewOrderTemplate } from "../../modules/notification-resend/src/templates/seller-new-order"
import { getSellerPaymentState } from "../seller-order-payment"

const queryReturning = (data: unknown) => ({ graph: jest.fn().mockResolvedValue({ data }) })

describe("getSellerPaymentState", () => {
  it("reads a COD order from its payment", async () => {
    const query = queryReturning([
      { payment_collections: [{ payments: [{ provider_id: "pp_system_default" }] }] },
    ])

    await expect(getSellerPaymentState(query, "order_1")).resolves.toBe("cash_on_delivery")
    expect(query.graph).toHaveBeenCalledWith(
      expect.objectContaining({ entity: "order", filters: { id: "order_1" } })
    )
  })

  it("reads an online order from its payment", async () => {
    const query = queryReturning([
      { payment_collections: [{ payments: [{ provider_id: "pp_giyapay_giyapay" }] }] },
    ])

    await expect(getSellerPaymentState(query, "order_1")).resolves.toBe("paid")
  })

  it("falls back to the payment session when there is no payment row", async () => {
    const query = queryReturning([
      {
        payment_collections: [
          { payments: [], payment_sessions: [{ provider_id: "pp_system_default" }] },
        ],
      },
    ])

    await expect(getSellerPaymentState(query, "order_1")).resolves.toBe("cash_on_delivery")
  })

  it.each([
    ["no order", []],
    ["no payment collection", [{ payment_collections: [] }]],
    ["an empty collection", [{ payment_collections: [{ payments: [], payment_sessions: [] }] }]],
  ])("claims nothing when there is %s", async (_label, data) => {
    await expect(getSellerPaymentState(queryReturning(data), "order_1")).resolves.toBeUndefined()
  })

  it("claims nothing when the lookup fails", async () => {
    const query = { graph: jest.fn().mockRejectedValue(new Error("db down")) }

    await expect(getSellerPaymentState(query, "order_1")).resolves.toBeUndefined()
  })
})

describe("seller new order email", () => {
  const order = { display_id: 16, items: [{ product_title: "Shirt", quantity: 1 }] }

  it("does not say a COD order is paid", () => {
    const html = sellerNewOrderTemplate({ order, payment_state: "cash_on_delivery" })

    expect(html).not.toContain("Payment received")
    expect(html).toContain("Cash on Delivery")
    expect(html).toContain("not yet paid")
    expect(html).toContain("Capture Payment")
  })

  it("says an online order is paid", () => {
    const html = sellerNewOrderTemplate({ order, payment_state: "paid" })

    expect(html).toContain("Payment received")
    expect(html).not.toContain("Cash on Delivery")
    expect(html).not.toContain("Capture Payment")
  })

  it("makes no payment claim when the state is unknown", () => {
    const html = sellerNewOrderTemplate({ order })

    expect(html).not.toContain("Payment received")
    expect(html).not.toContain("Cash on Delivery")
    expect(html).toContain("Ready to fulfill")
  })
})
