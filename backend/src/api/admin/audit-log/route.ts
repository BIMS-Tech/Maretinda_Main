import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/** GET /admin/audit-log?actor_id=&q=&limit=&offset= — every change made through the admin, newest first. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const q = req.query as Record<string, string>
  const limit = Math.min(Number(q.limit) || 50, 200)
  const offset = Number(q.offset) || 0
  const base = pg("admin_audit_log as a")
  if (q.actor_id) base.where("a.actor_id", q.actor_id)
  if (q.q) base.whereILike("a.path", `%${q.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`)
  const [entries, count] = await Promise.all([
    base
      .clone()
      .leftJoin("user as u", "u.id", "a.actor_id")
      .select("a.*", "u.email as actor_email")
      .orderBy("a.id", "desc")
      .limit(limit)
      .offset(offset),
    base.clone().count("a.id as count").first(),
  ])
  res.json({ entries, count: Number(count?.count ?? 0), limit, offset })
}
