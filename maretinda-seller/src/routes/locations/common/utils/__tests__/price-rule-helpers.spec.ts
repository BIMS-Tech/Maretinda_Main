import { describe, expect, test } from "vitest"

import { buildShippingOptionPrices, ensurePriceRules } from "../price-rule-helpers"

describe("buildShippingOptionPrices", () => {
  // Mercur 1.5.3 rejects a shipping option whose prices have no `rules` array
  // ("Field 'prices, 0, rules' is required"), so new sellers couldn't add delivery.
  test("gives every price an empty rules list", () => {
    expect(buildShippingOptionPrices({ php: "85" }, { reg_ph: "90" })).toEqual([
      { currency_code: "php", amount: 85, rules: [] },
      { region_id: "reg_ph", amount: 90, rules: [] },
    ])
  })

  test("skips prices the seller left empty", () => {
    expect(buildShippingOptionPrices({ php: "", usd: undefined }, {})).toEqual([])
  })
})

describe("ensurePriceRules", () => {
  // Editing a flat shipping price failed the same way as creating one.
  test("adds an empty rules list to flat prices and keeps conditional rules", () => {
    const conditional = { currency_code: "php", amount: 0, rules: [{ attribute: "item_total", operator: "gte", value: 1500 }] }
    expect(ensurePriceRules([{ id: "price_1", currency_code: "php", amount: 85 }, conditional])).toEqual([
      { id: "price_1", currency_code: "php", amount: 85, rules: [] },
      conditional,
    ])
  })
})
