import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { mfaOf, mfaRequired, ROLE_LABEL, roleAreas, roleOf } from "../../../../lib/admin-access"

/** GET /admin/admin-roles/me — the signed-in admin's role and two-step status, for the panel. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const { role, email } = await roleOf(pg, req.auth_context.actor_id)
  const { enabled } = await mfaOf(pg, req.auth_context.actor_id)
  res.json({ email, role, label: ROLE_LABEL[role], areas: roleAreas(role), mfa: { enabled, required: mfaRequired() } })
}
