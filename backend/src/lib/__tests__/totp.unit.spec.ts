import { base32Decode, base32Encode, otpauthUrl, totpAt, verifyTotp } from "../totp"

// RFC 6238 appendix B: the ASCII secret "12345678901234567890", SHA1
const RFC_SECRET = base32Encode(Buffer.from("12345678901234567890"))

describe("TOTP", () => {
  it("matches the RFC 6238 test vectors (last 6 digits)", () => {
    const cases: [number, string][] = [
      [59, "287082"],
      [1111111109, "081804"],
      [1111111111, "050471"],
      [1234567890, "005924"],
      [2000000000, "279037"],
    ]
    for (const [seconds, code] of cases) expect(totpAt(RFC_SECRET, Math.floor(seconds / 30))).toBe(code)
  })

  it("base32 round-trips", () => {
    const buf = Buffer.from([0, 1, 2, 250, 255, 128, 7])
    expect(base32Decode(base32Encode(buf))).toEqual(buf)
  })

  it("accepts the current code and one step of drift, not two, and not a replay", () => {
    const now = 1111111111 * 1000
    const step = Math.floor(1111111111 / 30)
    expect(verifyTotp(RFC_SECRET, "050471", now)).toBe(step)
    expect(verifyTotp(RFC_SECRET, totpAt(RFC_SECRET, step - 1), now)).toBe(step - 1)
    expect(verifyTotp(RFC_SECRET, totpAt(RFC_SECRET, step - 2), now)).toBeNull()
    expect(verifyTotp(RFC_SECRET, "050471", now, step)).toBeNull()
    expect(verifyTotp(RFC_SECRET, "05047", now)).toBeNull()
    expect(verifyTotp(RFC_SECRET, "abcdef", now)).toBeNull()
  })

  it("builds the link authenticator apps scan", () => {
    expect(otpauthUrl("ABC", "owner@example.com")).toBe(
      "otpauth://totp/Maretinda%20Admin%3Aowner%40example.com?secret=ABC&issuer=Maretinda%20Admin&algorithm=SHA1&digits=6&period=30"
    )
  })
})
