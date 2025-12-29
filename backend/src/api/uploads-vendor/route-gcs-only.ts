/**
 * Direct Google Cloud Storage Upload
 * 
 * SIMPLE APPROACH:
 * - Upload directly to GCS (no local storage)
 * - Return GCS URL immediately
 * - Show loading state in frontend
 * - No cleanup needed
 * - No disk space issues
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import multer from "multer"
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

// Multer with memory storage (upload to GCS directly)
const upload = multer({ 
  storage: multer.memoryStorage(),
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
    
    // 3. Check GCS is configured
    const gcs = createGCSService()
    if (!gcs) {
      console.error('[UPLOADS-GCS-DIRECT] GCS not configured')
      res.status(500).json({
        message: 'Cloud storage not configured',
        error: 'GCS_NOT_CONFIGURED'
      })
      return
    }
    
    // 4. Process upload with multer
    const uploadMiddleware = upload.array('files', MAX_FILES)
    
    uploadMiddleware(req as any, res as any, async (err) => {
      if (err) {
        console.error('[UPLOADS-GCS-DIRECT] Upload error:', err.message)
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ message: `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB` })
        }
        return res.status(400).json({ message: err.message })
      }

      const files = req.files as Express.Multer.File[]
      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' })
      }

      console.log('[UPLOADS-GCS-DIRECT] Uploading', files.length, 'files to GCS...')

      // 5. Upload ALL files to GCS in parallel
      const uploadPromises = files.map(async (file) => {
        try {
          // Determine folder based on file type
          const folder = isImageFile(file.mimetype) ? 'vendor-uploads/images' :
                         isDocumentFile(file.mimetype) ? 'vendor-uploads/documents' :
                         'vendor-uploads/other'

          const result = await gcs.uploadFile(file.buffer, file.originalname, {
            folder,
            contentType: file.mimetype,
            metadata: {
              userId: auth.userId!,
              uploadedAt: new Date().toISOString()
            },
            makePublic: true,
            cacheControl: 'public, max-age=31536000'
          })

          if (result.success) {
            return {
              success: true,
              file: {
                id: result.fileName,
                url: result.publicUrl,
                name: file.originalname,
                size: file.size,
                mime_type: file.mimetype,
                storage: 'gcs'
              }
            }
          } else {
            console.error('[UPLOADS-GCS-DIRECT] Failed:', file.originalname, result.error)
            return {
              success: false,
              filename: file.originalname,
              error: result.error
            }
          }
        } catch (error) {
          console.error('[UPLOADS-GCS-DIRECT] Exception:', file.originalname, error)
          return {
            success: false,
            filename: file.originalname,
            error: error instanceof Error ? error.message : 'Upload failed'
          }
        }
      })

      // Wait for all uploads
      const results = await Promise.all(uploadPromises)
      
      const uploadedFiles = results.filter(r => r.success).map(r => r.file!)
      const errors = results.filter(r => !r.success).map(r => ({ 
        filename: r.filename!, 
        error: r.error! 
      }))

      const duration = Date.now() - startTime
      console.log('[UPLOADS-GCS-DIRECT] Complete:', {
        successful: uploadedFiles.length,
        failed: errors.length,
        duration: `${duration}ms`
      })

      res.status(200).json({
        files: uploadedFiles,
        errors: errors.length > 0 ? errors : undefined,
        meta: {
          successful: uploadedFiles.length,
          failed: errors.length,
          totalSize: uploadedFiles.reduce((sum, f) => sum + f.size, 0),
          duration
        }
      })
    })
    
  } catch (error) {
    console.error('[UPLOADS-GCS-DIRECT] Unexpected error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}


