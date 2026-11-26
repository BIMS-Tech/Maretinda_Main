import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { verifyInvoice } from "../../../../lib/invoice"

/**
 * GET /store/invoice-verify/:id — what the QR code on a document opens: that
 * it was issued through Maretinda, its number, issuer, date and total. Never
 * who it was sold to. Rate limited in middlewares.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const found = await verifyInvoice(pg, String(req.params.id))
  if (!found) return res.status(404).json({ type: "not_found", message: "No document with this code was issued through Maretinda." })
  res.json({ document: found })
}
