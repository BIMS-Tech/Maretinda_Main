import { returnOptionInput } from "../return-option"

describe("returnOptionInput", () => {
  // Without a return option a buyer's return dead-ended at "No shipping
  // methods available", so every seller zone now gets a free one
  it("builds a free, store-enabled return option in the same zone and profile", () => {
    expect(
      returnOptionInput({ service_zone_id: "serzo_1", shipping_profile_id: "sp_1", provider_id: "manual_manual" }, "QA Shop A")
    ).toEqual({
      name: "Return to QA Shop A",
      service_zone_id: "serzo_1",
      shipping_profile_id: "sp_1",
      provider_id: "manual_manual",
      price_type: "flat",
      data: { id: "manual-fulfillment-return", is_return: true },
      type: { label: "Return", description: "The buyer sends the item back to the seller", code: "return" },
      prices: [{ currency_code: "php", amount: 0 }],
      rules: [
        { attribute: "is_return", operator: "eq", value: "true" },
        { attribute: "enabled_in_store", operator: "eq", value: "true" },
      ],
    })
  })

  it("only handles manual delivery; courier providers arrange their own returns", () => {
    expect(returnOptionInput({ service_zone_id: "z", shipping_profile_id: "p", provider_id: "maretinda-shipping_maretinda" }, "X")).toBeNull()
  })
})
