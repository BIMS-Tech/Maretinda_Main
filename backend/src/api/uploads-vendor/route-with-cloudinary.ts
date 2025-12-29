/**
 * Enhanced Vendor Upload with Cloudinary Integration
 * 
 * This version routes:
 * - Images → Cloudinary (with CDN, optimization, transformations)
 * - Documents → Local storage (or S3 for production)
 * 
 * To enable:
 * 1. Rename this file to route.ts (backup current route.ts)
 * 2. Install: npm install cloudinary
 * 3. Configure environment variables
 * 4. Uncomment cloudinary code in cloudinary-storage.ts
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import multer from "multer"
import path from "path"
import fs from "fs"
import { verify } from "jsonwebtoken"
import { checkRateLimit } from "../../utils/rate-limiter"
import { 
  createCloudinaryService, 
  isImageFile, 
  isDocumentFile 
} from "../../utils/cloudinary-storage"

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES = 10
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
]
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
]

// Set CORS headers
const setCorsHeaders = (res: MedusaResponse) => {
  const allowedOrigins = (process.env.VENDOR_CORS || 'http://localhost:5173').split(',')
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0].trim())
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-publishable-api-key')
}

// Verify JWT token
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
      return { valid: false, error: 'Invalid token: no actor_id' }
    }

    return { valid: true, userId: decoded.actor_id }
  } catch (error) {
    return { valid: false, error: 'Invalid or expired token' }
  }
}

// Configure multer for memory storage (for Cloudinary)
const upload = multer({ 
  storage: multer.memoryStorage(), // Store in memory to upload to Cloudinary
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
  fileFilter: (req, file, cb) => {
    const allAllowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]
    
    if (!allAllowedTypes.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type: ${file.mimetype}`))
    }
    
    cb(null, true)
  }
})

// Handle OPTIONS preflight
export const OPTIONS = async (
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> => {
  setCorsHeaders(res)
  res.status(204).end()
}

// Main upload handler
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
      console.warn('[UPLOADS-VENDOR] Unauthorized access attempt')
      res.status(401).json({ 
        message: 'Unauthorized',
        error: auth.error 
      })
      return
    }

    console.log(`[UPLOADS-VENDOR] Authenticated request from user: ${auth.userId}`)
    
    // 2. Check rate limit
    const rateLimit = checkRateLimit(`upload:${auth.userId}`, {
      maxRequests: 10,
      windowMs: 60000
    })
    
    if (!rateLimit.allowed) {
      console.warn(`[UPLOADS-VENDOR] Rate limit exceeded for user: ${auth.userId}`)
      res.status(429).json({
        message: 'Too many uploads. Please try again later.',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(rateLimit.resetIn / 1000)
      })
      return
    }
    
    // 3. Initialize Cloudinary (if configured)
    const cloudinary = createCloudinaryService()
    
    // 4. Process upload with multer
    const uploadMiddleware = upload.array('files', MAX_FILES)
    
    uploadMiddleware(req as any, res as any, async (err) => {
      if (err) {
        console.error('[UPLOADS-VENDOR] Upload error:', {
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

      // 5. Process each file based on type
      const uploadedFiles: any[] = []
      const errors: any[] = []

      for (const file of files) {
        try {
          if (isImageFile(file.mimetype)) {
            // Upload image to Cloudinary
            if (cloudinary) {
              const result = await cloudinary.uploadImage(
                file.buffer,
                file.originalname,
                {
                  folder: 'vendor-uploads',
                  tags: ['vendor', auth.userId!],
                  context: {
                    user_id: auth.userId!,
                    original_name: file.originalname
                  }
                }
              )

              if (result.success) {
                uploadedFiles.push({
                  id: result.publicId,
                  url: result.secureUrl,
                  name: file.originalname,
                  size: file.size,
                  mime_type: file.mimetype,
                  width: result.width,
                  height: result.height,
                  format: result.format,
                  storage: 'cloudinary'
                })
              } else {
                errors.push({
                  filename: file.originalname,
                  error: result.error
                })
              }
            } else {
              // Fallback to local storage if Cloudinary not configured
              const filename = await saveToLocal(file)
              const backendUrl = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
              
              uploadedFiles.push({
                id: filename,
                url: `${backendUrl}/static/${filename}`,
                name: file.originalname,
                size: file.size,
                mime_type: file.mimetype,
                storage: 'local'
              })
            }
          } else if (isDocumentFile(file.mimetype)) {
            // Save documents to local storage
            const filename = await saveToLocal(file)
            const backendUrl = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
            
            uploadedFiles.push({
              id: filename,
              url: `${backendUrl}/static/${filename}`,
              name: file.originalname,
              size: file.size,
              mime_type: file.mimetype,
              storage: 'local'
            })
          } else {
            errors.push({
              filename: file.originalname,
              error: 'Unsupported file type'
            })
          }
        } catch (error) {
          errors.push({
            filename: file.originalname,
            error: error instanceof Error ? error.message : 'Upload failed'
          })
        }
      }

      // 6. Log results
      const uploadDuration = Date.now() - startTime
      console.log('[UPLOADS-VENDOR] Upload completed:', {
        userId: auth.userId,
        successful: uploadedFiles.length,
        failed: errors.length,
        duration: `${uploadDuration}ms`
      })

      // 7. Return response
      res.status(200).json({
        files: uploadedFiles,
        errors: errors.length > 0 ? errors : undefined,
        meta: {
          successful: uploadedFiles.length,
          failed: errors.length,
          totalSize: uploadedFiles.reduce((sum, f) => sum + f.size, 0)
        }
      })
    })
    
  } catch (error) {
    console.error('[UPLOADS-VENDOR] Unexpected error:', error)
    res.status(500).json({ 
      message: 'Internal server error',
      error: 'SERVER_ERROR'
    })
  }
}

// Helper: Save file to local storage
async function saveToLocal(file: Express.Multer.File): Promise<string> {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const sanitizedName = file.originalname
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 100)
  
  const filename = `${timestamp}-${randomSuffix}-${sanitizedName}`
  const uploadDir = path.join(process.cwd(), "static")
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 })
  }
  
  const filePath = path.join(uploadDir, filename)
  fs.writeFileSync(filePath, file.buffer)
  
  return filename
}

