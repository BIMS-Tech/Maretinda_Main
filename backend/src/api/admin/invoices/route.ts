import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { listInvoices } from "../../../lib/invoice"

/** GET /admin/invoices?kind=&seller_id= — every invoice issued on the marketplace. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const where: Record<string, unknown> = {}
  if (req.query.kind === "order" || req.query.kind === "subscription") where.kind = req.query.kind
  if (typeof req.query.seller_id === "string" && req.query.seller_id) where.seller_id = req.query.seller_id
  const limit = Number(req.query.limit) || 50
  const offset = Number(req.query.offset) || 0
  res.json({ ...(await listInvoices(pg, where, limit, offset)), limit, offset })
}
