import { clientIp } from "../client-ip"
import { fileMatchesDeclaredType } from "../file-signature"
import { clampInt } from "../pagination"
import { PRODUCT_RULE_ATTRIBUTE, scopeSellerPromotion, SellerPromotionError, stripUnsafePromotionUpdate } from "../seller-promotion"
import { giyapaySignaturesMatch } from "../giyapay-signature"
import { flashSaleItemError } from "../../services/flash-sale"

const hex = (s: string) => Buffer.from(s, "hex")
const FILES: Record<string, Buffer> = {
  "image/png": hex("89504e470d0a1a0a0000"),
  "image/jpeg": hex("ffd8ffe000104a464946"),
  "image/gif": Buffer.from("GIF89a...."),
  "image/webp": Buffer.from("RIFF....WEBPVP8 "),
  "application/pdf": Buffer.from("%PDF-1.7\n"),
  "video/mp4": Buffer.from("....ftypisom"),
  "video/webm": hex("1a45dfa30000"),
  "text/csv": Buffer.from("name,price\nshirt,100\n"),
}

describe("fileMatchesDeclaredType", () => {
  it.each(Object.entries(FILES))("accepts a real %s", (type, bytes) => {
    expect(fileMatchesDeclaredType(bytes, type)).toBe(true)
  })

  it.each(Object.keys(FILES).filter((t) => t !== "text/csv"))("rejects HTML claiming to be %s", (type) => {
    expect(fileMatchesDeclaredType(Buffer.from("<html><script>alert(1)</script></html>"), type)).toBe(false)
  })

  it.each(["<!doctype html><script>", "<svg onload=alert(1)>", "  <html>", "<?xml version='1.0'?>"])(
    "rejects markup posing as CSV: %s",
    (text) => {
      expect(fileMatchesDeclaredType(Buffer.from(text), "text/csv")).toBe(false)
    }
  )

  it("rejects a binary posing as text", () => {
    expect(fileMatchesDeclaredType(hex("4d5a90000300"), "text/plain")).toBe(false)
  })

  it("rejects unknown types and empty files", () => {
    expect(fileMatchesDeclaredType(FILES["image/png"], "application/x-msdownload")).toBe(false)
    expect(fileMatchesDeclaredType(Buffer.alloc(0), "image/png")).toBe(false)
  })
})

describe("clampInt", () => {
  const opts = { fallback: 20, min: 1, max: 50 }
  it.each([
    ["10", 10],
    [10.9, 10],
    ["-1", 1],
    ["1000", 50],
    ["1e308", 50],
    ["NaN", 20],
    ["abc", 20],
    [undefined, 20],
    ["Infinity", 20],
  ])("%s → %s", (raw, expected) => {
    expect(clampInt(raw, opts)).toBe(expected)
  })
})

describe("clientIp", () => {
  it("trusts Cloudflare's header and ignores a client-chosen X-Forwarded-For", () => {
    expect(clientIp({ headers: { "cf-connecting-ip": "203.0.113.5", "x-forwarded-for": "1.2.3.4" } })).toBe("203.0.113.5")
    expect(clientIp({ headers: { "x-forwarded-for": "1.2.3.4" }, socket: { remoteAddress: "10.0.0.1" } })).toBe("10.0.0.1")
  })

  // The storefront signs buyers in from its own server, so without this every
  // buyer shared the store's address and its sign-up and sign-in limits
  describe("forwarded by the storefront server", () => {
    const store = (secret: string, ip = "198.51.100.7") => ({
      headers: { "cf-connecting-ip": "203.0.113.5", "x-maretinda-client-ip": ip, "x-maretinda-store-secret": secret },
    })

    afterEach(() => {
      delete process.env.STORE_SERVER_SECRET
    })

    it("uses the buyer's address the store passes on with the shared secret", () => {
      process.env.STORE_SERVER_SECRET = "s3cret-value-1234"
      expect(clientIp(store("s3cret-value-1234"))).toBe("198.51.100.7")
    })

    it("ignores it with a wrong secret, or when no secret is configured", () => {
      process.env.STORE_SERVER_SECRET = "s3cret-value-1234"
      expect(clientIp(store("guess"))).toBe("203.0.113.5")
      delete process.env.STORE_SERVER_SECRET
      expect(clientIp(store(""))).toBe("203.0.113.5")
    })
  })
})

