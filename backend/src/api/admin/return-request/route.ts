import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { RETURN_REQUEST_FIELDS, forAdmin } from "./helpers"

const STATUSES = ["pending", "refunded", "withdrawn", "escalated", "canceled"]

/**
 * GET /admin/return-request?status=escalated&limit=20&offset=0
 * Buyers' return requests, newest first. Escalated ones are the seller
 * handing the decision to Maretinda.
 */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const status = String(req.query.status ?? "")
  const take = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
  const skip = Math.max(Number(req.query.offset) || 0, 0)

  const { data, metadata } = await query.graph({
    entity: "order_return_request",
    fields: RETURN_REQUEST_FIELDS,
    filters: (STATUSES.includes(status) ? { status } : {}) as any,
    pagination: { skip, take, order: { created_at: "DESC" } },
  })

  res.json({ order_return_request: data.map(forAdmin), count: metadata?.count ?? data.length, offset: skip, limit: take })
}
