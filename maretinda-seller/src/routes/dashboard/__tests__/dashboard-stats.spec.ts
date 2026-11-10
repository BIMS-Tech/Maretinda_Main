import { describe, expect, it } from "vitest"
import { daysLeft, orderStats } from "../dashboard-stats"

describe("orderStats", () => {
  const orders = [
    { total: 770, status: "pending", fulfillment_status: "not_fulfilled" },
    { total: 1460, status: "completed", fulfillment_status: "delivered" },
    { total: 500, status: "canceled", fulfillment_status: "canceled" },
    { total: 890, status: "pending", fulfillment_status: "fulfilled" },
  ]

  it("adds up revenue in pesos, leaving out cancelled orders", () => {
    // Store amounts are already pesos: ₱770 + ₱1,460 + ₱890
    expect(orderStats(orders).revenue).toBe(3120)
    expect(orderStats(orders).averageOrder).toBe(1040)
  })

  it("counts what needs the seller's hands", () => {
    expect(orderStats(orders)).toMatchObject({ toFulfil: 1, toShip: 1, orders: 3 })
  })

  it("is zero with no orders", () => {
    expect(orderStats([])).toEqual({ revenue: 0, averageOrder: 0, orders: 0, toFulfil: 0, toShip: 0 })
  })
})

describe("daysLeft", () => {
  const now = new Date("2026-11-10T12:00:00Z")
  it("rounds up to whole days", () => {
    expect(daysLeft("2026-11-12T00:00:00Z", now)).toBe(2)
  })
  it("is zero once ended, and null without a date", () => {
    expect(daysLeft("2026-11-01T00:00:00Z", now)).toBe(0)
    expect(daysLeft(null, now)).toBeNull()
  })
})
