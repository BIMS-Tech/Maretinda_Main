import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { mfaOf, mfaRequired } from "../../../lib/admin-access"

/** GET /admin/mfa — whether two-step sign-in is on for the signed-in admin, and how many recovery codes are left. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const { row, enabled } = await mfaOf(pg, req.auth_context.actor_id)
  const hashes = row ? (Array.isArray(row.recovery_hashes) ? row.recovery_hashes : JSON.parse(row.recovery_hashes || "[]")) : []
  res.json({ enabled, enabled_at: row?.enabled_at ?? null, required: mfaRequired(), recovery_codes_left: enabled ? hashes.length : 0 })
}
