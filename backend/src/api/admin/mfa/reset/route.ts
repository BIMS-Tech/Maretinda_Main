import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { roleOf } from "../../../../lib/admin-access"

/**
 * POST /admin/mfa/reset { user_id } — an owner clears another admin's two-step
 * sign-in (a lost phone). They set it up again at their next sign-in.
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  if ((await roleOf(pg, req.auth_context.actor_id)).role !== "owner") {
    return res.status(403).json({ type: "not_allowed", code: "role_not_allowed", message: "Only an owner can reset two-step sign-in." })
  }
  const userId = String((req.body as any)?.user_id ?? "")
  if (!userId) return res.status(400).json({ message: "Choose an admin" })
  await pg("admin_mfa_session").where("user_id", userId).delete()
  const removed = await pg("admin_mfa").where("user_id", userId).delete()
  res.json({ reset: removed > 0 })
}
