import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { checkRateLimit } from "../utils/rate-limiter"
import { clientIp } from "./client-ip"

type Options = {
  name: string
  max: number
  windowMs: number
  /** Extra key on top of the caller's IP, e.g. the account being logged into. */
  key?: (req: MedusaRequest) => string | undefined
}

const tooMany = (res: MedusaResponse, resetIn: number) => {
  res.setHeader("Retry-After", String(Math.ceil(resetIn / 1000)))
  return res.status(429).json({ message: "Too many requests. Please try again later." })
}

export function rateLimit({ name, max, windowMs, key }: Options) {
  return (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
    const id = `${name}:${clientIp(req as any)}:${key?.(req) ?? ""}`
    const result = checkRateLimit(id, { maxRequests: max, windowMs })
    if (!result.allowed) return tooMany(res, result.resetIn)
    next()
  }
}

/**
 * Password guessing and signup spam. Limits each IP against one account tightly
 * and the IP overall loosely. Deliberately not per-account alone: that would let
 * anyone lock a victim out by failing their login on purpose.
 */
export function authRateLimit(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  if (req.method !== "POST") return next()

  const ip = clientIp(req as any)
  const email = String((req.body as any)?.email ?? (req.body as any)?.identifier ?? "").toLowerCase()
  const isSignup = /\/register$/.test(req.path)
  const isReset = /\/reset-password$/.test(req.path)

  const checks = [
    { id: `auth:ip:${ip}`, max: 60, windowMs: 5 * 60_000 },
    ...(isSignup ? [{ id: `auth:signup:${ip}`, max: 10, windowMs: 60 * 60_000 }] : []),
    ...(isReset ? [{ id: `auth:reset:${ip}:${email}`, max: 5, windowMs: 60 * 60_000 }] : []),
    ...(!isSignup && !isReset && email ? [{ id: `auth:login:${ip}:${email}`, max: 10, windowMs: 5 * 60_000 }] : []),
  ]

  for (const c of checks) {
    const result = checkRateLimit(c.id, { maxRequests: c.max, windowMs: c.windowMs })
    if (!result.allowed) return tooMany(res, result.resetIn)
  }
  next()
}
