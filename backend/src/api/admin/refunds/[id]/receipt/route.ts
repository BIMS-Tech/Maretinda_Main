import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { readPrivateDocument } from "../../../../../lib/private-documents"

/** GET /admin/refunds/:id/receipt — the transfer receipt accounting attached. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const r = await pg("buyer_refund").where("id", req.params.id).first("receipt_id")
  const doc = r?.receipt_id ? await readPrivateDocument(pg, r.receipt_id) : null
  if (!doc) return res.status(404).json({ message: "No receipt" })
  res.setHeader("Content-Type", doc.content_type)
  res.setHeader("Cache-Control", "private, no-store")
  res.setHeader("Content-Disposition", `inline; filename="${String(doc.file_name).replace(/"/g, "")}"`)
  res.status(200).send(Buffer.from(doc.content))
}
