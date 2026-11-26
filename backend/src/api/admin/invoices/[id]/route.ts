import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { invoiceTotals, sendInvoicePdf } from "../../../../lib/invoice"

/**
 * GET /admin/invoices/:id — downloads any document as issued.
 * ?format=json gives its structured data instead (RMC 98-2026 wants every
 * e-invoice as data that converts to the BIR's JSON format).
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const invoice = await pg("invoice").where({ id: req.params.id }).first("id", "number", "document", "official", "corrects_id", "pdf", "data")
  if (!invoice) return res.status(404).json({ type: "not_found", message: "Invoice not found" })
  if (req.query.format === "json") {
    const credits = await pg("invoice").where("corrects_id", invoice.id).select("number", "total", "issued_at")
    const data = typeof invoice.data === "string" ? JSON.parse(invoice.data) : invoice.data
    res.setHeader("Content-Disposition", `attachment; filename="${invoice.number}.json"`)
    return res.json({ ...data, totals: invoiceTotals(data), credited_by: credits })
  }
  sendInvoicePdf(res, invoice)
}