describe("giyapaySignaturesMatch", () => {
  it("only matches the exact digest", () => {
    expect(giyapaySignaturesMatch("abc", "abc")).toBe(true)
    expect(giyapaySignaturesMatch("abd", "abc")).toBe(false)
    expect(giyapaySignaturesMatch("ab", "abc")).toBe(false)
    expect(giyapaySignaturesMatch(["abc"], "abc")).toBe(false)
    expect(giyapaySignaturesMatch(undefined, "abc")).toBe(false)
  })
})

describe("scopeSellerPromotion", () => {
  const owned = ["prod_a", "prod_b"]
  const base = { code: "X", application_method: { type: "percentage", target_type: "order", value: 100 } }
  const rule = (p: any) => p.application_method.target_rules.find((r: any) => r.attribute === PRODUCT_RULE_ATTRIBUTE)

  it("forces a promotion onto the seller's own items", () => {
    const scoped = scopeSellerPromotion(base, owned)
    expect(scoped.application_method.target_type).toBe("items")
    expect(rule(scoped).values).toEqual(owned)
    expect(rule(scoped).operator).toBe("in")
  })

  it("can never be automatic", () => {
    expect(scopeSellerPromotion({ ...base, is_automatic: true }, owned).is_automatic).toBe(false)
  })

  it("respects a narrower choice of the seller's own products", () => {
    const scoped = scopeSellerPromotion(
      { ...base, application_method: { ...base.application_method, target_rules: [{ attribute: PRODUCT_RULE_ATTRIBUTE, values: ["prod_a"] }] } },
      owned
    )
    expect(rule(scoped).values).toEqual(["prod_a"])
  })

  it("refuses to target someone else's product", () => {
    expect(() =>
      scopeSellerPromotion(
        { ...base, application_method: { ...base.application_method, target_rules: [{ attribute: PRODUCT_RULE_ATTRIBUTE, values: ["prod_other"] }] } },
        owned
      )
    ).toThrow(SellerPromotionError)
  })

  it("refuses a seller with no products", () => {
    expect(() => scopeSellerPromotion(base, [])).toThrow(SellerPromotionError)
  })

  it("an update can't undo the scoping", () => {
    expect(
      stripUnsafePromotionUpdate({
        status: "active",
        is_automatic: true,
        application_method: { value: 10, target_type: "order", target_rules: [] },
      })
    ).toEqual({ status: "active", application_method: { value: 10 } })
  })
})

describe("flashSaleItemError", () => {
  it.each([
    [{ discount_type: "percentage", discount_value: 20 }],
    [{ discount_type: "percentage", discount_value: "20" }],
    [{ discount_type: "fixed", discount_value: 100, stock_limit: 5 }],
  ])("accepts %j", (input) => {
    expect(flashSaleItemError(input)).toBeNull()
  })

  it.each([
    [{ discount_type: "percentage", discount_value: 91 }],
    [{ discount_type: "percentage", discount_value: -1 }],
    [{ discount_type: "fixed", discount_value: 0 }],
    [{ discount_type: "fixed", discount_value: "NaN" }],
    [{ discount_type: "fixed", discount_value: true }],
    [{ discount_type: "free", discount_value: 1 }],
    [{ discount_type: "fixed", discount_value: 1, stock_limit: 0 }],
    [{ discount_type: "fixed", discount_value: 1, stock_limit: 1.5 }],
  ])("rejects %j", (input) => {
    expect(flashSaleItemError(input)).toBeTruthy()
  })
})
