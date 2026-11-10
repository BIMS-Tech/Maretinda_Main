import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import DftFileGeneratorService from '../../../../../services/dft-file-generator'
import { readSettlementFile, saveSettlementFile } from '../../../../../lib/settlement-files'

const XLS_CONTENT_TYPE = 'application/vnd.ms-excel'

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
    const stored = await readSettlementFile(pgConnection, 'dft', id)
    const xlsFileName: string = stored?.file_name ?? dftGeneration.file_name.replace(/\.txt$/, '.xls')
    let fileBuffer: Buffer | null = stored ? Buffer.from(stored.content) : null

    // Generations from before files were kept: rebuild it once and keep it
    if (!fileBuffer) {
      console.log(`[Admin DFT Download] Regenerating XLS for: ${xlsFileName}`)

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

      fileBuffer = dftService.generateXlsBuffer(transactions)
      await saveSettlementFile(pgConnection, {
        kind: 'dft',
        generation_id: id,
        file_name: xlsFileName,
        content_type: XLS_CONTENT_TYPE,
        content: fileBuffer,
      })
    }

    // Send file as download
    res.setHeader('Content-Type', XLS_CONTENT_TYPE)
    res.setHeader('Content-Disposition', `attachment; filename="${xlsFileName}"`)
    res.status(200).send(fileBuffer)

    console.log(`[Admin DFT Download] ✅ Sent: ${xlsFileName} (${fileBuffer.length} bytes)`)

  } catch (error) {
    console.error('[Admin DFT Download] ❌ Error:', error)
    res.status(500).json({
      message: 'Failed to download DFT file',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
