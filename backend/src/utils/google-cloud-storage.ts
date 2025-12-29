/**
 * Google Cloud Storage Integration
 * 
 * Benefits over Cloudinary:
 * - Cheaper for large volumes
 * - Better for documents (PDFs, etc.)
 * - Can use for both images AND documents
 * - Google CDN integration available
 * - Better for video files
 * 
 * Setup:
 * 1. npm install @google-cloud/storage
 * 2. Create Google Cloud Project
 * 3. Create Storage Bucket
 * 4. Create Service Account & download JSON key
 * 5. Add environment variables
 * 6. Uncomment code below
 */

import { Storage } from '@google-cloud/storage'
import path from 'path'

export interface GCSConfig {
  projectId: string
  bucketName: string
  keyFilename?: string // Path to service account JSON
  credentials?: any // Or provide credentials directly
  cdnUrl?: string // Optional: Custom CDN URL
}

export interface UploadResult {
  success: boolean
  url?: string
  publicUrl?: string
  fileName?: string
  bucket?: string
  contentType?: string
  size?: number
  error?: string
}

class GoogleCloudStorageService {
  private config: GCSConfig
  private storage: any // Storage instance
  private bucket: any // Bucket instance
  private isConfigured: boolean = false

  constructor(config: GCSConfig) {
    this.config = config
    this.initializeStorage()
  }

  private initializeStorage() {
    try {
      // Initialize Google Cloud Storage
      const storageConfig: any = {
        projectId: this.config.projectId
      }

      // Use either key file path or credentials object
      if (this.config.keyFilename) {
        storageConfig.keyFilename = this.config.keyFilename
      } else if (this.config.credentials) {
        storageConfig.credentials = this.config.credentials
      }

      this.storage = new Storage(storageConfig)
      this.bucket = this.storage.bucket(this.config.bucketName)
      this.isConfigured = true

      console.log('[GCS] Initialized successfully:', {
        projectId: this.config.projectId,
        bucket: this.config.bucketName
      })
    } catch (error) {
      console.error('[GCS] Initialization failed:', error)
      this.isConfigured = false
    }
  }

