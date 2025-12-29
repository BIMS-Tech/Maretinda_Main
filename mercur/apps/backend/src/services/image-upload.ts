import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

/**
 * Production-grade image upload service
 * Supports multiple storage providers: Local, AWS S3, DigitalOcean Spaces
 */

export interface ImageUploadOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp' | 'avif'
  generateThumbnail?: boolean
  thumbnailWidth?: number
  thumbnailHeight?: number
}

export interface UploadedImage {
  id: string
  url: string
  thumbnailUrl?: string
  name: string
  size: number
  width?: number
  height?: number
  format: string
  mime_type: string
}

export interface StorageProvider {
  name: 'local' | 's3' | 'spaces'
  uploadFile(buffer: Buffer, filename: string, contentType: string): Promise<string>
  deleteFile(filename: string): Promise<void>
  getUrl(filename: string): string
}

/**
 * Local storage provider (disk storage)
 */
class LocalStorageProvider implements StorageProvider {
  name: 'local' = 'local'
  private uploadDir: string
  private baseUrl: string

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'static')
    this.baseUrl = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
    
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true })
    }
  }

  async uploadFile(buffer: Buffer, filename: string): Promise<string> {
    const filePath = path.join(this.uploadDir, filename)
    await fs.promises.writeFile(filePath, buffer)
    return filename
  }

  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(this.uploadDir, filename)
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath)
    }
  }

  getUrl(filename: string): string {
    return `${this.baseUrl}/static/${filename}`
  }
}

/**
 * AWS S3 / DigitalOcean Spaces provider
 * Note: Install @aws-sdk/client-s3 for production use
 */
class S3StorageProvider implements StorageProvider {
  name: 's3' = 's3'
  private bucket: string
  private region: string
  private endpoint?: string
  private accessKeyId: string
  private secretAccessKey: string
  private cdnUrl?: string

  constructor() {
    this.bucket = process.env.S3_BUCKET || ''
    this.region = process.env.S3_REGION || 'us-east-1'
    this.endpoint = process.env.S3_ENDPOINT // For DigitalOcean Spaces
    this.accessKeyId = process.env.S3_ACCESS_KEY_ID || ''
    this.secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || ''
    this.cdnUrl = process.env.S3_CDN_URL // Optional CDN URL
  }

  async uploadFile(buffer: Buffer, filename: string, contentType: string): Promise<string> {
    // TODO: Implement S3 upload when @aws-sdk/client-s3 is installed
    // const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
    // const client = new S3Client({
    //   region: this.region,
    //   endpoint: this.endpoint,
    //   credentials: {
    //     accessKeyId: this.accessKeyId,
    //     secretAccessKey: this.secretAccessKey
    //   }
    // })
    // 
    // await client.send(new PutObjectCommand({
    //   Bucket: this.bucket,
    //   Key: filename,
    //   Body: buffer,
    //   ContentType: contentType,
    //   ACL: 'public-read'
    // }))
    
    throw new Error('S3 storage provider not implemented. Install @aws-sdk/client-s3 and uncomment the code above.')
  }

  async deleteFile(filename: string): Promise<void> {
    // TODO: Implement S3 delete
    throw new Error('S3 storage provider not implemented')
  }

