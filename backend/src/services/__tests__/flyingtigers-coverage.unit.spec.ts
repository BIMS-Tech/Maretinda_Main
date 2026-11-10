import { coveredProvince } from "../flyingtigers"

const COVERED = [
  { provinceCode: "130000000", provinceLabel: "Metro Manila" },
  { provinceCode: "0702200000", provinceLabel: "Cebu" },
  { provinceCode: "1102400000", provinceLabel: "Davao del Sur" },
]

describe("coveredProvince", () => {
  it.each(["Cebu", "cebu", "  CEBU ", "Province of Cebu"])("finds %j", (name) => {
    expect(coveredProvince(name, COVERED)).toEqual(COVERED[1])
  })

  it.each(["NCR", "National Capital Region", "Metro Manila", "Manila"])("reads %j as Metro Manila", (name) => {
    expect(coveredProvince(name, COVERED)?.provinceLabel).toBe("Metro Manila")
  })

  it.each(["Pampanga", "", undefined, "Davao"])("doesn't cover %j", (name) => {
    expect(coveredProvince(name, COVERED)).toBeNull()
  })
})
