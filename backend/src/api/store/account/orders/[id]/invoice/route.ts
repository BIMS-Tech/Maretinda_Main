import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { issueOrderInvoice, sendInvoicePdf } from "../../../../../../lib/invoice"

/**
 * GET /store/account/orders/:id/invoice
 * The signed-in buyer downloads the invoice for one of their own orders.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const order = await pg("order").where({ id: req.params.id, customer_id: req.auth_context.actor_id }).first("id")
  if (!order) return res.status(404).json({ type: "not_found", message: "Order not found" })

  const invoice = await issueOrderInvoice(pg, order.id)
  if (!invoice) return res.status(404).json({ type: "not_found", message: "No invoice for this order yet" })
  sendInvoicePdf(res, invoice)
}
