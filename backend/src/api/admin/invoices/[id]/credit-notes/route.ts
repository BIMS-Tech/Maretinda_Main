import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { invoiceAttachment, issueCreditNote, parseCredit } from "../../../../../lib/invoice"
import { sendNotice } from "../../../../../lib/notify"

/**
 * POST /admin/invoices/:id/credit-notes  { amount, reason }
 * An issued document can't be changed or deleted, only reduced by a credit
 * note that points at it (RMC 98-2026). The shop gets it by email.
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const input = parseCredit(req.body)
  if (typeof input === "string") return res.status(400).json({ type: "invalid_data", message: input })
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const result = await issueCreditNote(pg, req.params.id, input)
  if ("error" in result) return res.status(400).json({ type: "not_allowed", message: result.error })

  const row = await pg("invoice").where("id", result.id).first("seller_id", "data")
  const seller = row?.seller_id ? await pg("seller").where("id", row.seller_id).first("name", "email") : null
  if (seller?.email) {
    const original = await pg("invoice").where("id", req.params.id).first("number")
    await sendNotice(req.scope, {
      to: seller.email,
      subject: `${result.official ? "Credit note" : "Billing adjustment"} ${result.number} from Maretinda`,
      eyebrow: "Billing",
      heading: result.official ? "A credit note for your shop" : "A billing adjustment for your shop",
      user_name: seller.name,
      paragraphs: [`We reduced ${original?.number ?? "an earlier document"} by ₱${input.amount.toFixed(2)}: ${input.reason}.`, "The document is attached to this email."],
      attachments: [invoiceAttachment(result)],
    })
  }
  res.status(201).json({ invoice: { id: result.id, number: result.number, document: result.document, total: result.total } })
}
