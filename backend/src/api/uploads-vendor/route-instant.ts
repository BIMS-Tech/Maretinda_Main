/**
 * INSTANT Upload with Background GCS Sync
 * 
 * Strategy:
 * 1. Save to local storage FIRST (instant response)
 * 2. Return local URL immediately
 * 3. Upload to GCS in background
 * 4. Update database with GCS URL when done
 * 
 * Benefits:
 * - Instant response (< 200ms)
 * - No waiting for cloud upload
 * - Fallback to local if GCS fails
 * - Best user experience
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import multer from "multer"
import path from "path"
import fs from "fs"
import { verify } from "jsonwebtoken"
import { checkRateLimit } from "../../utils/rate-limiter"
import { createGCSService, isImageFile, isDocumentFile } from "../../utils/google-cloud-storage"

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES = 10

const ALLOWED_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv'
]

// CORS headers
const setCorsHeaders = (res: MedusaResponse) => {
  const allowedOrigins = (process.env.VENDOR_CORS || 'http://localhost:5173').split(',')
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0].trim())
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-publishable-api-key')
}

// JWT verification
const verifyAuth = (req: MedusaRequest): { valid: boolean; userId?: string; error?: string } => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'No authorization token provided' }
  }
  const token = authHeader.substring(7)
  const jwtSecret = process.env.JWT_SECRET || 'supersecret'
  try {
    const decoded = verify(token, jwtSecret) as any
    if (!decoded.actor_id) return { valid: false, error: 'Invalid token' }
    return { valid: true, userId: decoded.actor_id }
  } catch (error) {
    return { valid: false, error: 'Invalid or expired token' }
  }
}

// Multer for local storage (instant save)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "static")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 100)
    cb(null, `${timestamp}-${randomSuffix}-${sanitized}`)
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type: ${file.mimetype}`))
    }
    cb(null, true)
  }
})

// OPTIONS handler
export const OPTIONS = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  setCorsHeaders(res)
  res.status(204).end()
}

// POST handler
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const startTime = Date.now()
  setCorsHeaders(res)
  
  try {
    // 1. Verify authentication
    const auth = verifyAuth(req)
    if (!auth.valid) {
      res.status(401).json({ message: 'Unauthorized', error: auth.error })
      return
    }

    // 2. Check rate limit
    const rateLimit = checkRateLimit(`upload:${auth.userId}`, { maxRequests: 10, windowMs: 60000 })
    if (!rateLimit.allowed) {
      res.status(429).json({
        message: 'Too many uploads',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(rateLimit.resetIn / 1000)
      })
      return
    }
    
    // 3. Process upload with multer (saves to local disk INSTANTLY)
    const uploadMiddleware = upload.array('files', MAX_FILES)
    
    uploadMiddleware(req as any, res as any, async (err) => {
      if (err) {
        console.error('[UPLOADS-INSTANT] Upload error:', err.message)
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ message: `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB` })
        }
        return res.status(400).json({ message: err.message })
      }

      const files = req.files as Express.Multer.File[]
      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' })
      }

      // 4. Generate local URLs and return IMMEDIATELY
      const backendUrl = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
      const uploadedFiles = files.map(file => ({
        id: file.filename,
        url: `${backendUrl}/static/${file.filename}`,
        name: file.originalname,
        size: file.size,
        mime_type: file.mimetype,
        storage: 'local' // Will be 'gcs' after background sync
      }))

      const duration = Date.now() - startTime
      console.log('[UPLOADS-INSTANT] ✅ Instant response:', {
        userId: auth.userId,
        files: uploadedFiles.length,
        duration: `${duration}ms`
      })

      // 5. Send response IMMEDIATELY (user sees instant update!)
      res.status(200).json({
        files: uploadedFiles,
        meta: {
          successful: uploadedFiles.length,
          failed: 0,
          totalSize: files.reduce((sum, f) => sum + f.size, 0)
        }
      })

      // 6. Upload to GCS in BACKGROUND (don't wait for this!)
      const gcs = createGCSService()
      if (gcs) {
        // Fire and forget - upload to GCS without blocking response
        setImmediate(async () => {
          for (const file of files) {
            try {
              const buffer = fs.readFileSync(file.path)
              const folder = isImageFile(file.mimetype) ? 'vendor-uploads/images' : 'vendor-uploads/documents'
              
              const result = await gcs.uploadFile(buffer, file.originalname, {
                folder,
                contentType: file.mimetype,
                metadata: { userId: auth.userId! },
                makePublic: true
              })

              if (result.success) {
                console.log('[UPLOADS-INSTANT] Background GCS upload success:', result.fileName)
                // TODO: Update database to replace local URL with GCS URL
                // This can be done via a workflow or separate API call
              } else {
                console.warn('[UPLOADS-INSTANT] Background GCS upload failed:', result.error)
                // File stays in local storage as fallback
              }
            } catch (error) {
              console.error('[UPLOADS-INSTANT] Background upload error:', error)
            }
          }
        })
      }
    })
    
  } catch (error) {
    console.error('[UPLOADS-INSTANT] Unexpected error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}


