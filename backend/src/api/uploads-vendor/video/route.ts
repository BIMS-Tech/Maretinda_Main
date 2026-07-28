/**
 * Seller video upload — used by the Reels composer.
 *
 * Kept separate from /uploads-vendor because reels need a much larger size
 * limit (150 MB vs 10 MB) and must skip the WebP image pipeline. A poster
 * frame can be sent alongside the video in the same request; it is optimised
 * to WebP like any other image.
 *
 * Folder: seller-uploads/reels/{sellerId}/
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import multer from "multer"
import { verify } from "jsonwebtoken"
import { checkRateLimit } from "../../../utils/rate-limiter"
import { createGCSService, isVideoFile } from "../../../utils/google-cloud-storage"
import { optimizeImage } from "../../../utils/image-optimizer"

const MAX_FILE_SIZE = 150 * 1024 * 1024 // 150 MB
const MAX_FILES = 2 // video + optional poster frame

const ALLOWED_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]

const setCorsHeaders = (req: MedusaRequest, res: MedusaResponse) => {
  const allowedOrigins = (
    process.env.SELLER_CORS ||
    process.env.VENDOR_CORS ||
    "http://localhost:5173"
  )
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)
  const origin = req.headers.origin as string | undefined
  res.setHeader(
    "Access-Control-Allow-Origin",
    origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
  )
  res.setHeader("Access-Control-Allow-Credentials", "true")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-publishable-api-key")
}

const verifyAuth = (req: MedusaRequest): { valid: boolean; userId?: string; error?: string } => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith("Bearer ")) {
    return { valid: false, error: "No authorization token provided" }
  }
  try {
    const decoded = verify(authHeader.substring(7), process.env.JWT_SECRET || "supersecret") as any
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

export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  setCorsHeaders(req, res)
  res.status(204).end()
}

export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  setCorsHeaders(req, res)

  try {
    const auth = verifyAuth(req)
    if (!auth.valid) {
      res.status(401).json({ message: "Unauthorized", error: auth.error })
      return
    }

    const rateLimit = checkRateLimit(`upload-video:${auth.userId}`, {
      maxRequests: 10,
      windowMs: 60000,
    })
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

    upload.array("files", MAX_FILES)(req as any, res as any, async (err) => {
      if (err) {
        if ((err as any).code === "LIMIT_FILE_SIZE") {
          return res
            .status(413)
            .json({ message: `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB` })
        }
        return res.status(400).json({ message: err.message })
      }

      const files = req.files as Express.Multer.File[]
      if (!files?.length) {
        return res.status(400).json({ message: "No files uploaded" })
      }

      const sellerId = (req.body as any)?.seller_id as string | undefined
      const folder = sellerId ? `seller-uploads/reels/${sellerId}` : "seller-uploads/reels"

      const results = await Promise.all(
        files.map(async (file) => {
          try {
            let buffer = file.buffer
            let contentType = file.mimetype
            let filename = file.originalname

            // Poster frames go through the image pipeline; videos are stored as-is.
            if (!isVideoFile(file.mimetype)) {
              const optimized = await optimizeImage(buffer, {
                maxWidth: 1080,
                maxHeight: 1920,
                quality: 82,
                format: "webp",
              })
              buffer = optimized.buffer
              contentType = optimized.contentType
              filename = filename.replace(/\.[^.]+$/, "") + ".webp"
            }

            const result = await gcs.uploadFile(buffer, filename, {
              folder,
              contentType,
              metadata: {
                userId: auth.userId!,
                originalName: file.originalname,
                kind: isVideoFile(file.mimetype) ? "reel-video" : "reel-poster",
              },
              makePublic: true,
              cacheControl: "public, max-age=31536000",
            })

            if (result.success) {
              return {
                success: true as const,
                file: {
                  id: result.fileName,
                  url: result.publicUrl,
                  name: file.originalname,
                  size: buffer.length,
                  mime_type: contentType,
                  kind: isVideoFile(file.mimetype) ? "video" : "poster",
                  storage: "gcs",
                },
              }
            }
            return { success: false as const, filename: file.originalname, error: result.error }
          } catch (error) {
            return {
              success: false as const,
              filename: file.originalname,
              error: error instanceof Error ? error.message : "Upload failed",
            }
          }
        })
      )

      const uploaded = results.filter((r) => r.success).map((r: any) => r.file)
      const errors = results
        .filter((r) => !r.success)
        .map((r: any) => ({ filename: r.filename, error: r.error }))

      res.status(200).json({
        files: uploaded,
        video: uploaded.find((f: any) => f.kind === "video") || null,
        poster: uploaded.find((f: any) => f.kind === "poster") || null,
        errors: errors.length ? errors : undefined,
      })
    })
  } catch (error) {
    console.error("[uploads-vendor/video] Unexpected error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}
