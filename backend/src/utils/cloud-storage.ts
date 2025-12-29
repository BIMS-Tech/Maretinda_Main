/**
 * Cloud Storage Utility (Optional Enhancement)
 * 
 * To enable:
 * 1. Install AWS SDK: npm install @aws-sdk/client-s3
 * 2. Configure environment variables
 * 3. Import and use in uploads-vendor/route.ts
 */

// Uncomment to use:
// import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"

export interface UploadResult {
  success: boolean
  url?: string
  key?: string
  error?: string
}

export interface CloudStorageConfig {
  provider: 'local' | 's3' | 'spaces'
  bucket?: string
  region?: string
  endpoint?: string
  cdnUrl?: string
  accessKeyId?: string
  secretAccessKey?: string
}

class CloudStorageService {
  private config: CloudStorageConfig
  // private s3Client?: S3Client

  constructor(config: CloudStorageConfig) {
    this.config = config

    // Uncomment when AWS SDK is installed:
    /*
    if (config.provider === 's3' || config.provider === 'spaces') {
      this.s3Client = new S3Client({
        region: config.region || 'us-east-1',
        endpoint: config.endpoint, // For DigitalOcean Spaces
        credentials: config.accessKeyId && config.secretAccessKey ? {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey
        } : undefined
      })
    }
    */
  }

  async uploadFile(
    buffer: Buffer,
    key: string,
    contentType: string
  ): Promise<UploadResult> {
    switch (this.config.provider) {
      case 'local':
        return this.uploadLocal(buffer, key)
      
      case 's3':
      case 'spaces':
        return this.uploadS3(buffer, key, contentType)
      
      default:
        return { success: false, error: 'Unknown storage provider' }
    }
  }

  private async uploadLocal(
    buffer: Buffer,
    key: string
  ): Promise<UploadResult> {
    const fs = require('fs')
    const path = require('path')
    
    try {
      const uploadDir = path.join(process.cwd(), 'static')
      const filePath = path.join(uploadDir, key)
      
      fs.writeFileSync(filePath, buffer)
      
      const backendUrl = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
      const url = `${backendUrl}/static/${key}`
      
      return { success: true, url, key }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  private async uploadS3(
    buffer: Buffer,
    key: string,
    contentType: string
  ): Promise<UploadResult> {
    // Uncomment when AWS SDK is installed:
    /*
    if (!this.s3Client) {
      return { success: false, error: 'S3 client not initialized' }
    }

    try {
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.config.bucket!,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read' // Or 'private' if using signed URLs
      }))

      // Generate URL
      let url: string
      if (this.config.cdnUrl) {
        // Use CDN URL if available
        url = `${this.config.cdnUrl}/${key}`
      } else if (this.config.endpoint) {
        // DigitalOcean Spaces or custom endpoint
        url = `${this.config.endpoint}/${this.config.bucket}/${key}`
      } else {
        // Standard S3 URL
        url = `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`
      }

      return { success: true, url, key }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'S3 upload failed'
      }
    }
    */

    // Placeholder until AWS SDK is installed:
    return { success: false, error: 'AWS SDK not installed' }
  }

  async deleteFile(key: string): Promise<{ success: boolean; error?: string }> {
    switch (this.config.provider) {
      case 'local':
        return this.deleteLocal(key)
      
      case 's3':
      case 'spaces':
        return this.deleteS3(key)
      
      default:
        return { success: false, error: 'Unknown storage provider' }
    }
  }

  private async deleteLocal(key: string): Promise<{ success: boolean; error?: string }> {
    const fs = require('fs')
    const path = require('path')
    
    try {
      const filePath = path.join(process.cwd(), 'static', key)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      }
    }
  }

  private async deleteS3(key: string): Promise<{ success: boolean; error?: string }> {
    // Uncomment when AWS SDK is installed:
    /*
    if (!this.s3Client) {
      return { success: false, error: 'S3 client not initialized' }
    }

    try {
      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: this.config.bucket!,
        Key: key
      }))
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'S3 delete failed'
      }
    }
    */

    // Placeholder until AWS SDK is installed:
    return { success: false, error: 'AWS SDK not installed' }
  }
}

// Create storage service instance
export const createStorageService = (): CloudStorageService => {
  const provider = (process.env.STORAGE_PROVIDER || 'local') as CloudStorageConfig['provider']
  
  const config: CloudStorageConfig = {
    provider,
    bucket: process.env.S3_BUCKET,
    region: process.env.AWS_REGION || process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    cdnUrl: process.env.S3_CDN_URL,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY
  }

  return new CloudStorageService(config)
}

/**
 * Usage in uploads-vendor/route.ts:
 * 
 * import { createStorageService } from '../../utils/cloud-storage'
 * 
 * const storage = createStorageService()
 * 
 * // After multer processes files:
 * const files = req.files as Express.Multer.File[]
 * const uploadedFiles = []
 * 
 * for (const file of files) {
 *   const key = `uploads/${timestamp}-${randomSuffix}-${file.originalname}`
 *   const result = await storage.uploadFile(file.buffer, key, file.mimetype)
 *   
 *   if (!result.success) {
 *     return res.status(500).json({ 
 *       message: 'Upload failed',
 *       error: result.error 
 *     })
 *   }
 *   
 *   uploadedFiles.push({
 *     id: key,
 *     url: result.url,
 *     name: file.originalname,
 *     size: file.size,
 *     mime_type: file.mimetype
 *   })
 * }
 * 
 * // To delete a file:
 * await storage.deleteFile('uploads/12345-abc-image.jpg')
 */

/**
 * Environment Variables:
 * 
 * # For Local Storage (default)
 * STORAGE_PROVIDER=local
 * 
 * # For AWS S3
 * STORAGE_PROVIDER=s3
 * S3_BUCKET=your-bucket-name
 * AWS_REGION=us-east-1
 * AWS_ACCESS_KEY_ID=your-key
 * AWS_SECRET_ACCESS_KEY=your-secret
 * 
 * # For DigitalOcean Spaces
 * STORAGE_PROVIDER=spaces
 * S3_BUCKET=your-space-name
 * S3_REGION=nyc3
 * S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
 * S3_CDN_URL=https://your-space.nyc3.cdn.digitaloceanspaces.com
 * S3_ACCESS_KEY_ID=your-spaces-key
 * S3_SECRET_ACCESS_KEY=your-spaces-secret
 */

