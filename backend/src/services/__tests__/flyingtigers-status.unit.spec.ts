import { FT_STATUS_MAP, mapFlyingTigersStatus } from "../flyingtigers"

describe("mapFlyingTigersStatus", () => {
  it.each(Object.entries(FT_STATUS_MAP))("maps webhook event %s to %s", (event, internal) => {
    expect(mapFlyingTigersStatus(event)).toBe(internal)
  })

  it.each([
    ["delivered", "delivered"],
    ["cancelled", "cancelled"],
    ["In_Transit", "in_transit"],
    ["out for delivery", "out_for_delivery"],
    ["PICKUP DISPATCHED", "pickup_dispatched"],
  ])("accepts tracking status %s already in internal form", (raw, expected) => {
    expect(mapFlyingTigersStatus(raw)).toBe(expected)
  })

  it("returns null for unknown or empty statuses", () => {
    expect(mapFlyingTigersStatus("Teleported")).toBeNull()
    expect(mapFlyingTigersStatus("")).toBeNull()
    expect(mapFlyingTigersStatus(undefined)).toBeNull()
  })
})