  /**
   * Upload file to Google Cloud Storage
   */
  async uploadFile(
    buffer: Buffer,
    filename: string,
    options: {
      folder?: string
      contentType?: string
      metadata?: Record<string, string>
      makePublic?: boolean
      cacheControl?: string
    } = {}
  ): Promise<UploadResult> {
    if (!this.isConfigured) {
      return { success: false, error: 'Google Cloud Storage not configured' }
    }

    try {
      // Build file path
      const folder = options.folder || 'uploads'
      const sanitizedFilename = this.sanitizeFilename(filename)
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substring(2, 8)
      const fileName = `${folder}/${timestamp}-${randomSuffix}-${sanitizedFilename}`

      // Create file reference
      const file = this.bucket.file(fileName)

      // Upload options
      const uploadOptions: any = {
        metadata: {
          contentType: options.contentType || 'application/octet-stream',
          cacheControl: options.cacheControl || 'public, max-age=31536000',
          metadata: {
            ...options.metadata,
            uploadedAt: new Date().toISOString()
          }
        }
      }

      // Upload buffer
      await file.save(buffer, uploadOptions)

      // Make file public if requested
      if (options.makePublic !== false) {
        await file.makePublic()
      }

      // Get public URL
      let publicUrl: string
      if (this.config.cdnUrl) {
        // Use custom CDN URL if configured
        publicUrl = `${this.config.cdnUrl}/${fileName}`
      } else {
        // Use default GCS URL
        publicUrl = `https://storage.googleapis.com/${this.config.bucketName}/${fileName}`
      }

      console.log('[GCS] Upload success:', {
        fileName,
        size: buffer.length,
        contentType: options.contentType
      })

      return {
        success: true,
        url: publicUrl,
        publicUrl,
        fileName,
        bucket: this.config.bucketName,
        contentType: options.contentType,
        size: buffer.length
      }
    } catch (error) {
      console.error('[GCS] Upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  /**
   * Delete file from Google Cloud Storage
   */
  async deleteFile(fileName: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured) {
      return { success: false, error: 'Google Cloud Storage not configured' }
    }

    try {
      const file = this.bucket.file(fileName)
      await file.delete()

      console.log('[GCS] Delete success:', fileName)
      return { success: true }
    } catch (error) {
      console.error('[GCS] Delete error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      }
    }
  }

  /**
   * Get signed URL for private files (expires after set time)
   */
  async getSignedUrl(
    fileName: string,
    expiresIn: number = 3600 // 1 hour default
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    if (!this.isConfigured) {
      return { success: false, error: 'Google Cloud Storage not configured' }
    }

    try {
      const file = this.bucket.file(fileName)
      
      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expiresIn * 1000
      })

      return { success: true, url }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate signed URL'
      }
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(fileName: string): Promise<boolean> {
    if (!this.isConfigured) return false

    try {
      const file = this.bucket.file(fileName)
      const [exists] = await file.exists()
      return exists
    } catch (error) {
      return false
    }
  }

  /**
   * Get file metadata
   */
  async getMetadata(fileName: string): Promise<any> {
    if (!this.isConfigured) return null

    try {
      const file = this.bucket.file(fileName)
      const [metadata] = await file.getMetadata()
      return metadata
    } catch (error) {
      console.error('[GCS] Get metadata error:', error)
      return null
    }
  }

  /**
   * List files in a folder
   */
  async listFiles(prefix?: string): Promise<string[]> {
    if (!this.isConfigured) return []

    try {
      const options: any = {}
      if (prefix) {
        options.prefix = prefix
      }

      const [files] = await this.bucket.getFiles(options)
      return files.map((file: any) => file.name)
    } catch (error) {
      console.error('[GCS] List files error:', error)
      return []
    }
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 100)
  }
}

// Create GCS service instance
export const createGCSService = (): GoogleCloudStorageService | null => {
  const projectId = process.env.GCS_PROJECT_ID
  const bucketName = process.env.GCS_BUCKET_NAME
  
  if (!projectId || !bucketName) {
    console.warn('[GCS] Missing configuration. Set GCS_PROJECT_ID and GCS_BUCKET_NAME')
    return null
  }

  const config: GCSConfig = {
    projectId,
    bucketName,
    keyFilename: process.env.GCS_KEY_FILE, // Path to service account JSON
    cdnUrl: process.env.GCS_CDN_URL // Optional custom CDN
  }

  // If credentials are provided as JSON string (e.g., in environment variable)
  if (process.env.GCS_CREDENTIALS) {
    try {
      config.credentials = JSON.parse(process.env.GCS_CREDENTIALS)
    } catch (error) {
      console.error('[GCS] Failed to parse GCS_CREDENTIALS JSON')
    }
  }

  return new GoogleCloudStorageService(config)
}

/**
 * Helper functions
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
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv'
  ]
  return documentTypes.includes(mimetype)
}

export const isVideoFile = (mimetype: string): boolean => {
  return mimetype.startsWith('video/')
}

/**
 * Usage Example in uploads-vendor/route.ts:
 * 
 * import { createGCSService } from '../../utils/google-cloud-storage'
 * 
 * const gcs = createGCSService()
 * 
 * // Upload file
 * const result = await gcs.uploadFile(file.buffer, file.originalname, {
 *   folder: 'vendor-uploads',
 *   contentType: file.mimetype,
 *   metadata: {
 *     userId: auth.userId,
 *     originalName: file.originalname
 *   },
 *   makePublic: true
 * })
 * 
 * if (result.success) {
 *   console.log('File uploaded:', result.publicUrl)
 * }
 * 
 * // Delete file
 * await gcs.deleteFile('vendor-uploads/12345-file.jpg')
 * 
 * // Get signed URL for private files
 * const signedUrl = await gcs.getSignedUrl('vendor-uploads/private-doc.pdf', 3600)
 */

