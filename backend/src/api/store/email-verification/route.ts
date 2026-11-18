import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { bearerPayload, customerEmailState, emailVerificationRequired } from "../../../lib/email-verification"

/**
 * GET /store/email-verification
 *
 * Whether the signed-in buyer's email is confirmed, so the storefront can ask
 * them to confirm it before checkout instead of failing at "Place order".
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const payload = bearerPayload(req)
  if (payload?.actor_type !== "customer" || !payload.actor_id) {
    return res.status(401).json({ message: "Please sign in again." })
  }
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const state = await customerEmailState(pg, payload.actor_id)
  if (!state.exists) return res.status(401).json({ message: "Please sign in again." })
  const required = emailVerificationRequired()
  res.json({ email: state.email, verified: state.verified || !required, required })
}
