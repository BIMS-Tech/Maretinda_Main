import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { imageUploadService } from "../../../services/image-upload"

/**
 * Production-grade vendor upload endpoint with image optimization
 * 
 * Features:
 * - Image optimization and compression
 * - Automatic resizing
 * - Thumbnail generation
 * - Multiple storage provider support (local, S3, Spaces)
 * - Format conversion
 */

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    // Files are already processed by multer middleware from middlewares.ts
    const files = req.files as Express.Multer.File[]
    
    console.log('Vendor upload - received files:', files?.length)
    
    if (!files || files.length === 0) {
      console.log('Vendor upload - no files received')
      return res.status(400).json({ message: 'No files uploaded' })
    }

    // Get upload options from query params or use defaults
    const options = {
      maxWidth: parseInt(req.query.maxWidth as string) || 2048,
      maxHeight: parseInt(req.query.maxHeight as string) || 2048,
      quality: parseInt(req.query.quality as string) || 85,
      generateThumbnail: req.query.thumbnail === 'true',
      thumbnailWidth: parseInt(req.query.thumbWidth as string) || 300,
      thumbnailHeight: parseInt(req.query.thumbHeight as string) || 300,
    }

    console.log('Upload options:', options)

    // Upload and optimize images using the image service
    const uploadedFiles = await imageUploadService.uploadImages(files, options)

    console.log('Vendor upload - optimized files:', uploadedFiles.length)

    // Return response in the expected format
    const response = {
      files: uploadedFiles.map(file => ({
        id: file.id,
        url: file.url,
        thumbnail_url: file.thumbnailUrl,
        name: file.name,
        size: file.size,
        width: file.width,
        height: file.height,
        format: file.format,
        mime_type: file.mime_type
      }))
    }

    res.status(200).json(response)
  } catch (error) {
    console.error('Vendor upload endpoint error:', error)
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Health check endpoint
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const providerInfo = imageUploadService.getProviderInfo()
  res.status(200).json({
    status: 'operational',
    storage: providerInfo
  })
}

