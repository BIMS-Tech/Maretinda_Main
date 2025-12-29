/**
 * Vendor Upload with Google Cloud Storage
 * 
 * Uses GCS for ALL files (images + documents)
 * 
 * Benefits:
 * - Cheaper than Cloudinary for large volumes
 * - Better for documents
 * - Unified storage solution
 * - Google CDN available
 * - 5GB free tier (first year)
 * 
 * To enable:
 * 1. Rename this file to route.ts (backup current route.ts)
 * 2. Install: npm install @google-cloud/storage
 * 3. Configure environment variables
 * 4. Uncomment code in google-cloud-storage.ts
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import multer from "multer"
import { verify } from "jsonwebtoken"
import { checkRateLimit } from "../../utils/rate-limiter"
import { createGCSService, isImageFile, isDocumentFile, isVideoFile } from "../../utils/google-cloud-storage"

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES = 10

const ALLOWED_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  // Videos (optional)
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo'
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
    if (!decoded.actor_id) {
      return { valid: false, error: 'Invalid token' }
    }
    return { valid: true, userId: decoded.actor_id }
  } catch (error) {
    return { valid: false, error: 'Invalid or expired token' }
  }
}

// Multer configuration (memory storage for GCS)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type: ${file.mimetype}`))
    }
    cb(null, true)
  }
})

// OPTIONS handler
export const OPTIONS = async (
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> => {
  setCorsHeaders(res)
  res.status(204).end()
}

// POST handler
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const startTime = Date.now()
  setCorsHeaders(res)
  
  try {
    // 1. Verify authentication
    const auth = verifyAuth(req)
    if (!auth.valid) {
      console.warn('[UPLOADS-VENDOR-GCS] Unauthorized access attempt')
      res.status(401).json({ 
        message: 'Unauthorized',
        error: auth.error 
      })
      return
    }

    console.log(`[UPLOADS-VENDOR-GCS] Authenticated request from user: ${auth.userId}`)
    
    // 2. Check rate limit
    const rateLimit = checkRateLimit(`upload:${auth.userId}`, {
      maxRequests: 10,
      windowMs: 60000
    })
    
    if (!rateLimit.allowed) {
      console.warn(`[UPLOADS-VENDOR-GCS] Rate limit exceeded for user: ${auth.userId}`)
      res.status(429).json({
        message: 'Too many uploads. Please try again later.',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(rateLimit.resetIn / 1000)
      })
      return
    }
    
    // 3. Initialize Google Cloud Storage
    const gcs = createGCSService()
    
    if (!gcs) {
      console.error('[UPLOADS-VENDOR-GCS] GCS not configured')
      res.status(500).json({
        message: 'Storage service not available',
        error: 'GCS_NOT_CONFIGURED'
      })
      return
    }
    
    // 4. Process upload with multer
    const uploadMiddleware = upload.array('files', MAX_FILES)
    
    uploadMiddleware(req as any, res as any, async (err) => {
      if (err) {
        console.error('[UPLOADS-VENDOR-GCS] Upload error:', {
          error: err.message,
          userId: auth.userId
        })
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ 
            message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
            error: 'FILE_TOO_LARGE'
          })
        }
        
        return res.status(400).json({ 
          message: err.message || 'Upload failed',
          error: 'UPLOAD_FAILED'
        })
      }

      const files = req.files as Express.Multer.File[]
      
      if (!files || files.length === 0) {
        return res.status(400).json({ 
          message: 'No files uploaded',
          error: 'NO_FILES'
        })
      }

      // 5. Upload all files to GCS IN PARALLEL (much faster!)
      console.log('[UPLOADS-VENDOR-GCS] Starting parallel upload of', files.length, 'files')
      
      const uploadPromises = files.map(async (file) => {
        try {
          // Determine folder based on file type
          let folder = 'vendor-uploads'
          if (isImageFile(file.mimetype)) {
            folder = 'vendor-uploads/images'
          } else if (isDocumentFile(file.mimetype)) {
            folder = 'vendor-uploads/documents'
          } else if (isVideoFile(file.mimetype)) {
            folder = 'vendor-uploads/videos'
          }

          console.log('[UPLOADS-VENDOR-GCS] Uploading:', file.originalname, `(${file.size} bytes)`)

          // Upload to GCS
          const result = await gcs.uploadFile(
            file.buffer,
            file.originalname,
            {
              folder,
              contentType: file.mimetype,
              metadata: {
                userId: auth.userId!,
                originalName: file.originalname,
                uploadedAt: new Date().toISOString()
              },
              makePublic: true,
              cacheControl: 'public, max-age=31536000'
            }
          )

          if (result.success) {
            console.log('[UPLOADS-VENDOR-GCS] ✅ Success:', result.fileName)
            return {
              success: true,
              file: {
                id: result.fileName,
                url: result.publicUrl,
                name: file.originalname,
                size: file.size,
                mime_type: file.mimetype,
                storage: 'gcs',
                bucket: result.bucket
              }
            }
          } else {
            console.error('[UPLOADS-VENDOR-GCS] ❌ Failed:', file.originalname, result.error)
            return {
              success: false,
              filename: file.originalname,
              error: result.error
            }
          }
        } catch (error) {
          console.error('[UPLOADS-VENDOR-GCS] ❌ Exception:', file.originalname, error)
          return {
            success: false,
            filename: file.originalname,
            error: error instanceof Error ? error.message : 'Upload failed'
          }
        }
      })

      // Wait for all uploads to complete in parallel
      const results = await Promise.all(uploadPromises)
      
      // Separate successful uploads from errors
      const uploadedFiles = results
        .filter(r => r.success)
        .map(r => r.file!)
      
      const errors = results
        .filter(r => !r.success)
        .map(r => ({ filename: r.filename!, error: r.error! }))

      // 6. Log results
      const uploadDuration = Date.now() - startTime
      console.log('[UPLOADS-VENDOR-GCS] Upload completed:', {
        userId: auth.userId,
        successful: uploadedFiles.length,
        failed: errors.length,
        duration: `${uploadDuration}ms`,
        totalSize: uploadedFiles.reduce((sum, f) => sum + f.size, 0)
      })

      // 7. Return response
      console.log('[UPLOADS-VENDOR-GCS] Sending response with', uploadedFiles.length, 'files')
      
      const response = {
        files: uploadedFiles,
        errors: errors.length > 0 ? errors : undefined,
        meta: {
          successful: uploadedFiles.length,
          failed: errors.length,
          totalSize: uploadedFiles.reduce((sum, f) => sum + f.size, 0)
        }
      }
      
      console.log('[UPLOADS-VENDOR-GCS] Response data:', JSON.stringify(response, null, 2))
      
      res.status(200).json(response)
      
      console.log('[UPLOADS-VENDOR-GCS] Response sent successfully')
    })
    
  } catch (error) {
    console.error('[UPLOADS-VENDOR-GCS] Unexpected error:', error)
    res.status(500).json({ 
      message: 'Internal server error',
      error: 'SERVER_ERROR'
    })
  }
}

