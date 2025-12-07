import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import multer from "multer"
import path from "path"
import fs from "fs"

// Configure multer for file uploads - same as admin panel
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "static")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.originalname}`
    cb(null, filename)
  }
})

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    const allowedMimes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ]
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'))
    }
  }
})

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    // Use multer middleware
    const uploadMiddleware = upload.array('files', 10) // Allow up to 10 files
    
    uploadMiddleware(req as any, res as any, (err) => {
      if (err) {
        console.error('Vendor upload error:', err)
        return res.status(400).json({ 
          message: err.message || 'Upload failed',
          error: err.message 
        })
      }

      const files = req.files as Express.Multer.File[]
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' })
      }

      // Generate response with file URLs - same format as admin panel
      const uploadedFiles = files.map(file => ({
        id: file.filename,
        url: `${process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'}/static/${file.filename}`,
        name: file.originalname,
        size: file.size,
        mime_type: file.mimetype
      }))

      res.status(200).json({
        files: uploadedFiles
      })
    })
  } catch (error) {
    console.error('Vendor upload endpoint error:', error)
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
