import multer from "multer"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { fileMatchesDeclaredType } from "../../../lib/file-signature"
import { savePrivateDocument } from "../../../lib/private-documents"

// "file", or "files" as the other upload routes take it
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } }).any()
const TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]

/** POST /admin/refund-receipts — a screenshot or PDF of a refund transfer, kept private. */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  upload(req as any, res as any, async (err: any) => {
    const file = (req as any).files?.[0]
    if (err || !file) return res.status(400).json({ message: "Upload one receipt, up to 10 MB." })
    if (!TYPES.includes(file.mimetype) || !fileMatchesDeclaredType(file.buffer, file.mimetype)) {
      return res.status(400).json({ message: "Use a JPG, PNG, WebP or PDF." })
    }
    const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const path = await savePrivateDocument(pg, { file_name: String(file.originalname).slice(0, 200), content_type: file.mimetype, content: file.buffer })
    res.status(201).json({ receipt_id: path.split("/").pop() })
  })
}
