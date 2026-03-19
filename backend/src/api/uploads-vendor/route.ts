/**
 * Vendor Upload — GCS with WebP optimization
 * - Accepts images/documents via multipart
 * - Converts images to WebP (quality 85, max 2048px) before GCS upload
 * - Returns permanent public GCS URLs
 * - Folder: vendor-uploads/images/{vendorId}/ or vendor-uploads/documents/
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import multer from "multer"
import { verify } from "jsonwebtoken"
import { checkRateLimit } from "../../utils/rate-limiter"
import { createGCSService, isImageFile, isDocumentFile } from "../../utils/google-cloud-storage"
import { optimizeImage } from "../../utils/image-optimizer"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const MAX_FILES = 10

const ALLOWED_TYPES = [
  "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain", "text/csv",
]

const setCorsHeaders = (res: MedusaResponse) => {
  const allowedOrigins = (process.env.VENDOR_CORS || "http://localhost:5173").split(",")
  res.setHeader("Access-Control-Allow-Origin", allowedOrigins[0].trim())
  res.setHeader("Access-Control-Allow-Credentials", "true")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-publishable-api-key")
}

const verifyAuth = (req: MedusaRequest): { valid: boolean; userId?: string; error?: string } => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith("Bearer ")) {
    return { valid: false, error: "No authorization token provided" }
  }
  const token = authHeader.substring(7)
  try {
    const decoded = verify(token, process.env.JWT_SECRET || "supersecret") as any
    if (!decoded.actor_id) return { valid: false, error: "Invalid token" }
    return { valid: true, userId: decoded.actor_id }
  } catch {
    return { valid: false, error: "Invalid or expired token" }
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type: ${file.mimetype}`))
    }
    cb(null, true)
  },
})

export const OPTIONS = async (_req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  setCorsHeaders(res)
  res.status(204).end()
}

export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const startTime = Date.now()
  setCorsHeaders(res)

  try {
    const auth = verifyAuth(req)
    if (!auth.valid) {
      res.status(401).json({ message: "Unauthorized", error: auth.error })
      return
    }

    const rateLimit = checkRateLimit(`upload:${auth.userId}`, { maxRequests: 10, windowMs: 60000 })
    if (!rateLimit.allowed) {
      res.status(429).json({
        message: "Too many uploads",
        error: "RATE_LIMIT_EXCEEDED",
        retryAfter: Math.ceil(rateLimit.resetIn / 1000),
      })
      return
    }

    const gcs = createGCSService()
    if (!gcs) {
      res.status(500).json({ message: "Cloud storage not configured", error: "GCS_NOT_CONFIGURED" })
      return
    }

    const uploadMiddleware = upload.array("files", MAX_FILES)

    uploadMiddleware(req as any, res as any, async (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({ message: `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB` })
        }
        return res.status(400).json({ message: err.message })
      }

      const files = req.files as Express.Multer.File[]
      if (!files?.length) {
        return res.status(400).json({ message: "No files uploaded" })
      }

      // Extract vendorId hint from body (optional, for folder organisation)
      const vendorId = (req.body as any)?.vendor_id as string | undefined

      const uploadPromises = files.map(async (file) => {
        try {
          let buffer = file.buffer
          let contentType = file.mimetype
          let filenameForGCS = file.originalname

          // Optimize images → WebP
          if (isImageFile(file.mimetype) && file.mimetype !== "image/svg+xml") {
            const optimized = await optimizeImage(buffer, {
              maxWidth: 2048,
              maxHeight: 2048,
              quality: 85,
              format: "webp",
            })
            buffer = optimized.buffer
            contentType = optimized.contentType
            // Replace extension with .webp
            filenameForGCS = filenameForGCS.replace(/\.[^.]+$/, "") + ".webp"

            console.log(
              `[uploads-vendor] Optimized ${file.originalname}: ` +
              `${(optimized.originalSize / 1024).toFixed(0)}KB → ${(optimized.optimizedSize / 1024).toFixed(0)}KB WebP`
            )
          }

          // Build folder path
          const folder = isImageFile(file.mimetype)
            ? vendorId
              ? `vendor-uploads/images/${vendorId}`
              : "vendor-uploads/images"
            : isDocumentFile(file.mimetype)
            ? "vendor-uploads/documents"
            : "vendor-uploads/other"

          const result = await gcs.uploadFile(buffer, filenameForGCS, {
            folder,
            contentType,
            metadata: {
              userId: auth.userId!,
              originalName: file.originalname,
              uploadedAt: new Date().toISOString(),
            },
            makePublic: true,
            cacheControl: "public, max-age=31536000",
          })

          if (result.success) {
            return {
              success: true,
              file: {
                id: result.fileName,
                url: result.publicUrl,
                name: file.originalname,
                size: buffer.length,
                mime_type: contentType,
                storage: "gcs",
              },
            }
          }
          return { success: false, filename: file.originalname, error: result.error }
        } catch (error) {
          return {
            success: false,
            filename: file.originalname,
            error: error instanceof Error ? error.message : "Upload failed",
          }
        }
      })

      const results = await Promise.all(uploadPromises)
      const uploadedFiles = results.filter((r) => r.success).map((r) => r.file!)
      const errors = results.filter((r) => !r.success).map((r) => ({ filename: r.filename!, error: r.error! }))

      const duration = Date.now() - startTime
      console.log("[uploads-vendor] Complete:", { successful: uploadedFiles.length, failed: errors.length, duration: `${duration}ms` })

      res.status(200).json({
        files: uploadedFiles,
        errors: errors.length > 0 ? errors : undefined,
        meta: {
          successful: uploadedFiles.length,
          failed: errors.length,
          totalSize: uploadedFiles.reduce((sum, f) => sum + f.size, 0),
          duration,
        },
      })
    })
  } catch (error) {
    console.error("[uploads-vendor] Unexpected error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}
