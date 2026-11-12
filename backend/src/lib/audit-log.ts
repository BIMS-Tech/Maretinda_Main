import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { clientIp } from "./client-ip"

const SECRET = /pass|secret|token|key|credential|authorization|account_number/i

/** A request body safe to keep: secrets masked, long values and deep nesting cut. */
export function redact(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === "string") return value.length > 300 ? `${value.slice(0, 300)}…` : value
  if (typeof value !== "object") return value
  if (depth >= 4) return "…"
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1))
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .slice(0, 50)
      .map(([k, v]) => [k, SECRET.test(k) ? "[redacted]" : redact(v, depth + 1)])
  )
}

/**
 * Records every write made through /admin once it has been answered: who,
 * what, and whether it succeeded. Never blocks or fails the request itself.
 */
export function auditAdminWrites(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return next()
  res.on("finish", () => {
    const auth = (req as any).auth_context
    let pg: any
    try {
      pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch {
      return
    }
    pg("admin_audit_log")
      .insert({
        actor_id: auth?.actor_id ?? null,
        actor_type: auth?.actor_type ?? null,
        method: req.method,
        path: (req.originalUrl || req.url || "").split("?")[0].slice(0, 500),
        status: res.statusCode,
        ip: clientIp(req as any) ?? null,
        body: req.body && typeof req.body === "object" ? JSON.stringify(redact(req.body)) : null,
      })
      .catch((e: any) => console.error("[audit-log] could not record:", e?.message))
  })
  next()
}
