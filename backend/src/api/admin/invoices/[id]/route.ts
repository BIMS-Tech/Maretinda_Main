import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sendInvoicePdf } from "../../../../lib/invoice"

/** GET /admin/invoices/:id — downloads any invoice. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const invoice = await pg("invoice").where({ id: req.params.id }).first("number", "pdf")
  if (!invoice) return res.status(404).json({ type: "not_found", message: "Invoice not found" })
  sendInvoicePdf(res, invoice)
}
