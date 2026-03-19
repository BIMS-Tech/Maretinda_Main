import { AbstractFileProviderService } from "@medusajs/framework/utils"
import { FileTypes } from "@medusajs/types"
import { Storage } from "@google-cloud/storage"
import { randomBytes } from "crypto"
import { Readable } from "stream"

export class GCSFileProvider extends AbstractFileProviderService {
  static identifier = "gcs"

  private bucket: any
  private bucketName: string
  private cdnUrl: string | undefined
  private isReady: boolean = false

  constructor(_deps: any, _options: any) {
    super()

    const projectId = process.env.GCS_PROJECT_ID
    const bucketName = process.env.GCS_BUCKET_NAME

    if (!projectId || !bucketName) {
      console.warn("[file-gcs] Missing GCS_PROJECT_ID or GCS_BUCKET_NAME — file provider disabled")
      this.bucketName = ""
      return
    }

    this.bucketName = bucketName
    this.cdnUrl = process.env.GCS_CDN_URL

    const storageConfig: any = { projectId }

    if (process.env.GCS_CREDENTIALS) {
      try {
        storageConfig.credentials = JSON.parse(process.env.GCS_CREDENTIALS)
      } catch {
        console.error("[file-gcs] Failed to parse GCS_CREDENTIALS JSON")
      }
    } else if (process.env.GCS_KEY_FILE) {
      storageConfig.keyFilename = process.env.GCS_KEY_FILE
    }

    const storage = new Storage(storageConfig)
    this.bucket = storage.bucket(bucketName)
    this.isReady = true

    console.log("[file-gcs] GCS file provider initialized:", { projectId, bucketName })
  }

  private async toBuffer(content: Buffer | NodeJS.ReadableStream | string): Promise<Buffer> {
    if (Buffer.isBuffer(content)) return content
    if (typeof content === "string") return Buffer.from(content, "binary")
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      const stream = content as Readable
      stream.on("data", (chunk) =>
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      )
      stream.on("end", () => resolve(Buffer.concat(chunks)))
      stream.on("error", reject)
    })
  }

  private buildGCSPath(filename: string, access: "public" | "private"): string {
    const timestamp = Date.now()
    const random = randomBytes(4).toString("hex")
    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 80)
    const folder = access === "private" ? "private" : "public"
    return `medusa/${folder}/${timestamp}-${random}-${sanitized}`
  }

  private publicUrl(key: string): string {
    if (this.cdnUrl) return `${this.cdnUrl.replace(/\/$/, "")}/${key}`
    return `https://storage.googleapis.com/${this.bucketName}/${key}`
  }

  async upload(
    file: FileTypes.ProviderUploadFileDTO
  ): Promise<FileTypes.ProviderFileResultDTO> {
    if (!this.isReady) throw new Error("[file-gcs] GCS not configured")

    const buffer = await this.toBuffer(file.content as any)
    const key = this.buildGCSPath(file.filename, file.access || "public")
    const gcsFile = this.bucket.file(key)

    await gcsFile.save(buffer, {
      metadata: {
        contentType: file.mimeType,
        cacheControl: "public, max-age=31536000",
      },
    })

    if ((file.access || "public") === "public") {
      await gcsFile.makePublic()
    }

    return { key, url: this.publicUrl(key) }
  }

  async delete(file: FileTypes.ProviderDeleteFileDTO): Promise<void> {
    if (!this.isReady) return
    try {
      await this.bucket.file(file.fileKey).delete()
    } catch (err: any) {
      // Ignore "not found" errors
      if (err?.code !== 404) throw err
    }
  }

  async getPresignedDownloadUrl(
    fileData: FileTypes.ProviderGetFileDTO
  ): Promise<string> {
    if (!this.isReady) throw new Error("[file-gcs] GCS not configured")
    const [url] = await this.bucket.file(fileData.fileKey).getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 3600 * 1000, // 1 hour
    })
    return url
  }
}
