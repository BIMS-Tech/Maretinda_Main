import { FREE_SHIPPING_MIN_ORDER, withFreeShippingPrice } from "../free-shipping"

describe("withFreeShippingPrice", () => {
  // The store promises free shipping on orders over ₱499; sellers' flat
  // prices never had the ₱0 tier, so a ₱770 order still paid ₱85-₱200
  it("adds a ₱0 price for carts of ₱499 or more beside each flat price", () => {
    expect(FREE_SHIPPING_MIN_ORDER).toBe(499)
    expect(withFreeShippingPrice([{ currency_code: "php", amount: 120 }])).toEqual([
      { currency_code: "php", amount: 120 },
      { currency_code: "php", amount: 0, rules: [{ attribute: "item_total", operator: "gte", value: 499 }] },
    ])
  })

  it("doesn't add it twice", () => {
    const prices = [
      { currency_code: "php", amount: 120, rules: [] },
      { currency_code: "php", amount: 0, rules: [{ attribute: "item_total", operator: "gte", value: 499 }] },
    ]
    expect(withFreeShippingPrice(prices)).toEqual(prices)
  })

  it("leaves region prices and other conditional prices alone", () => {
    const prices = [
      { region_id: "reg_1", amount: 90 },
      { currency_code: "php", amount: 50, rules: [{ attribute: "item_total", operator: "gte", value: 300 }] },
    ]
    expect(withFreeShippingPrice(prices)).toEqual(prices)
  })
})
