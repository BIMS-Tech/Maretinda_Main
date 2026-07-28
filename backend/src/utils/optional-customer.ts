import { MedusaRequest } from "@medusajs/framework/http"
import { verify } from "jsonwebtoken"

/**
 * Resolves the customer behind a request when one is signed in, without
 * requiring it. Store routes that are public but personalise their response
 * (e.g. a reel feed that marks which reels you already liked) can't use
 * `authenticate("customer", ...)` — that middleware rejects anonymous callers.
 *
 * Returns null for anonymous, expired, or non-customer tokens.
 */
export function getOptionalCustomerId(req: MedusaRequest): string | null {
  const fromContext = (req as any).auth_context?.actor_id
  if (fromContext) return fromContext

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith("Bearer ")) return null

  try {
    const decoded = verify(
      authHeader.substring(7),
      process.env.JWT_SECRET || "supersecret"
    ) as any
    if (decoded?.actor_type && decoded.actor_type !== "customer") return null
    return decoded?.actor_id || null
  } catch {
    return null
  }
}
