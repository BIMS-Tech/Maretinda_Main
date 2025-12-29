/**
 * Cloudinary Storage Integration for Images
 * 
 * Setup:
 * 1. npm install cloudinary
 * 2. Sign up at https://cloudinary.com
 * 3. Add environment variables
 * 4. Uncomment code below
 */

// Uncomment to use:
// import { v2 as cloudinary } from 'cloudinary'
// import { Readable } from 'stream'

export interface CloudinaryConfig {
  cloudName: string
  apiKey: string
  apiSecret: string
  folder?: string
}

export interface UploadResult {
  success: boolean
  url?: string
  secureUrl?: string
  publicId?: string
  width?: number
  height?: number
  format?: string
  resourceType?: string
  error?: string
}

class CloudinaryService {
  private config: CloudinaryConfig
  private isConfigured: boolean = false

  constructor(config: CloudinaryConfig) {
    this.config = config
    this.configureCloudinary()
  }

  private configureCloudinary() {
    // Uncomment when cloudinary is installed:
    /*
    cloudinary.config({
      cloud_name: this.config.cloudName,
      api_key: this.config.apiKey,
      api_secret: this.config.apiSecret,
      secure: true
    })
    this.isConfigured = true
    console.log('[Cloudinary] Configured successfully:', this.config.cloudName)
    */
  }

  /**
   * Upload image to Cloudinary
   */
  async uploadImage(
    buffer: Buffer,
    filename: string,
    options: {
      folder?: string
      transformation?: any
      tags?: string[]
      context?: Record<string, string>
    } = {}
  ): Promise<UploadResult> {
    if (!this.isConfigured) {
      return { success: false, error: 'Cloudinary not configured' }
    }

    // Uncomment when cloudinary is installed:
    /*
    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: options.folder || this.config.folder || 'uploads',
            public_id: this.sanitizeFilename(filename),
            resource_type: 'image',
            tags: options.tags || ['vendor-upload'],
            context: options.context,
            transformation: options.transformation || [
              { width: 2048, height: 2048, crop: 'limit' },
              { quality: 'auto:good' },
              { fetch_format: 'auto' }
            ],
            overwrite: false,
            unique_filename: true
          },
          (error, result) => {
            if (error || !result) {
              console.error('[Cloudinary] Upload error:', error)
              resolve({
                success: false,
                error: error?.message || 'Upload failed'
              })
              return
            }

            console.log('[Cloudinary] Upload success:', {
              publicId: result.public_id,
              url: result.secure_url,
              width: result.width,
              height: result.height
            })

            resolve({
              success: true,
              url: result.url,
              secureUrl: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format,
              resourceType: result.resource_type
            })
          }
        )

        // Convert buffer to stream and pipe to Cloudinary
        const stream = Readable.from(buffer)
        stream.pipe(uploadStream)
      })
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
    */

    // Placeholder until cloudinary is installed:
    return { success: false, error: 'Cloudinary SDK not installed' }
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured) {
      return { success: false, error: 'Cloudinary not configured' }
    }

    // Uncomment when cloudinary is installed:
    /*
    try {
      const result = await cloudinary.uploader.destroy(publicId)
      
      if (result.result === 'ok') {
        console.log('[Cloudinary] Delete success:', publicId)
        return { success: true }
      } else {
        console.warn('[Cloudinary] Delete failed:', result)
        return { success: false, error: result.result }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      }
    }
    */

    // Placeholder until cloudinary is installed:
    return { success: false, error: 'Cloudinary SDK not installed' }
  }

  /**
   * Generate transformation URL
   */
  generateUrl(
    publicId: string,
    transformation?: {
      width?: number
      height?: number
      crop?: string
      quality?: string
      format?: string
    }
  ): string {
    // Uncomment when cloudinary is installed:
    /*
    return cloudinary.url(publicId, {
      secure: true,
      transformation: transformation || {
        width: 800,
        height: 800,
        crop: 'limit',
        quality: 'auto',
        fetch_format: 'auto'
      }
    })
    */

    // Placeholder:
    return `https://res.cloudinary.com/${this.config.cloudName}/image/upload/${publicId}`
  }

  /**
   * Generate thumbnail URL
   */
  getThumbnail(publicId: string, size: number = 200): string {
    return this.generateUrl(publicId, {
      width: size,
      height: size,
      crop: 'fill',
      quality: 'auto',
      format: 'auto'
    })
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.[^/.]+$/, '') // Remove extension (Cloudinary handles it)
      .substring(0, 100)
  }
}

// Create Cloudinary service instance
export const createCloudinaryService = (): CloudinaryService | null => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('[Cloudinary] Missing configuration. Set CLOUDINARY_* environment variables.')
    return null
  }

  return new CloudinaryService({
    cloudName,
    apiKey,
    apiSecret,
    folder: process.env.CLOUDINARY_FOLDER || 'vendor-uploads'
  })
}

/**
 * Helper to determine if file is an image or document
 */
export const isImageFile = (mimetype: string): boolean => {
  return mimetype.startsWith('image/')
}

export const isDocumentFile = (mimetype: string): boolean => {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]
  return documentTypes.includes(mimetype)
}

