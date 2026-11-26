import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { bearerPayload } from "../../../../lib/email-verification"
import { createShopperProfile, shopperToken, signInState } from "../../../../lib/shopper-profile"

/** The sign-in behind this request: only whoever knows its password holds its token. */
const signInOf = (req: MedusaRequest): string | null => {
  const payload = bearerPayload(req)
  return payload?.actor_type === "customer" && payload.auth_identity_id ? payload.auth_identity_id : null
}

/**
 * GET /store/auth/shopper-profile
 *
 * Whose sign-in this is, for a password that was accepted but opens no shopper
 * account: a seller's, an applicant's, or a sign-up that never finished.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const authIdentityId = signInOf(req)
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const state = authIdentityId ? await signInState(pg, authIdentityId) : null
  if (!state) return res.status(401).json({ message: "Please sign in again." })
  res.json(state)
}

/**
 * POST /store/auth/shopper-profile
 *
 * Adds a shopper account to that sign-in and answers with a signed-in session.
 * Safe to repeat. Rate limited in middlewares.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const authIdentityId = signInOf(req)
  if (!authIdentityId) return res.status(401).json({ message: "Please sign in again." })

  const result = await createShopperProfile(req.scope, authIdentityId)
  if (result.ok) return res.json({ token: shopperToken(req.scope, authIdentityId, result.customer_id) })

  if (result.reason === "existing_shopper") {
    return res.status(409).json({
      code: "existing_shopper",
      message: "There's already a shopping account with this email. Sign in with Google, or reset your password.",
    })
  }
  if (result.reason === "not_allowed") {
    return res.status(403).json({ code: "not_allowed", message: "This sign-in can't be used to shop. Please create an account with a different email." })
  }
  return res.status(401).json({ message: "Please sign in again." })
}
