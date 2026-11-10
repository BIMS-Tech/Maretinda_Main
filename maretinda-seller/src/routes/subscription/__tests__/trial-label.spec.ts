import { describe, expect, test } from "vitest"

import { trialLabel } from "../trial-label"

describe("trialLabel", () => {
  // Sellers are promised the first month free everywhere else
  test("calls a month-long trial the first month free", () => {
    expect(trialLabel(30)).toEqual({ short: "First month free", start: "Start your free month", length: "a month" })
    expect(trialLabel(31).short).toBe("First month free")
  })

  test("names other lengths in days", () => {
    expect(trialLabel(14)).toEqual({ short: "14-day free trial", start: "Start 14-day free trial", length: "14 days" })
  })
})
