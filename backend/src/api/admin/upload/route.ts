/**
 * Admin Upload - Direct to Google Cloud Storage
 * Same as vendor upload but for admin panel
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import multer from "multer"
import { createGCSService, isImageFile, isDocumentFile } from "../../../utils/google-cloud-storage"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES = 10

const ALLOWED_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

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

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  console.log('[ADMIN-UPLOAD-GCS] Request received')
  
  const uploadMiddleware = upload.array('files', MAX_FILES)
  
  uploadMiddleware(req as any, res as any, async (err) => {
    if (err) {
      console.error('[ADMIN-UPLOAD-GCS] Upload error:', err)
      return res.status(400).json({ message: err.message })
    }

    const files = req.files as Express.Multer.File[]
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' })
    }

    const gcs = createGCSService()
    if (!gcs) {
      console.error('[ADMIN-UPLOAD-GCS] GCS not configured')
      return res.status(500).json({ message: 'Cloud storage not configured' })
    }

    console.log('[ADMIN-UPLOAD-GCS] Uploading', files.length, 'files to GCS...')

    // Upload all files to GCS in parallel
    const uploadPromises = files.map(async (file) => {
      try {
        const folder = isImageFile(file.mimetype) ? 'admin-uploads/images' :
                       isDocumentFile(file.mimetype) ? 'admin-uploads/documents' :
                       'admin-uploads/other'

        const result = await gcs.uploadFile(file.buffer, file.originalname, {
          folder,
          contentType: file.mimetype,
          metadata: {
            uploadedFrom: 'admin-panel',
            uploadedAt: new Date().toISOString()
          },
          makePublic: true,
          cacheControl: 'public, max-age=31536000'
        })

        if (result.success) {
          console.log('[ADMIN-UPLOAD-GCS] ✅', file.originalname, '→', result.fileName)
          return {
            success: true,
            file: {
              id: result.fileName,
              url: result.publicUrl,
              name: file.originalname,
              size: file.size,
              mime_type: file.mimetype
            }
          }
        } else {
          console.error('[ADMIN-UPLOAD-GCS] ❌', file.originalname, result.error)
          return { success: false, filename: file.originalname, error: result.error }
        }
      } catch (error) {
        console.error('[ADMIN-UPLOAD-GCS] Exception:', file.originalname, error)
        return {
          success: false,
          filename: file.originalname,
          error: error instanceof Error ? error.message : 'Upload failed'
        }
      }
    })

    const results = await Promise.all(uploadPromises)
    const uploadedFiles = results.filter(r => r.success).map(r => r.file!)

    console.log('[ADMIN-UPLOAD-GCS] Complete:', uploadedFiles.length, 'files uploaded')

    res.status(200).json({
      files: uploadedFiles
    })
  })
}

