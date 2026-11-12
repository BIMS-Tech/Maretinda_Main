import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { resolveAttempt, unconfirmedAttempts } from "../../../../lib/giyapay-attempts"

/** GET /admin/giyapay/unconfirmed — buyers sent to GiyaPay whose payment was never confirmed back. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const attempts = await unconfirmedAttempts(req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION))
  res.json({ attempts, count: attempts.length })
}

/** POST /admin/giyapay/unconfirmed { id, note } — records what checking GiyaPay showed, and clears it from the list. */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { id, note } = (req.body ?? {}) as { id?: unknown; note?: unknown }
  if (typeof id !== "string" || !id) return res.status(400).json({ message: "Missing id" })
  if (typeof note !== "string" || !note.trim() || note.length > 500) {
    return res.status(400).json({ message: "Add a note: what did GiyaPay show for this payment?" })
  }
  const done = await resolveAttempt(req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION), id, req.auth_context.actor_id, note.trim())
  if (!done) return res.status(404).json({ message: "Not found" })
  res.json({ resolved: true })
}
