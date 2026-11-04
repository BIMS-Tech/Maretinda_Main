import crypto from "crypto"
import { giyapayCallbackSignature, giyapayRequestSignature } from "../giyapay-signature"

const sha512 = (s: string) => crypto.createHash("sha512").update(s).digest("hex")

describe("giyapayRequestSignature", () => {
  const input = {
    merchantId: "MERCHANT1",
    amount: "149900",
    currency: "PHP",
    orderId: "vrenew_growth_monthly_abc",
    timestamp: "1767225600",
    nonce: "n0nce",
    secret: "s3cret",
  }

  it("hashes merchant id, amount, currency, order id, timestamp, nonce and secret in that order", () => {
    expect(giyapayRequestSignature(input)).toBe(
      sha512("MERCHANT1149900PHPvrenew_growth_monthly_abc1767225600n0nces3cret")
    )
  })

  it("is a 128-char lowercase hex digest", () => {
    expect(giyapayRequestSignature(input)).toMatch(/^[0-9a-f]{128}$/)
  })

  it("changes when the amount changes", () => {
    expect(giyapayRequestSignature({ ...input, amount: "149901" })).not.toBe(giyapayRequestSignature(input))
  })
})

describe("giyapayCallbackSignature", () => {
  const params = {
    nonce: "n0nce",
    order_id: "order_123",
    refno: "REF999",
    timestamp: "1767225600",
    amount: "50000",
  }

  it("hashes the success callback URL (params in GiyaPay's fixed order) plus the secret", () => {
    expect(giyapayCallbackSignature("https://maretinda.com/giyapay/success", params, "s3cret")).toBe(
      sha512(
        "https://maretinda.com/giyapay/success?nonce=n0nce&order_id=order_123&refno=REF999&timestamp=1767225600&amount=50000s3cret"
      )
    )
  })

  it("matches the hash of a real redirect URL cut at &signature=", () => {
    const redirect =
      "https://maretinda.com/giyapay/success?nonce=n0nce&order_id=order_123&refno=REF999&timestamp=1767225600&amount=50000&signature=abc"
    const expected = sha512(redirect.split("&signature=")[0] + "s3cret")
    expect(giyapayCallbackSignature("https://maretinda.com/giyapay/success", params, "s3cret")).toBe(expected)
  })

  it("rejects a callback signed for a different URL", () => {
    expect(giyapayCallbackSignature("https://maretinda.com/giyapay/success", params, "s3cret")).not.toBe(
      giyapayCallbackSignature("https://maretinda.com/giyapay/success/", params, "s3cret")
    )
  })

  it("rejects a tampered amount or the wrong secret", () => {
    const genuine = giyapayCallbackSignature("https://x/success", params, "s3cret")
    expect(giyapayCallbackSignature("https://x/success", { ...params, amount: "1" }, "s3cret")).not.toBe(genuine)
    expect(giyapayCallbackSignature("https://x/success", params, "other")).not.toBe(genuine)
  })
})
