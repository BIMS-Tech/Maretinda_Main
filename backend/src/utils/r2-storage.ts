/**
 * Cloudflare R2 (or any S3-compatible store) behind the same interface as
 * GoogleCloudStorageService, so every caller of createGCSService() keeps
 * working unchanged. createGCSService() returns this when S3_ENDPOINT and
 * S3_BUCKET are set.
 *
 * R2 has no per-object ACLs: objects are public when the bucket is served
 * through a public custom domain (S3_FILE_URL), so `makePublic` is a no-op.
 *
 * Env:
 *   S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
 *   S3_BUCKET=maretinda-media
 *   S3_REGION=auto
 *   S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY
 *   S3_FILE_URL=https://media.maretinda.com   (public base URL)
 */

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { UploadResult } from './google-cloud-storage'

export interface R2Config {
  endpoint: string
  bucketName: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  publicUrl: string
}

export class R2StorageService {
  private config: R2Config
  private client: S3Client

  constructor(config: R2Config) {
    this.config = { ...config, publicUrl: config.publicUrl.replace(/\/$/, '') }
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })

    console.log('[R2] Initialized:', { endpoint: config.endpoint, bucket: config.bucketName })
  }

  /**
   * Upload a file under `<folder>/<timestamp>-<random>-<name>`, the same key
   * layout as the GCS service.
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
    try {
      const folder = options.folder || 'uploads'
      const sanitizedFilename = this.sanitizeFilename(filename)
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substring(2, 8)
      const fileName = `${folder}/${timestamp}-${randomSuffix}-${sanitizedFilename}`

      await this.client.send(
        new PutObjectCommand({
          Bucket: this.config.bucketName,
          Key: fileName,
          Body: buffer,
          ContentType: options.contentType || 'application/octet-stream',
          CacheControl: options.cacheControl || 'public, max-age=31536000',
          // S3 metadata values must be ASCII strings
          Metadata: this.asciiMetadata({
            ...options.metadata,
            uploadedAt: new Date().toISOString(),
          }),
        })
      )

      const publicUrl = this.publicUrl(fileName)

      console.log('[R2] Upload success:', {
        fileName,
        size: buffer.length,
        contentType: options.contentType,
      })

      return {
        success: true,
        url: publicUrl,
        publicUrl,
        fileName,
        bucket: this.config.bucketName,
        contentType: options.contentType,
        size: buffer.length,
      }
    } catch (error) {
      console.error('[R2] Upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }
    }
  }

  async deleteFile(fileName: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.config.bucketName, Key: fileName })
      )
      console.log('[R2] Delete success:', fileName)
      return { success: true }
    } catch (error) {
      console.error('[R2] Delete error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      }
    }
  }

  async getSignedUrl(
    fileName: string,
    expiresIn: number = 3600
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const url = await getSignedUrl(
        this.client,
        new GetObjectCommand({ Bucket: this.config.bucketName, Key: fileName }),
        { expiresIn }
      )
      return { success: true, url }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate signed URL',
      }
    }
  }

  async fileExists(fileName: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.config.bucketName, Key: fileName })
      )
      return true
    } catch {
      return false
    }
  }

  async getMetadata(fileName: string): Promise<any> {
    try {
      return await this.client.send(
        new HeadObjectCommand({ Bucket: this.config.bucketName, Key: fileName })
      )
    } catch (error) {
      console.error('[R2] Get metadata error:', error)
      return null
    }
  }

  /**
   * Save text content at a fixed path (no timestamp/random suffix)
   */
  async saveTextFile(
    path: string,
    content: string,
    contentType: string = 'text/plain'
  ): Promise<{ success: boolean; error?: string }> {
    return this.saveBinaryFile(path, Buffer.from(content, 'utf-8'), contentType)
  }

  async readTextFile(path: string): Promise<string | null> {
    const buffer = await this.readBinaryFile(path)
    return buffer ? buffer.toString('utf-8') : null
  }

  async saveBinaryFile(
    path: string,
    buffer: Buffer,
    contentType: string = 'application/octet-stream'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.config.bucketName,
          Key: path,
          Body: buffer,
          ContentType: contentType,
        })
      )
      console.log('[R2] saveBinaryFile success:', path)
      return { success: true }
    } catch (error) {
      console.error('[R2] saveBinaryFile error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Save failed' }
    }
  }

  /**
   * Returns null when the object does not exist, like the GCS service.
   */
  async readBinaryFile(path: string): Promise<Buffer | null> {
    try {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.config.bucketName, Key: path })
      )
      if (!result.Body) return null
      return Buffer.from(await result.Body.transformToByteArray())
    } catch (error: any) {
      if (error?.name !== 'NoSuchKey' && error?.$metadata?.httpStatusCode !== 404) {
        console.error('[R2] readBinaryFile error:', error)
      }
      return null
    }
  }

  async listFiles(prefix?: string): Promise<string[]> {
    try {
      const keys: string[] = []
      let continuationToken: string | undefined
      do {
        const page = await this.client.send(
          new ListObjectsV2Command({
            Bucket: this.config.bucketName,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          })
        )
        for (const object of page.Contents || []) {
          if (object.Key) keys.push(object.Key)
        }
        continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined
      } while (continuationToken)
      return keys
    } catch (error) {
      console.error('[R2] List files error:', error)
      return []
    }
  }

  private publicUrl(key: string): string {
    return `${this.config.publicUrl}/${key}`
  }

  private asciiMetadata(metadata: Record<string, string | undefined>): Record<string, string> {
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(metadata)) {
      if (value === undefined) continue
      result[key] = String(value).replace(/[^\x20-\x7E]/g, '_')
    }
    return result
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 100)
  }
}
