import { HELLOMRTD } from "../../scripts/seed-hellomrtd"

// The hero and newsletter promise "₱200 off your first order over ₱1,500".
// Medusa amounts are pesos, so these must not be centavos.
describe("HELLOMRTD welcome voucher", () => {
  it("takes ₱200 off the order", () => {
    expect(HELLOMRTD.promotion.application_method).toMatchObject({
      type: "fixed",
      target_type: "order",
      value: 200,
      currency_code: "php",
    })
  })

  it("needs a ₱1,500 subtotal", () => {
    expect(HELLOMRTD.promotion.rules).toEqual([
      { attribute: "subtotal", operator: "gte", values: ["1500"] },
    ])
  })

  it("is for first orders only", () => {
    expect(HELLOMRTD.metadata).toMatchObject({ first_order_only: true })
  })
})
