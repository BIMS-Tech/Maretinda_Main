import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { checkCode, markVerified, mfaOf, newRecoveryCodes } from "../../../../lib/admin-access"

/**
 * POST /admin/mfa/enable { code } — confirms the app is set up with its first
 * code and switches two-step sign-in on. Returns the recovery codes, once.
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const userId = req.auth_context.actor_id
  const { row, enabled } = await mfaOf(pg, userId)
  if (enabled) return res.status(409).json({ message: "Two-step sign-in is already on." })
  if (!row) return res.status(400).json({ message: "Start the setup again to get a new QR code." })
  if (!(await checkCode(pg, userId, String((req.body as any)?.code ?? ""), false))) {
    return res.status(400).json({ message: "That code didn't match. Check the time on your phone is set automatically, and try the newest code." })
  }
  const { codes, hashes } = newRecoveryCodes()
  await pg("admin_mfa").where("user_id", userId).update({ enabled_at: new Date(), recovery_hashes: JSON.stringify(hashes) })
  await markVerified(pg, req, userId)
  res.json({ enabled: true, recovery_codes: codes })
}
