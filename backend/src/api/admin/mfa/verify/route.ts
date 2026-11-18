import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { checkCode, markVerified, mfaOf } from "../../../../lib/admin-access"

/** POST /admin/mfa/verify { code } — the second step of signing in: an authenticator code or a recovery code. */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const userId = req.auth_context.actor_id
  if (!(await mfaOf(pg, userId)).enabled) return res.status(400).json({ message: "Two-step sign-in isn't set up yet." })
  const how = await checkCode(pg, userId, String((req.body as any)?.code ?? ""), true)
  if (!how) return res.status(400).json({ message: "That code didn't work. Use the newest code from your app, or one of your recovery codes." })
  await markVerified(pg, req, userId)
  const { row } = await mfaOf(pg, userId)
  const left = (Array.isArray(row.recovery_hashes) ? row.recovery_hashes : JSON.parse(row.recovery_hashes || "[]")).length
  res.json({ verified: true, method: how, recovery_codes_left: left })
}
