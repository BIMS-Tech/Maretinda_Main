/**
 * The caller's address for rate limiting. All traffic comes through Cloudflare,
 * which overwrites CF-Connecting-IP, so unlike the first X-Forwarded-For entry
 * a client can't choose its own value and dodge a limit by changing it each call.
 */
export function clientIp(req: { headers: Record<string, any>; socket?: { remoteAddress?: string } }): string {
  const cf = req.headers["cf-connecting-ip"]
  if (typeof cf === "string" && cf.trim()) return cf.trim()
  return req.socket?.remoteAddress || "unknown"
}
