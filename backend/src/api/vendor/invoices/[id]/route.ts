import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sendInvoicePdf } from "../../../../lib/invoice"
import { sellerIdOfMember } from "../../../../lib/seller-ownership"

/** GET /vendor/invoices/:id — downloads one of the shop's own invoices. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const sellerId = await sellerIdOfMember(pg, req.auth_context?.actor_id)
  if (!sellerId) return res.status(401).json({ message: "Unauthorized" })

  const invoice = await pg("invoice").where({ id: req.params.id, seller_id: sellerId }).first("number", "pdf")
  if (!invoice) return res.status(404).json({ type: "not_found", message: "Invoice not found" })
  sendInvoicePdf(res, invoice)
}
