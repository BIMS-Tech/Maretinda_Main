import { buyerNewOrderTemplate } from "../../modules/notification-resend/src/templates/buyer-new-order"

const order = {
  display_id: 17,
  total: 430,
  currency_code: "php",
  items: [
    {
      product_title: "Mens Summer Shirts",
      variant_title: "Default variant",
      unit_price: 330,
      quantity: 1,
    },
  ],
  shipping_methods: [{ name: "Express Delivery", amount: 100 }],
  shipping_address: { first_name: "Juan", last_name: "Dela Cruz" },
}

describe("buyer order confirmation email", () => {
  it("shows Medusa amounts as pesos, without dividing by 100", () => {
    const html = buyerNewOrderTemplate({ order })

    expect(html).toContain("₱430.00")
    expect(html).toContain("₱330.00")
    expect(html).toContain("₱100.00")
    expect(html).not.toMatch(/₱4\.30|₱3\.30|₱1\.00/)
  })

  it("adds up the total from items and shipping when the order has none", () => {
    const html = buyerNewOrderTemplate({ order: { ...order, total: 0 } })

    expect(html).toContain("₱430.00")
  })
})

describe("buyer order confirmation email with a voucher", () => {
  const withVoucher = {
    ...order,
    items: [{ product_title: "Jacket", unit_price: 770, quantity: 2 }],
    shipping_methods: [{ name: "Express Delivery", amount: 10 }],
    total: 1350,
    discount_total: 200,
  }

  it("lists the voucher discount so the lines add up to the total", () => {
    const html = buyerNewOrderTemplate({ order: withVoucher })

    expect(html).toContain("₱1,540.00")
    expect(html).toContain("Voucher discount")
    expect(html).toContain("−₱200.00")
    expect(html).toContain("₱1,350.00")
  })

  it("leaves the discount line out when there is none", () => {
    expect(buyerNewOrderTemplate({ order })).not.toContain("Voucher discount")
  })
})
