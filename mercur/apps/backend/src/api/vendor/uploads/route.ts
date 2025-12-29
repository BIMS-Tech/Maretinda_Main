import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// NOTE: Multer middleware is already applied via middlewares.ts
// Files are pre-processed and saved to disk before this handler runs

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    // Files are already processed by multer middleware from middlewares.ts
    const files = req.files as Express.Multer.File[]
    
    console.log('Vendor upload - received files:', files)
    console.log('Vendor upload - files length:', files?.length)
    
    if (!files || files.length === 0) {
      console.log('Vendor upload - no files received')
      return res.status(400).json({ message: 'No files uploaded' })
    }

    // Debug each file
    files.forEach((file, index) => {
      console.log(`File ${index}:`, {
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path
      })
    })

    // Generate response with file URLs
    const uploadedFiles = files.map(file => ({
      id: file.filename,
      url: `${process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'}/static/${file.filename}`,
      name: file.originalname,
      size: file.size,
      mime_type: file.mimetype
    }))

    console.log('Vendor upload - response:', { files: uploadedFiles })

    res.status(200).json({
      files: uploadedFiles
    })
  } catch (error) {
    console.error('Vendor upload endpoint error:', error)
    res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
