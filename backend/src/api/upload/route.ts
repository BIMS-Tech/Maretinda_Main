import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import multer from "multer"
import { createGCSService } from "../../utils/google-cloud-storage"
import { optimizeImage } from "../../utils/image-optimizer"

const ALLOWED_MIMES = [
  "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml",
]

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) return cb(null, true)
    cb(new Error("Invalid file type. Only images are allowed."))
  },
})

export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const gcs = createGCSService()
    if (!gcs) {
      return res.status(500).json({ message: "Cloud storage not configured" }) as any
    }

    const uploadMiddleware = upload.array("files", 10)

    uploadMiddleware(req as any, res as any, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message || "Upload failed" })
      }

      const files = req.files as Express.Multer.File[]
      if (!files?.length) {
        return res.status(400).json({ message: "No files uploaded" })
      }

      const uploadPromises = files.map(async (file) => {
        let buffer = file.buffer
        let contentType = file.mimetype
        let filename = file.originalname

        // Optimize images to WebP
        if (file.mimetype !== "image/svg+xml") {
          const optimized = await optimizeImage(buffer, { format: "webp", quality: 85 })
          buffer = optimized.buffer
          contentType = optimized.contentType
          filename = filename.replace(/\.[^.]+$/, "") + ".webp"
        }

        const result = await gcs.uploadFile(buffer, filename, {
          folder: "uploads/images",
          contentType,
          makePublic: true,
          cacheControl: "public, max-age=31536000",
        })

        if (!result.success) throw new Error(result.error || "Upload failed")

        return {
          id: result.fileName!,
          url: result.publicUrl!,
          name: file.originalname,
          size: buffer.length,
          mime_type: contentType,
        }
      })

      try {
        const uploadedFiles = await Promise.all(uploadPromises)
        res.status(200).json({ files: uploadedFiles })
      } catch (uploadErr) {
        res.status(500).json({ message: uploadErr instanceof Error ? uploadErr.message : "Upload failed" })
      }
    })
  } catch (error) {
    res.status(500).json({ message: "Internal server error" })
  }
}
