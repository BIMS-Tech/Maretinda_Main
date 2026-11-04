import crypto from "crypto"

/**
 * GiyaPay Gateway Direct signatures. Both directions are SHA-512 hex digests
 * with the merchant secret appended as the last thing hashed.
 */

const sha512 = (input: string) => crypto.createHash("sha512").update(input).digest("hex")

/** Constant-time comparison, so a forger can't learn the digest byte by byte. */
export function giyapaySignaturesMatch(provided: unknown, expected: string): boolean {
  if (typeof provided !== "string") return false
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/**
 * Signature for the checkout form we post to GiyaPay:
 * merchant_id + amount + currency + order_id + timestamp + nonce + secret.
 * `amount` is in centavos, as a string.
 */
export function giyapayRequestSignature(p: {
  merchantId: string
  amount: string
  currency: string
  orderId: string
  timestamp: string
  nonce: string
  secret: string
}): string {
  return sha512(`${p.merchantId}${p.amount}${p.currency}${p.orderId}${p.timestamp}${p.nonce}${p.secret}`)
}

export type GiyaPayCallbackParams = {
  nonce: string
  order_id: string
  refno: string
  timestamp: string
  amount: string
}

/**
 * Signature GiyaPay appends to the success redirect. Per their docs it is
 * sha512(everything before "&signature=" + secret), and they always append
 * the params in this fixed order, so the URL can be rebuilt from its parts.
 * `callbackUrl` must match the success_callback we sent byte for byte.
 */
export function giyapayCallbackSignature(
  callbackUrl: string,
  p: GiyaPayCallbackParams,
  secret: string
): string {
  const urlWithoutSignature = `${callbackUrl}?nonce=${p.nonce}&order_id=${p.order_id}&refno=${p.refno}&timestamp=${p.timestamp}&amount=${p.amount}`
  return sha512(urlWithoutSignature + secret)
}
