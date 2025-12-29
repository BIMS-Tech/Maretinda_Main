import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import TamaFileGeneratorService from '../../../../../services/tama-file-generator'
import * as fs from 'fs'
import * as path from 'path'

/**
 * @oas [get] /admin/tama/{id}/download
 * operationId: "AdminDownloadTamaFile"
 * summary: "Download TAMA File"
 * description: "Downloads the generated TAMA file for the specified generation."
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the TAMA generation
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       text/plain:
 *         schema:
 *           type: string
 *   "404":
 *     description: TAMA generation not found
 *   "500":
 *     description: Internal server error
 * tags:
 *   - Admin TAMA
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { id } = req.params
    
    if (!id) {
      res.status(400).json({
        message: 'TAMA generation ID is required',
        error: 'Missing required parameter: id'
      })
      return
    }
    
    // Get database connection
    let pgConnection: any
    try {
      pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch (e) {
      pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    if (!pgConnection) {
      res.status(500).json({
        message: "Database connection not available",
        error: "Unable to connect to database"
      })
      return
    }
    
    // Get TAMA generation record
    const results = await pgConnection.raw(`
      SELECT * FROM "tama_generation"
      WHERE id = ? AND deleted_at IS NULL
    `, [id])
    
    const rows = results?.rows || results || []
    
    if (rows.length === 0) {
      res.status(404).json({
        message: 'TAMA generation not found',
        error: `No TAMA generation found with ID: ${id}`
      })
      return
    }
    
    const tamaGeneration = rows[0]
    
    // Get or create TAMA service
    let tamaService: TamaFileGeneratorService
    try {
      tamaService = req.scope.resolve("tamaFileGeneratorService") as any
    } catch (serviceError) {
      tamaService = new TamaFileGeneratorService(req.scope)
      req.scope.register({
        tamaFileGeneratorService: { resolve: () => tamaService, lifetime: "SINGLETON" }
      })
    }
    
    // Get file path
    const tamaDir = path.join(process.cwd(), 'static', 'settlement', 'tama')
    const filePath = tamaGeneration.file_path || path.join(tamaDir, tamaGeneration.file_name)
    
    let fileContent: string
    
    if (fs.existsSync(filePath)) {
      // Read from file system
      fileContent = fs.readFileSync(filePath, 'utf8')
      console.log(`[Admin TAMA Download] File found on disk: ${filePath}`)
    } else {
      // Regenerate file content from database
      console.log(`[Admin TAMA Download] File not found on disk, regenerating: ${filePath}`)
      
      // Get transactions for this batch (we'll need to store them or regenerate)
      const transactions = await tamaService.getMetrobankTransactions()
      
      if (transactions.length === 0) {
        res.status(404).json({
          message: 'Unable to regenerate TAMA file',
          error: 'No transactions found for regeneration'
        })
        return
      }
      
      // Regenerate file content
      fileContent = tamaService.generateFileContent(
        transactions,
        tamaGeneration.funding_account || "2467246570570" // Default funding account
      )
      
      // Save regenerated file
      await fs.promises.mkdir(tamaDir, { recursive: true })
      await fs.promises.writeFile(filePath, fileContent, 'utf8')
    }
    
    // Update downloaded_at timestamp
    await pgConnection.raw(`
      UPDATE "tama_generation" 
      SET "downloaded_at" = ?, "updated_at" = ?
      WHERE "id" = ?
    `, [new Date(), new Date(), id])
    
    // Set response headers for file download
    res.set({
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="${tamaGeneration.file_name}"`,
      'Cache-Control': 'no-cache',
      'Content-Length': Buffer.byteLength(fileContent, 'utf8').toString()
    })
    
    console.log(`[Admin TAMA Download] ✅ Sending TAMA file: ${tamaGeneration.file_name} (${fileContent.split('\n').length} lines)`)
    
    res.status(200).send(fileContent)
    
  } catch (error) {
    console.error('[Admin TAMA Download] ❌ Error downloading TAMA file:', error)
    res.status(500).json({
      message: 'Failed to download TAMA file',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
