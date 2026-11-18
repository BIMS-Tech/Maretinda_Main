import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { checkCode, mfaOf, newRecoveryCodes } from "../../../../lib/admin-access"

/** POST /admin/mfa/recovery-codes { code } — replaces the recovery codes; needs a current authenticator code. */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const userId = req.auth_context.actor_id
  if (!(await mfaOf(pg, userId)).enabled) return res.status(400).json({ message: "Two-step sign-in isn't set up yet." })
  if ((await checkCode(pg, userId, String((req.body as any)?.code ?? ""), false)) !== "totp") {
    return res.status(400).json({ message: "Enter the current code from your authenticator app." })
  }
  const { codes, hashes } = newRecoveryCodes()
  await pg("admin_mfa").where("user_id", userId).update({ recovery_hashes: JSON.stringify(hashes) })
  res.json({ recovery_codes: codes })
}
