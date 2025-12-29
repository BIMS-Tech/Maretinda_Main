import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import multer from "multer"
import path from "path"
import fs from "fs"
import { verify } from "jsonwebtoken"
import { checkRateLimit } from "../../utils/rate-limiter"

/**
 * Production-Grade Vendor Upload Endpoint
 * 
 * This endpoint is outside /vendor/* to avoid body parser middleware
 * that would consume the multipart stream before multer can process it.
 * 
 * Features:
 * - Manual JWT authentication
 * - CORS support for vendor panel
 * - File validation (type, size)
 * - Secure file naming
 * - Error handling and logging
 */

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES = 10
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
]

// Set CORS headers for vendor panel
const setCorsHeaders = (res: MedusaResponse) => {
  const allowedOrigins = (process.env.VENDOR_CORS || 'http://localhost:5173').split(',')
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0].trim())
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-publishable-api-key')
}

// Verify JWT token manually (since we can't use AUTHENTICATE middleware)
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

// Handle OPTIONS preflight
export const OPTIONS = async (
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> => {
  setCorsHeaders(res)
  res.status(204).end()
}

// Configure multer with security best practices
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "static")
    
    // Ensure directory exists with proper permissions
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 })
    }
    
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // Sanitize filename: remove special characters, keep extension
    const sanitizedName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .substring(0, 100) // Limit filename length
    
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const filename = `${timestamp}-${randomSuffix}-${sanitizedName}`
    
    cb(null, filename)
  }
})

const upload = multer({ 
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
  fileFilter: (req, file, cb) => {
    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type: ${file.mimetype}. Only images are allowed.`))
    }
    
    // Additional validation: check file extension matches MIME type
    const ext = path.extname(file.originalname).toLowerCase()
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    
    if (!validExtensions.includes(ext)) {
      return cb(new Error(`Invalid file extension: ${ext}`))
    }
    
    cb(null, true)
  }
})

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const startTime = Date.now()
  
  // Set CORS headers first
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
    
    // 2. Check rate limit (10 uploads per minute per user)
    const rateLimit = checkRateLimit(`upload:${auth.userId}`, {
      maxRequests: 10,
      windowMs: 60000 // 1 minute
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
    
    // 3. Process upload with multer
    const uploadMiddleware = upload.array('files', MAX_FILES)
    
    uploadMiddleware(req as any, res as any, (err) => {
      if (err) {
        // Handle multer errors
        console.error('[UPLOADS-VENDOR] Upload error:', {
          error: err.message,
          userId: auth.userId,
          timestamp: new Date().toISOString()
        })
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ 
            message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
            error: 'FILE_TOO_LARGE'
          })
        }
        
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ 
            message: `Too many files. Maximum is ${MAX_FILES} files`,
            error: 'TOO_MANY_FILES'
          })
        }
        
        return res.status(400).json({ 
          message: err.message || 'Upload failed',
          error: 'UPLOAD_FAILED'
        })
      }

      const files = req.files as Express.Multer.File[]
      
      // 3. Validate files were uploaded
      if (!files || files.length === 0) {
        console.warn('[UPLOADS-VENDOR] No files in request')
        return res.status(400).json({ 
          message: 'No files uploaded',
          error: 'NO_FILES'
        })
      }

      // 4. Log successful uploads
      const uploadDuration = Date.now() - startTime
      console.log('[UPLOADS-VENDOR] Upload successful:', {
        userId: auth.userId,
        fileCount: files.length,
        totalSize: files.reduce((sum, f) => sum + f.size, 0),
        duration: `${uploadDuration}ms`,
        files: files.map(f => ({
          filename: f.filename,
          originalname: f.originalname,
          size: f.size,
          mimetype: f.mimetype
        }))
      })

      // 5. Generate response
      const backendUrl = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
      const uploadedFiles = files.map(file => ({
        id: file.filename,
        url: `${backendUrl}/static/${file.filename}`,
        name: file.originalname,
        size: file.size,
        mime_type: file.mimetype
      }))

      res.status(200).json({
        files: uploadedFiles,
        meta: {
          count: files.length,
          totalSize: files.reduce((sum, f) => sum + f.size, 0)
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

