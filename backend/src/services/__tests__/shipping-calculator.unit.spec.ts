import { calculateShippingRates, getChargeableWeight } from "../shipping-calculator"

jest.mock("../flyingtigers", () => ({
  getFlyingTigersRates: jest.fn(),
}))
jest.mock("../ninjavan", () => ({ getNinjaVanToken: jest.fn() }))

import { getFlyingTigersRates } from "../flyingtigers"

const ftRates = getFlyingTigersRates as jest.Mock

/** Minimal knex stand-in: one cached row (or none) and a fixed provider list. */
function fakePg({ cached, providers }: { cached?: any; providers: any[] }) {
  const inserts: any[] = []
  const pg = (table: string) => {
    if (table === "shipping_rate_cache") {
      const q: any = {
        where: () => q,
        first: async () => cached,
        insert: (row: any) => {
          inserts.push(row)
          return { onConflict: () => ({ merge: async () => undefined }) }
        },
      }
      return q
    }
    if (table === "platform_shipping_provider") {
      const q: any = { where: () => q, whereNull: async () => providers }
      return q
    }
    throw new Error(`unexpected table ${table}`)
  }
  return { pg, inserts }
}

const ninjavan = { provider_id: "ninjavan", credentials: {} }
const flyingtigers = { provider_id: "flyingtigers", credentials: { api_key: "k", api_secret: "s" } }

describe("getChargeableWeight", () => {
  it("uses actual weight when dimensions are missing", () => {
    expect(getChargeableWeight({ weight_kg: 2 })).toBe(2)
    expect(getChargeableWeight({ weight_kg: 2, length_cm: 50, width_cm: 50 })).toBe(2)
  })

  it("charges volumetric weight (L×W×H/5000) when it is higher", () => {
    expect(getChargeableWeight({ weight_kg: 1, length_cm: 50, width_cm: 40, height_cm: 30 })).toBe(12)
  })

  it("keeps actual weight when the parcel is dense", () => {
    expect(getChargeableWeight({ weight_kg: 10, length_cm: 10, width_cm: 10, height_cm: 10 })).toBe(10)
  })
})

describe("calculateShippingRates", () => {
  beforeEach(() => ftRates.mockReset())

  it.each([
    [0.5, 85, 120],
    [0.51, 100, 145],
    [1, 100, 145],
    [3, 130, 185],
    [5, 180, 250],
    [6, 200, 280],
    [7.5, 230, 325],
  ])("prices Ninja Van at %s kg as ₱%s standard / ₱%s express", async (weight, standard, express) => {
    const { pg } = fakePg({ providers: [ninjavan] })
    const result = await calculateShippingRates(pg, "1000", "4000", { weight_kg: weight })
    const byType = Object.fromEntries(result.rates.map((r) => [r.service_type, r.rate]))
    expect(byType).toEqual({ Standard: standard, Express: express })
  })

  it("returns cached rates without calling carriers", async () => {
    const cachedRates = [{ provider_id: "ninjavan", service_type: "Standard", rate: 85, is_recommended: true }]
    const { pg, inserts } = fakePg({
      cached: { rates: cachedRates, created_at: "2026-01-01T00:00:00Z" },
      providers: [flyingtigers],
    })

    const result = await calculateShippingRates(pg, "1000", "4000", { weight_kg: 1 })

    expect(result.rates).toEqual(cachedRates)
    expect(result.recommended).toEqual(cachedRates[0])
    expect(result.calculated_at).toBe("2026-01-01T00:00:00Z")
    expect(ftRates).not.toHaveBeenCalled()
    expect(inserts).toHaveLength(0)
  })

  it("marks exactly one rate as recommended and caches the result for 10 minutes", async () => {
    const { pg, inserts } = fakePg({ providers: [ninjavan] })
    const before = Date.now()
    const result = await calculateShippingRates(pg, "1000", "4000", { weight_kg: 1 })

    expect(result.rates.filter((r) => r.is_recommended)).toHaveLength(1)
    expect(result.recommended?.recommendation_reason).toBeTruthy()
    expect(inserts).toHaveLength(1)
    expect(inserts[0].cache_key).toBe("1000|4000|1:0:0:0")
    const ttl = inserts[0].expires_at.getTime() - before
    expect(ttl).toBeGreaterThanOrEqual(10 * 60 * 1000 - 50)
    expect(ttl).toBeLessThanOrEqual(10 * 60 * 1000 + 1000)
  })

  it("recommends a COD-capable carrier for COD parcels", async () => {
    ftRates.mockResolvedValue([
      { service_type: "Standard", rate: 300, currency: "PHP", estimated_days: 4, estimated_delivery: "" },
    ])
    const { pg } = fakePg({ providers: [ninjavan, flyingtigers] })
    const result = await calculateShippingRates(pg, "1000", "4000", { weight_kg: 1, is_cod: true })

    expect(result.recommended).toMatchObject({ provider_id: "flyingtigers", supports_cod: true })
    expect(result.recommended?.recommendation_reason).toContain("COD available")
  })

  it("recommends the cheapest-and-fastest option when one exists", async () => {
    ftRates.mockResolvedValue([
      { service_type: "Standard", rate: 100, currency: "PHP", estimated_days: 3, estimated_delivery: "" },
      { service_type: "Express", rate: 80, currency: "PHP", estimated_days: 1, estimated_delivery: "" },
    ])
    const { pg } = fakePg({ providers: [flyingtigers] })
    const result = await calculateShippingRates(pg, "1000", "4000", { weight_kg: 1 })

    expect(result.recommended).toMatchObject({
      service_type: "Express",
      recommendation_reason: "Cheapest and fastest option",
    })
  })

  it("still returns Ninja Van rates when Flying Tigers is down", async () => {
    ftRates.mockRejectedValue(new Error("ECONNREFUSED"))
    jest.spyOn(console, "error").mockImplementation(() => undefined)
    const { pg } = fakePg({ providers: [ninjavan, flyingtigers] })
    const result = await calculateShippingRates(pg, "1000", "4000", { weight_kg: 1 })

    expect(result.rates.map((r) => r.provider_id)).toEqual(["ninjavan", "ninjavan"])
  })

  it("skips Flying Tigers when its credentials are incomplete", async () => {
    const { pg } = fakePg({
      providers: [{ provider_id: "flyingtigers", credentials: { api_key: "k" } }],
    })
    const result = await calculateShippingRates(pg, "1000", "4000", { weight_kg: 1 })

    expect(ftRates).not.toHaveBeenCalled()
    expect(result.rates).toEqual([])
    expect(result.recommended).toBeNull()
  })
})
