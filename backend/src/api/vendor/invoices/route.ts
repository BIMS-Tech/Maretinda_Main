import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { listInvoices } from "../../../lib/invoice"
import { sellerIdOfMember } from "../../../lib/seller-ownership"

/**
 * GET /vendor/invoices?kind=order|platform
 * The shop's documents: the ones issued in its name for orders, and the ones
 * Maretinda issued to it (plan payments, monthly fees, credit notes).
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const sellerId = await sellerIdOfMember(pg, req.auth_context?.actor_id)
  if (!sellerId) return res.status(401).json({ message: "Unauthorized" })

  const kinds = req.query.kind === "order" ? ["order"] : req.query.kind === "platform" || req.query.kind === "subscription" ? ["subscription", "fees", "credit"] : undefined
  const limit = Number(req.query.limit) || 50
  const offset = Number(req.query.offset) || 0
  res.json({ ...(await listInvoices(pg, { seller_id: sellerId }, limit, offset, kinds)), limit, offset })
}
