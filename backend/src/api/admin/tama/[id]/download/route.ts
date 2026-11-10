import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import TamaFileGeneratorService from '../../../../../services/tama-file-generator'
import { readSettlementFile, saveSettlementFile } from '../../../../../lib/settlement-files'

const XLS_CONTENT_TYPE = 'application/vnd.ms-excel'

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
    const stored = await readSettlementFile(pgConnection, 'tama', id)
    const xlsFileName: string = stored?.file_name ?? tamaGeneration.file_name.replace(/\.txt$/, '.xls')
    let fileBuffer: Buffer | null = stored ? Buffer.from(stored.content) : null

    // Generations from before files were kept: rebuild it once and keep it
    if (!fileBuffer) {
      console.log(`[Admin TAMA Download] Regenerating XLS for: ${xlsFileName}`)

      let tamaService: TamaFileGeneratorService
      try {
        tamaService = req.scope.resolve("tamaFileGeneratorService") as any
      } catch (serviceError) {
        tamaService = new TamaFileGeneratorService(req.scope)
        req.scope.register({
          tamaFileGeneratorService: { resolve: () => tamaService, lifetime: "SINGLETON" }
        })
      }

      const transactions = await tamaService.getMetrobankTransactions()

      if (transactions.length === 0) {
        res.status(404).json({
          message: 'Unable to regenerate TAMA file',
          error: 'No transactions found for regeneration'
        })
        return
      }

      fileBuffer = tamaService.generateXlsBuffer(
        transactions,
        tamaGeneration.funding_account || "2467246570570"
      )
      await saveSettlementFile(pgConnection, {
        kind: 'tama',
        generation_id: id,
        file_name: xlsFileName,
        content_type: XLS_CONTENT_TYPE,
        content: fileBuffer,
      })
    }

    // Update downloaded_at timestamp
    await pgConnection.raw(`
      UPDATE "tama_generation"
      SET "downloaded_at" = ?, "updated_at" = ?
      WHERE "id" = ?
    `, [new Date(), new Date(), id])

    res.set({
      'Content-Type': XLS_CONTENT_TYPE,
      'Content-Disposition': `attachment; filename="${xlsFileName}"`,
      'Cache-Control': 'no-cache',
      'Content-Length': fileBuffer.length.toString()
    })

    console.log(`[Admin TAMA Download] ✅ Sent: ${xlsFileName} (${fileBuffer.length} bytes)`)

    res.status(200).send(fileBuffer)

  } catch (error) {
    console.error('[Admin TAMA Download] ❌ Error downloading TAMA file:', error)
    res.status(500).json({
      message: 'Failed to download TAMA file',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
