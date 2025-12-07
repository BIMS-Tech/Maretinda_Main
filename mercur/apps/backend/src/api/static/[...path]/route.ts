import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import fs from "fs"
import path from "path"
import { NextFunction } from "express"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse,
  next: NextFunction
): Promise<void> {
  try {
    const filePath = req.params.path
    if (!filePath) {
      return res.status(404).json({ message: "File not found" })
    }

    const fullPath = path.join(process.cwd(), "static", filePath)
    
    // Security check: ensure the path is within the static directory
    const staticDir = path.join(process.cwd(), "static")
    const resolvedPath = path.resolve(fullPath)
    if (!resolvedPath.startsWith(staticDir)) {
      return res.status(403).json({ message: "Access denied" })
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ message: "File not found" })
    }

    const stat = fs.statSync(resolvedPath)
    if (!stat.isFile()) {
      return res.status(404).json({ message: "File not found" })
    }

    // Set appropriate headers
    const ext = path.extname(resolvedPath).toLowerCase()
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
    }

    const contentType = mimeTypes[ext] || 'application/octet-stream'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Length', stat.size)

    // Stream the file
    const readStream = fs.createReadStream(resolvedPath)
    readStream.pipe(res)
  } catch (error) {
    console.error('Error serving static file:', error)
    res.status(500).json({ message: "Internal server error" })
  }
}

