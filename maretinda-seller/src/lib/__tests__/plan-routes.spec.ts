import { describe, expect, it } from "vitest"
import { worksWithoutPlan } from "../plan-routes"

describe("worksWithoutPlan", () => {
  it.each([
    "/subscription",
    "/subscription/success",
    "/orders",
    "/orders/order_1",
    "/requests/orders",
    "/requests/orders/ret_1/review",
    "/messages",
    "/giyapay",
    "/shipping",
  ])("keeps %s open so a lapsed seller can finish orders and renew", (path) => {
    expect(worksWithoutPlan(path)).toBe(true)
  })

  it.each(["/", "/dashboard", "/products", "/products/create", "/promotions", "/settings/store", "/subscription-products", "/orders-export"])(
    "sends %s to Subscription without a plan",
    (path) => {
      expect(worksWithoutPlan(path)).toBe(false)
    }
  )
})
