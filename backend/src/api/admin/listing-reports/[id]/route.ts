import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { REPORT_STATUSES } from "../../../../lib/listing-reports"

/** POST /admin/listing-reports/:id { status, admin_note } — closes a report, or reopens it. */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as { status?: string; admin_note?: string }
  if (!(REPORT_STATUSES as readonly string[]).includes(body.status ?? "")) {
    return res.status(400).json({ message: "status must be open, resolved or dismissed" })
  }
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const closed = body.status !== "open"
  const [report] = await pg("listing_report")
    .where("id", req.params.id)
    .update({
      status: body.status,
      admin_note: body.admin_note?.toString().slice(0, 2000) ?? null,
      resolved_by: closed ? req.auth_context?.actor_id ?? null : null,
      resolved_at: closed ? new Date() : null,
    })
    .returning("*")
  if (!report) return res.status(404).json({ message: "Report not found" })
  res.json({ report })
}
