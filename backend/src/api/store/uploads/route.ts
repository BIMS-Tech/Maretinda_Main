import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import multer from "multer"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { savePrivateDocument } from "../../../lib/private-documents"
import { fileMatchesDeclaredType } from "../../../lib/file-signature"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
]

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type: ${file.mimetype}`))
    }
    cb(null, true)
  },
})

export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const uploadMiddleware = upload.array("files", 1)

  uploadMiddleware(req as any, res as any, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message })
    }

    const files = req.files as Express.Multer.File[]
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    const file = files[0]
    if (!fileMatchesDeclaredType(file.buffer, file.mimetype)) {
      return res.status(400).json({ message: "File contents don't match its type" })
    }

    // Applicants' IDs and permits: kept private, see lib/private-documents
    const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const url = await savePrivateDocument(pg, {
      file_name: file.originalname.slice(0, 200),
      content_type: file.mimetype,
      content: file.buffer,
    })

    res.status(200).json({
      files: [{ url, name: file.originalname, size: file.size }],
    })
  })
}
