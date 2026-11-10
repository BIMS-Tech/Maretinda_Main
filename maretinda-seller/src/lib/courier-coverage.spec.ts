import { describe, expect, it } from "vitest"
import { provinceCovered } from "./courier-coverage"

const COVERED = ["Metro Manila", "Cebu", "Davao del Sur"]

describe("provinceCovered", () => {
  it.each(["Cebu", " cebu ", "Province of Cebu", "NCR", "National Capital Region", "Manila"])("covers %j", (name) => {
    expect(provinceCovered(name, COVERED)).toBe(true)
  })

  it.each(["Pampanga", "Davao"])("doesn't cover %j", (name) => {
    expect(provinceCovered(name, COVERED)).toBe(false)
  })

  it("covers anything when the carrier hasn't said where it delivers", () => {
    expect(provinceCovered("Pampanga", undefined)).toBe(true)
    expect(provinceCovered("Pampanga", [])).toBe(true)
  })
})
