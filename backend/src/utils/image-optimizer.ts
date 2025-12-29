/**
 * Image Optimization Utility (Optional Enhancement)
 * 
 * To enable:
 * 1. Install sharp: npm install sharp
 * 2. Import this in uploads-vendor/route.ts
 * 3. Call optimizeImage() before saving
 */

// Uncomment to use:
// import sharp from 'sharp'

export interface OptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
  removeMetadata?: boolean
}

export const optimizeImage = async (
  buffer: Buffer,
  options: OptimizationOptions = {}
): Promise<Buffer> => {
  // Uncomment when sharp is installed:
  /*
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 85,
    format = 'webp',
    removeMetadata = true
  } = options

  let pipeline = sharp(buffer)

  // Resize if needed
  const metadata = await pipeline.metadata()
  if ((metadata.width && metadata.width > maxWidth) || 
      (metadata.height && metadata.height > maxHeight)) {
    pipeline = pipeline.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true
    })
  }

  // Auto-rotate based on EXIF orientation
  pipeline = pipeline.rotate()

  // Remove metadata if requested
  if (removeMetadata) {
    pipeline = pipeline.withMetadata({
      orientation: undefined,
      exif: undefined,
      icc: undefined
    })
  }

  // Convert format and compress
  switch (format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality, mozjpeg: true })
      break
    case 'png':
      pipeline = pipeline.png({ quality, compressionLevel: 9 })
      break
    case 'webp':
      pipeline = pipeline.webp({ quality })
      break
  }

  return await pipeline.toBuffer()
  */
  
  // Placeholder until sharp is installed:
  return buffer
}

export const validateImage = async (buffer: Buffer): Promise<{
  valid: boolean
  width?: number
  height?: number
  format?: string
  error?: string
}> => {
  // Uncomment when sharp is installed:
  /*
  try {
    const metadata = await sharp(buffer).metadata()
    
    if (!metadata.width || !metadata.height) {
      return { valid: false, error: 'Invalid image: no dimensions' }
    }

    return {
      valid: true,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid image file'
    }
  }
  */
  
  // Placeholder until sharp is installed:
  return { valid: true }
}

/**
 * Usage in uploads-vendor/route.ts:
 * 
 * import { optimizeImage, validateImage } from '../../utils/image-optimizer'
 * 
 * // After multer processes files:
 * const files = req.files as Express.Multer.File[]
 * 
 * for (const file of files) {
 *   // Validate
 *   const validation = await validateImage(file.buffer)
 *   if (!validation.valid) {
 *     return res.status(400).json({ 
 *       message: validation.error 
 *     })
 *   }
 *   
 *   // Optimize
 *   const optimized = await optimizeImage(file.buffer, {
 *     maxWidth: 2048,
 *     maxHeight: 2048,
 *     quality: 85,
 *     format: 'webp',
 *     removeMetadata: true
 *   })
 *   
 *   // Save optimized version
 *   fs.writeFileSync(file.path, optimized)
 * }
 */

