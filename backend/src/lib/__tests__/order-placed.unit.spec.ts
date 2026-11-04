import { placedOrderIds } from "../order-placed"

describe("placedOrderIds", () => {
  it("returns every seller order from Mercur's split-checkout payload", () => {
    expect(placedOrderIds({ order_ids: ["order_a", "order_b"] })).toEqual(["order_a", "order_b"])
  })

  it("wraps Medusa's single-order payload in an array", () => {
    expect(placedOrderIds({ id: "order_a" })).toEqual(["order_a"])
  })

  it("prefers order_ids when both shapes are present", () => {
    expect(placedOrderIds({ id: "order_x", order_ids: ["order_a"] })).toEqual(["order_a"])
  })

  it("treats an empty order_ids array as authoritative", () => {
    expect(placedOrderIds({ id: "order_x", order_ids: [] })).toEqual([])
  })

  it("returns nothing for an empty or missing payload", () => {
    expect(placedOrderIds({})).toEqual([])
    expect(placedOrderIds(undefined as any)).toEqual([])
    expect(placedOrderIds(null as any)).toEqual([])
  })
})