  getUrl(filename: string): string {
    if (this.cdnUrl) {
      return `${this.cdnUrl}/${filename}`
    }
    if (this.endpoint) {
      return `${this.endpoint}/${this.bucket}/${filename}`
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${filename}`
  }
}

/**
 * Image Upload Service
 */
export class ImageUploadService {
  private provider: StorageProvider

  constructor() {
    const storageType = process.env.STORAGE_PROVIDER || 'local'
    
    switch (storageType) {
      case 's3':
      case 'spaces':
        this.provider = new S3StorageProvider()
        break
      case 'local':
      default:
        this.provider = new LocalStorageProvider()
        break
    }
  }

  /**
   * Generate a unique filename
   */
  private generateFilename(originalName: string, prefix?: string): string {
    const timestamp = Date.now()
    const randomString = crypto.randomBytes(8).toString('hex')
    const ext = path.extname(originalName)
    const baseName = path.basename(originalName, ext)
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '-').substring(0, 50)
    
    return prefix 
      ? `${prefix}-${timestamp}-${randomString}-${sanitizedBaseName}${ext}`
      : `${timestamp}-${randomString}-${sanitizedBaseName}${ext}`
  }

  /**
   * Optimize and resize image
   */
  private async optimizeImage(
    buffer: Buffer,
    options: ImageUploadOptions = {}
  ): Promise<{ buffer: Buffer; metadata: sharp.Metadata }> {
    const {
      maxWidth = 2048,
      maxHeight = 2048,
      quality = 85,
      format
    } = options

    let processor = sharp(buffer)
    const metadata = await processor.metadata()

    // Resize if needed
    if (metadata.width && metadata.height) {
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        processor = processor.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
      }
    }

    // Convert format if specified
    if (format) {
      switch (format) {
        case 'jpeg':
          processor = processor.jpeg({ quality })
          break
        case 'png':
          processor = processor.png({ quality })
          break
        case 'webp':
          processor = processor.webp({ quality })
          break
        case 'avif':
          processor = processor.avif({ quality })
          break
      }
    } else {
      // Auto-optimize based on original format
      if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
        processor = processor.jpeg({ quality })
      } else if (metadata.format === 'png') {
        processor = processor.png({ quality })
      } else if (metadata.format === 'webp') {
        processor = processor.webp({ quality })
      }
    }

    const optimizedBuffer = await processor.toBuffer()
    const optimizedMetadata = await sharp(optimizedBuffer).metadata()

    return { buffer: optimizedBuffer, metadata: optimizedMetadata }
  }

  /**
   * Generate thumbnail
   */
  private async generateThumbnail(
    buffer: Buffer,
    width: number = 300,
    height: number = 300
  ): Promise<Buffer> {
    return sharp(buffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer()
  }

  /**
   * Upload image with optimization
   */
  async uploadImage(
    file: Express.Multer.File | { buffer: Buffer; originalname: string; mimetype: string },
    options: ImageUploadOptions = {}
  ): Promise<UploadedImage> {
    try {
      // Optimize main image
      const { buffer: optimizedBuffer, metadata } = await this.optimizeImage(
        file.buffer,
        options
      )

      // Generate filename
      const filename = this.generateFilename(file.originalname)
      const format = metadata.format || path.extname(file.originalname).substring(1)

      // Determine content type
      let contentType = file.mimetype
      if (options.format) {
        contentType = `image/${options.format}`
      }

      // Upload main image
      await this.provider.uploadFile(optimizedBuffer, filename, contentType)
      const url = this.provider.getUrl(filename)

      const result: UploadedImage = {
        id: filename,
        url,
        name: file.originalname,
        size: optimizedBuffer.length,
        width: metadata.width,
        height: metadata.height,
        format,
        mime_type: contentType
      }

      // Generate and upload thumbnail if requested
      if (options.generateThumbnail) {
        const thumbnailBuffer = await this.generateThumbnail(
          optimizedBuffer,
          options.thumbnailWidth,
          options.thumbnailHeight
        )
        
        const thumbnailFilename = this.generateFilename(
          file.originalname,
          'thumb'
        )
        
        await this.provider.uploadFile(
          thumbnailBuffer,
          thumbnailFilename,
          'image/jpeg'
        )
        
        result.thumbnailUrl = this.provider.getUrl(thumbnailFilename)
      }

      return result
    } catch (error) {
      console.error('Image upload error:', error)
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Upload multiple images
   */
  async uploadImages(
    files: Express.Multer.File[],
    options: ImageUploadOptions = {}
  ): Promise<UploadedImage[]> {
    const uploadPromises = files.map(file => this.uploadImage(file, options))
    return Promise.all(uploadPromises)
  }

  /**
   * Delete image
   */
  async deleteImage(filename: string): Promise<void> {
    try {
      await this.provider.deleteFile(filename)
      
      // Also delete thumbnail if exists
      const thumbnailFilename = filename.replace(/^(\d+)-/, 'thumb-$1-')
      try {
        await this.provider.deleteFile(thumbnailFilename)
      } catch {
        // Thumbnail may not exist, ignore error
      }
    } catch (error) {
      console.error('Image deletion error:', error)
      throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get storage provider info
   */
  getProviderInfo(): { name: string; configured: boolean } {
    return {
      name: this.provider.name,
      configured: true
    }
  }
}

// Export singleton instance
export const imageUploadService = new ImageUploadService()

