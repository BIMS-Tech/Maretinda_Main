import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { listInvoices } from "../../../lib/invoice"
import { sellerIdOfMember } from "../../../lib/seller-ownership"

/**
 * GET /vendor/invoices?kind=order|subscription
 * The shop's invoices: the ones issued in its name for orders, and the ones
 * Maretinda issued to it for subscription payments.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const sellerId = await sellerIdOfMember(pg, req.auth_context?.actor_id)
  if (!sellerId) return res.status(401).json({ message: "Unauthorized" })

  const kind = req.query.kind === "order" || req.query.kind === "subscription" ? { kind: req.query.kind } : {}
  const limit = Number(req.query.limit) || 50
  const offset = Number(req.query.offset) || 0
  res.json({ ...(await listInvoices(pg, { seller_id: sellerId, ...kind }, limit, offset)), limit, offset })
}
