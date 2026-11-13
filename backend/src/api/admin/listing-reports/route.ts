import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { REPORT_STATUSES } from "../../../lib/listing-reports"

/** GET /admin/listing-reports?status=&limit=&offset= — buyers' reports of products and shops, newest first. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const q = req.query as Record<string, string>
  const limit = Math.min(Number(q.limit) || 50, 200)
  const offset = Number(q.offset) || 0
  const base = pg("listing_report as r")
  if ((REPORT_STATUSES as readonly string[]).includes(q.status)) base.where("r.status", q.status)
  const [reports, count, open] = await Promise.all([
    base
      .clone()
      .leftJoin("seller as s", "s.id", "r.seller_id")
      .select("r.*", "s.name as seller_name")
      .orderBy("r.id", "desc")
      .limit(limit)
      .offset(offset),
    base.clone().count("r.id as count").first(),
    pg("listing_report").where("status", "open").count("id as count").first(),
  ])
  res.json({ reports, count: Number(count?.count ?? 0), open: Number(open?.count ?? 0), limit, offset })
}
