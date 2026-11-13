import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { clientIp } from "./client-ip"

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

export type CaptchaResult = "passed" | "failed" | "unavailable"

/**
 * Asks Cloudflare Turnstile whether a token is real. "unavailable" means
 * Cloudflare could not be reached, which is not the visitor's fault.
 */
export async function verifyCaptcha(
  token: string,
  secret: string,
  ip?: string,
  fetcher: typeof fetch = fetch
): Promise<CaptchaResult> {
  try {
    const body = new URLSearchParams({ secret, response: token })
    if (ip && ip !== "unknown") body.set("remoteip", ip)
    const res = await fetcher(VERIFY_URL, { method: "POST", body, signal: AbortSignal.timeout(5000) })
    if (!res.ok) return "unavailable"
    const json: any = await res.json()
    return json?.success === true ? "passed" : "failed"
  } catch {
    return "unavailable"
  }
}

/**
 * Refuses a sign-up or application that has not passed the captcha. Off until
 * TURNSTILE_SECRET_KEY is set, so nothing changes before the key exists. If
 * Cloudflare is down the request is let through: the rate limits still apply,
 * and an outage there should not close registration here.
 */
export async function requireCaptcha(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret || req.method !== "POST") return next()

  const header = req.headers["x-captcha-token"]
  const token = (typeof header === "string" && header) || (req.body as any)?.captcha_token
  // The token is not part of what the route stores or validates
  if (req.body && typeof req.body === "object") delete (req.body as any).captcha_token

  if (typeof token !== "string" || !token || token.length > 4096) {
    return res.status(400).json({ type: "invalid_data", code: "captcha_required", message: "Please complete the verification check and try again." })
  }
  const result = await verifyCaptcha(token, secret, clientIp(req as any))
  if (result === "failed") {
    return res.status(400).json({ type: "invalid_data", code: "captcha_failed", message: "The verification check did not pass. Please try again." })
  }
  if (result === "unavailable") console.error("[captcha] Turnstile could not be reached; request allowed")
  next()
}
