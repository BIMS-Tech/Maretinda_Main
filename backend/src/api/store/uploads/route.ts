import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import multer from "multer"
import { createGCSService } from "../../../utils/google-cloud-storage"

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

    const gcs = createGCSService()
    if (!gcs) {
      return res.status(500).json({ message: "Cloud storage not configured" })
    }

    const file = files[0]
    const result = await gcs.uploadFile(file.buffer, file.originalname, {
      folder: "seller-application-docs",
      contentType: file.mimetype,
      metadata: { uploadedAt: new Date().toISOString() },
      makePublic: true,
      cacheControl: "public, max-age=31536000",
    })

    if (!result.success) {
      return res.status(500).json({ message: result.error || "Upload failed" })
    }

    res.status(200).json({
      files: [{ url: result.publicUrl, name: file.originalname, size: file.size }],
    })
  })
}
