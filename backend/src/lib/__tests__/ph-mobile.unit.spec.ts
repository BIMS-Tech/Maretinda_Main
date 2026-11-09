import { toPhMobile } from "../ph-mobile"

describe("toPhMobile", () => {
  it.each([
    ["09171234567", "+639171234567"],
    ["0917 123 4567", "+639171234567"],
    ["0917-123-4567", "+639171234567"],
    ["+639171234567", "+639171234567"],
    ["+63 917 123 4567", "+639171234567"],
    ["639171234567", "+639171234567"],
    ["9171234567", "+639171234567"],
    ["(0917) 123-4567", "+639171234567"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(toPhMobile(input)).toBe(expected)
  })

  it.each([
    ["landline", "028123456"],
    ["Metro Manila landline in +63 form", "+63281234567"],
    ["too short", "0917123456"],
    ["too long", "091712345678"],
    ["foreign number", "+14155552671"],
    ["empty", ""],
    ["letters only", "not a phone"],
  ])("rejects a %s", (_label, input) => {
    expect(toPhMobile(input)).toBeNull()
  })

  it("rejects null and undefined", () => {
    expect(toPhMobile(null as any)).toBeNull()
    expect(toPhMobile(undefined as any)).toBeNull()
  })
})
