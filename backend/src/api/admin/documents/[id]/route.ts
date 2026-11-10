import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { readPrivateDocument } from "../../../../lib/private-documents"

/** GET /admin/documents/:id — a seller applicant's document, for admins only. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const doc = await readPrivateDocument(req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION), req.params.id)
  if (!doc) return res.status(404).json({ message: "Document not found" })

  res.setHeader("Content-Type", doc.content_type)
  res.setHeader("Content-Disposition", `inline; filename="${doc.file_name.replace(/["\\\r\n]/g, "")}"`)
  res.setHeader("Cache-Control", "private, no-store")
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.send(Buffer.from(doc.content))
}
