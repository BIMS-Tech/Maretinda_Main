import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import * as fs from 'fs'
import * as path from 'path'
import DftFileGeneratorService from '../../../../../services/dft-file-generator'

/**
 * @oas [get] /admin/dft/{id}/download
 * operationId: "AdminDownloadDftFile"
 * summary: "Download DFT File"
 * description: "Downloads the generated DFT file for the specified generation."
 * parameters:
 *   - (path) id=* {string} The ID of the DFT generation
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       text/plain:
 *         schema:
 *           type: string
 *   "404":
 *     description: DFT generation not found
 * x-authenticated: true
 * tags:
 *   - Admin DFT
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { id } = req.params

    if (!id) {
      res.status(400).json({
        message: 'DFT generation ID is required',
        error: 'Missing ID parameter'
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

    // Get DFT generation record
    const results = await pgConnection.raw(`
      SELECT * FROM "dft_generation"
      WHERE id = ? AND deleted_at IS NULL
    `, [id])

    const rows = results?.rows || results || []
    if (!rows || rows.length === 0) {
      res.status(404).json({
        message: 'DFT generation not found',
        error: `No DFT generation found with ID: ${id}`
      })
      return
    }

    const dftGeneration = rows[0]

    // Get or create DFT service
    let dftService: DftFileGeneratorService
    try {
      dftService = req.scope.resolve("dftFileGeneratorService") as any
    } catch (serviceError) {
      dftService = new DftFileGeneratorService(req.scope)
      req.scope.register({
        dftFileGeneratorService: { resolve: () => dftService, lifetime: "SINGLETON" }
      })
    }

    // Try to read file from disk
    const dftDir = path.join(process.cwd(), 'static', 'settlement', 'dft')
    const filePath = dftGeneration.file_path || path.join(dftDir, dftGeneration.file_name)

    let fileContent: string

    if (await fs.promises.access(filePath).then(() => true).catch(() => false)) {
      console.log(`[Admin DFT Download] File found on disk: ${filePath}`)
      fileContent = await fs.promises.readFile(filePath, 'utf-8')
    } else {
      console.log(`[Admin DFT Download] File not found on disk, regenerating: ${filePath}`)

      // Regenerate file
      const transactions = await dftService.getNonMetrobankTransactions()
      
      if (!transactions || transactions.length === 0) {
        res.status(500).json({
          message: 'Unable to regenerate DFT file',
          error: 'No transactions available'
        })
        return
      }

      fileContent = dftService.generateFileContent(transactions)

      // Save regenerated file
      await fs.promises.mkdir(dftDir, { recursive: true })
      await fs.promises.writeFile(filePath, fileContent)

      // Update file path in database
      await pgConnection.raw(`
        UPDATE "dft_generation" 
        SET file_path = ?, updated_at = NOW()
        WHERE id = ?
      `, [filePath, id])
    }

    // Send file as download
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Content-Disposition', `attachment; filename="${dftGeneration.file_name}"`)
    res.status(200).send(fileContent)

    console.log(`[Admin DFT Download] ✅ Sending DFT file: ${dftGeneration.file_name} (${fileContent.split('\n').length} lines)`)

  } catch (error) {
    console.error('[Admin DFT Download] ❌ Error downloading DFT file:', error)
    res.status(500).json({
      message: 'Failed to download DFT file',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

