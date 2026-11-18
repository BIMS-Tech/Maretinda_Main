import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { beginSetup, mfaOf } from "../../../../lib/admin-access"
import { otpauthUrl } from "../../../../lib/totp"

/** POST /admin/mfa/setup — a new secret to scan into an authenticator app. Not on until confirmed with a code. */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const userId = req.auth_context.actor_id
  if ((await mfaOf(pg, userId)).enabled) {
    return res.status(409).json({ message: "Two-step sign-in is already on. Ask an owner to reset it if you've lost your phone." })
  }
  const user = await pg("user").where("id", userId).first("email")
  const secret = await beginSetup(pg, userId)
  res.json({ secret, otpauth_url: otpauthUrl(secret, user?.email ?? userId) })
}
