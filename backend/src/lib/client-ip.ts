import { timingSafeEqual } from "crypto"

/**
 * True when the request carries the storefront server's shared secret. The
 * store signs buyers in from its own server, so the address Cloudflare sees is
 * the store's; only then is its X-Maretinda-Client-IP trusted.
 */
function fromStoreServer(headers: Record<string, any>): boolean {
  const expected = process.env.STORE_SERVER_SECRET
  const given = headers["x-maretinda-store-secret"]
  if (!expected || expected.length < 16 || typeof given !== "string") return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * The caller's address for rate limiting. All traffic comes through Cloudflare,
 * which overwrites CF-Connecting-IP, so unlike the first X-Forwarded-For entry
 * a client can't choose its own value and dodge a limit by changing it each call.
 */
export function clientIp(req: { headers: Record<string, any>; socket?: { remoteAddress?: string } }): string {
  const forwarded = req.headers["x-maretinda-client-ip"]
  if (typeof forwarded === "string" && forwarded.trim() && fromStoreServer(req.headers)) return forwarded.trim()
  const cf = req.headers["cf-connecting-ip"]
  if (typeof cf === "string" && cf.trim()) return cf.trim()
  return req.socket?.remoteAddress || "unknown"
}
