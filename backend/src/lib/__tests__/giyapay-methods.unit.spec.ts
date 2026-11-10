import { CHECKOUT_METHODS, offeredMethods } from "../giyapay-methods"

describe("offeredMethods", () => {
  it("keeps only the methods checkout can show", () => {
    expect(offeredMethods(["GCASH", "PAYMAYA", "QRPH"])).toEqual(["GCASH", "QRPH"])
  })

  it("falls back to every checkout method when nothing is configured", () => {
    expect(offeredMethods(undefined)).toEqual(CHECKOUT_METHODS)
  })

  it("doesn't offer PayMaya, which checkout has no button for", () => {
    expect(CHECKOUT_METHODS).not.toContain("PAYMAYA")
  })
})
