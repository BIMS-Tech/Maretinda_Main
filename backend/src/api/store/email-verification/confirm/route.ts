import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { confirmVerificationToken } from "../../../../lib/email-verification"

const REFUSALS = {
  invalid: "This confirmation link isn't valid. Sign in and ask for a new one.",
  expired: "This confirmation link has expired. Sign in and ask for a new one.",
  changed: "This link was sent to an email address the account no longer uses. Sign in and ask for a new one.",
} as const

/**
 * POST /store/email-verification/confirm  { token }
 *
 * Used by the storefront's and seller panel's /verify-email pages. The token
 * itself is the proof, so no sign-in is needed. Rate limited in middlewares.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const token = String((req.body as any)?.token ?? "")
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const result = await confirmVerificationToken(pg, token)
  if (!result.ok) return res.status(400).json({ code: result.reason, message: REFUSALS[result.reason] })
  res.json({ confirmed: true, kind: result.kind, email: result.email, already: result.already })
}
