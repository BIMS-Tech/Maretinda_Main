import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ADMIN_ROLES, AdminRole, ROLE_LABEL, roleOf } from "../../../lib/admin-access"

/** GET /admin/admin-roles — every admin with their role and whether two-step sign-in is on. Owners only. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const users = await pg("user as u")
    .leftJoin("admin_role as r", "r.email", pg.raw("lower(u.email)"))
    .leftJoin("admin_mfa as m", "m.user_id", "u.id")
    .whereNull("u.deleted_at")
    .select("u.id", "u.email", "u.first_name", "u.last_name", "r.role", "m.enabled_at as mfa_enabled_at")
    .orderBy("u.created_at", "asc")
  const invited = await pg("admin_role as r")
    .whereNotExists(pg("user as u").whereRaw("lower(u.email) = r.email").whereNull("u.deleted_at"))
    .select("r.email", "r.role")
  res.json({
    roles: ADMIN_ROLES.map((value) => ({ value, label: ROLE_LABEL[value] })),
    admins: await Promise.all(
      users.map(async (u: any) => ({ ...u, role: u.role ?? (await roleOf(pg, u.id)).role, mfa_enabled: !!u.mfa_enabled_at }))
    ),
    invited,
  })
}

/**
 * POST /admin/admin-roles { email, role } — sets an admin's role, or the role an
 * invited person will have. Owners only. The last owner can't be demoted.
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const body = (req.body ?? {}) as { email?: string; role?: string }
  const email = String(body.email ?? "").trim().toLowerCase()
  const role = body.role as AdminRole
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Enter the admin's email" })
  if (!ADMIN_ROLES.includes(role)) return res.status(400).json({ message: `Role must be one of: ${ADMIN_ROLES.join(", ")}` })

  if (role !== "owner") {
    const current = await pg("admin_role").where("email", email).first("role")
    if (current?.role === "owner") {
      const owners = await pg("admin_role").where("role", "owner").count("email as n").first()
      if (Number(owners?.n ?? 0) <= 1) {
        return res.status(400).json({ message: "This is the only owner. Make someone else an owner first." })
      }
    }
  }

  await pg("admin_role")
    .insert({ email, role, updated_by: req.auth_context.actor_id, updated_at: new Date() })
    .onConflict("email")
    .merge()
  res.json({ email, role, label: ROLE_LABEL[role] })
}
