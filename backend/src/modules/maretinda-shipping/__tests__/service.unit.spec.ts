import MaretindaShippingProviderService from "../service"

const provider = new (MaretindaShippingProviderService as any)({}, {}) as MaretindaShippingProviderService

const pesos = async (optionData: Record<string, unknown>, items: any[]) => {
  const res = await provider.calculatePrice(optionData, {}, { cart: { items } })
  return Number(res.calculated_amount)
}

const item = (weightGrams: number, quantity = 1, dims?: { length: number; width: number; height: number }) => ({
  title: "Shirt",
  quantity,
  variant: { weight: weightGrams, ...dims },
})

describe("MaretindaShippingProviderService.calculatePrice", () => {
  it("charges nothing for an empty cart", async () => {
    const res = await provider.calculatePrice({}, {}, { cart: { items: [] } })
    expect(res.calculated_amount).toBe(0)
  })

  it.each([
    ["Standard", 500, 85],
    ["Standard", 1000, 100],
    ["Standard", 2500, 130],
    ["Standard", 5000, 180],
    ["Standard", 6000, 200],
    ["Express", 500, 120],
    ["Express", 1000, 145],
    ["Express", 3000, 185],
    ["Express", 5000, 250],
    ["Express", 6000, 280],
  ])("%s at %sg costs ₱%s", async (service_type, grams, expected) => {
    expect(await pesos({ service_type }, [item(grams)])).toBe(expected)
  })

  it("sums weight across items and quantities", async () => {
    // 2 × 400g + 300g = 1.1kg → Standard 1–3kg tier
    expect(await pesos({ service_type: "Standard" }, [item(400, 2), item(300)])).toBe(130)
  })

  it("uses volumetric weight for bulky items", async () => {
    // 200g but 40×30×20cm = 4.8kg volumetric → 3–5kg tier
    expect(await pesos({ service_type: "Standard" }, [item(200, 1, { length: 40, width: 30, height: 20 })])).toBe(180)
  })

  it("adds the ₱20 COD surcharge", async () => {
    expect(await pesos({ service_type: "Standard", is_cod: true }, [item(500)])).toBe(105)
  })

  it("falls back to Standard for an unknown service type", async () => {
    expect(await pesos({ service_type: "Overnight" }, [item(500)])).toBe(85)
  })

  it("blocks checkout when a product has no weight", async () => {
    await expect(
      provider.calculatePrice({}, {}, { cart: { items: [{ title: "Mug", variant: { weight: 0 } }] } })
    ).rejects.toThrow('"Mug" has no weight set')
  })

  it("returns pesos like every other Medusa amount (₱85, not 8500)", async () => {
    const res = await provider.calculatePrice({ service_type: "Standard" }, {}, { cart: { items: [item(500)] } })
    expect(res.calculated_amount).toBe(85)
  })
})

describe("MaretindaShippingProviderService options", () => {
  it("offers standard, express and COD standard", async () => {
    const options = await provider.getFulfillmentOptions()
    expect(options.map((o: any) => [o.id, o.service_type, o.is_cod])).toEqual([
      ["standard", "Standard", false],
      ["express", "Express", false],
      ["cod-standard", "Standard", true],
    ])
  })

  it("passes the option's service type and COD flag through to the cart", async () => {
    expect(await provider.validateFulfillmentData({ service_type: "Express", is_cod: true }, { x: 1 })).toEqual({
      x: 1,
      service_type: "Express",
      is_cod: true,
    })
    expect(await provider.validateFulfillmentData({}, {})).toEqual({ service_type: "Standard", is_cod: false })
  })

  it("rejects an option without an id", async () => {
    expect(await provider.validateOption({ id: "standard" })).toBe(true)
    expect(await provider.validateOption({ id: "" })).toBe(false)
    expect(await provider.validateOption({})).toBe(false)
  })
})
