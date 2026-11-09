import { verify } from "jsonwebtoken"

/**
 * Who may upload to the public media bucket: sellers and admins. A customer's
 * token is equally valid to verify(), so the actor type has to be checked too.
 * Returns the actor id, or null when the caller isn't allowed.
 */
export function verifyUploader(req: { headers: Record<string, any> }): string | null {
  const header = req.headers.authorization
  if (typeof header !== "string" || !header.startsWith("Bearer ")) return null
  try {
    const decoded = verify(header.substring(7), process.env.JWT_SECRET || "supersecret") as any
    if (!decoded?.actor_id) return null
    return decoded.actor_type === "seller" || decoded.actor_type === "user" ? decoded.actor_id : null
  } catch {
    return null
  }
}
