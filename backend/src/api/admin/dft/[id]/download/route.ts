import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import * as fs from 'fs'
import * as path from 'path'
import DftFileGeneratorService from '../../../../../services/dft-file-generator'
import { createGCSService } from '../../../../../utils/google-cloud-storage'

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
    const gcsPath = `settlement/dft/${dftGeneration.file_name}`
    const gcs = createGCSService()

    let fileContent: string | null = null

    // 1. Try local disk
    const dftDir = path.join(process.cwd(), 'static', 'settlement', 'dft')
    const filePath = dftGeneration.file_path || path.join(dftDir, dftGeneration.file_name)

    if (await fs.promises.access(filePath).then(() => true).catch(() => false)) {
      console.log(`[Admin DFT Download] File found on disk: ${filePath}`)
      fileContent = await fs.promises.readFile(filePath, 'utf-8')
    }

    // 2. Try GCS
    if (!fileContent && gcs) {
      console.log(`[Admin DFT Download] Checking GCS: ${gcsPath}`)
      fileContent = await gcs.readTextFile(gcsPath)
      if (fileContent) {
        console.log(`[Admin DFT Download] File found in GCS: ${gcsPath}`)
      }
    }

    // 3. Regenerate from transactions
    if (!fileContent) {
      console.log(`[Admin DFT Download] Regenerating file for: ${dftGeneration.file_name}`)

      let dftService: DftFileGeneratorService
      try {
        dftService = req.scope.resolve("dftFileGeneratorService") as any
      } catch (serviceError) {
        dftService = new DftFileGeneratorService(req.scope)
        req.scope.register({
          dftFileGeneratorService: { resolve: () => dftService, lifetime: "SINGLETON" }
        })
      }

      const transactions = await dftService.getNonMetrobankTransactions()

      if (!transactions || transactions.length === 0) {
        res.status(404).json({
          message: 'Unable to regenerate DFT file',
          error: 'No transactions available'
        })
        return
      }

      fileContent = dftService.generateFileContent(transactions)

      // Save to GCS
      if (gcs) {
        const saved = await gcs.saveTextFile(gcsPath, fileContent, 'text/plain')
        if (saved.success) {
          console.log(`[Admin DFT Download] Saved to GCS: ${gcsPath}`)
        } else {
          console.warn(`[Admin DFT Download] GCS save failed:`, saved.error)
        }
      }

      // Try local disk as well (non-fatal)
      try {
        await fs.promises.mkdir(dftDir, { recursive: true })
        await fs.promises.writeFile(filePath, fileContent)
      } catch (writeError) {
        console.warn('[Admin DFT Download] Could not save to local disk (read-only filesystem):', (writeError as Error).message)
      }
    }

    // Send file as download
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Content-Disposition', `attachment; filename="${dftGeneration.file_name}"`)
    res.status(200).send(fileContent)

    console.log(`[Admin DFT Download] ✅ Sent: ${dftGeneration.file_name} (${fileContent.split('\n').length} lines)`)

  } catch (error) {
    console.error('[Admin DFT Download] ❌ Error:', error)
    res.status(500).json({
      message: 'Failed to download DFT file',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
