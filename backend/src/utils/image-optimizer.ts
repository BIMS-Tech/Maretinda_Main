import sharp from "sharp"

export interface OptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: "jpeg" | "png" | "webp"
  removeMetadata?: boolean
}

export interface OptimizationResult {
  buffer: Buffer
  contentType: string
  extension: string
  originalSize: number
  optimizedSize: number
}

/**
 * Optimize an image buffer: resize if oversized, strip EXIF, convert to WebP.
 * Falls back to the original buffer on any error so uploads never fail.
 */
export const optimizeImage = async (
  buffer: Buffer,
  options: OptimizationOptions = {}
): Promise<OptimizationResult> => {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 85,
    format = "webp",
    removeMetadata = true,
  } = options

  const originalSize = buffer.length

  try {
    let pipeline = sharp(buffer)

    // Auto-rotate based on EXIF orientation first
    pipeline = pipeline.rotate()

    // Resize only if the image exceeds max dimensions (never upscale)
    const metadata = await sharp(buffer).metadata()
    if (
      (metadata.width && metadata.width > maxWidth) ||
      (metadata.height && metadata.height > maxHeight)
    ) {
      pipeline = pipeline.resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
    }

    // Strip metadata (EXIF, ICC, etc.) for privacy + smaller files
    if (removeMetadata) {
      pipeline = pipeline.withMetadata({})
    }

    // Convert and compress
    let outputBuffer: Buffer
    let contentType: string
    let extension: string

    switch (format) {
      case "jpeg":
        outputBuffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer()
        contentType = "image/jpeg"
        extension = "jpg"
        break
      case "png":
        outputBuffer = await pipeline.png({ quality, compressionLevel: 9 }).toBuffer()
        contentType = "image/png"
        extension = "png"
        break
      case "webp":
      default:
        outputBuffer = await pipeline.webp({ quality }).toBuffer()
        contentType = "image/webp"
        extension = "webp"
        break
    }

    return {
      buffer: outputBuffer,
      contentType,
      extension,
      originalSize,
      optimizedSize: outputBuffer.length,
    }
  } catch (err) {
    console.error("[image-optimizer] Optimization failed, using original:", err)
    return {
      buffer,
      contentType: "application/octet-stream",
      extension: "bin",
      originalSize,
      optimizedSize: buffer.length,
    }
  }
}

/**
 * Generate a thumbnail (small square crop suitable for product cards).
 */
export const generateThumbnail = async (
  buffer: Buffer,
  size = 400,
  quality = 80
): Promise<OptimizationResult> => {
  const originalSize = buffer.length
  try {
    const outputBuffer = await sharp(buffer)
      .rotate()
      .resize(size, size, { fit: "cover", position: "center" })
      .withMetadata({})
      .webp({ quality })
      .toBuffer()

    return {
      buffer: outputBuffer,
      contentType: "image/webp",
      extension: "webp",
      originalSize,
      optimizedSize: outputBuffer.length,
    }
  } catch (err) {
    console.error("[image-optimizer] Thumbnail failed, using original:", err)
    return {
      buffer,
      contentType: "application/octet-stream",
      extension: "bin",
      originalSize,
      optimizedSize: buffer.length,
    }
  }
}

/**
 * Quick validation — checks that the buffer is actually a recognizable image.
 */
export const validateImage = async (
  buffer: Buffer
): Promise<{ valid: boolean; width?: number; height?: number; format?: string; error?: string }> => {
  try {
    const metadata = await sharp(buffer).metadata()
    if (!metadata.width || !metadata.height) {
      return { valid: false, error: "Invalid image: no dimensions" }
    }
    return { valid: true, width: metadata.width, height: metadata.height, format: metadata.format }
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : "Invalid image file" }
  }
}
