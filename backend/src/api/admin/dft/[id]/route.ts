import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { createGCSService } from '../../../../utils/google-cloud-storage'
import * as fs from 'fs'
import * as path from 'path'

/**
 * @oas [delete] /admin/dft/{id}
 * operationId: "AdminDeleteDftGeneration"
 * summary: "Delete DFT Generation"
 * description: "Deletes a DFT generation record and its associated file"
 * x-authenticated: true
 * parameters:
 *   - (path) id {string} The ID of the DFT generation
 * responses:
 *   "200":
 *     description: OK
 * tags:
 *   - Admin DFT
 */
export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { id } = req.params

    let pgConnection: any
    try {
      pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch (e) {
      pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    if (!pgConnection) {
      res.status(500).json({
        message: 'Database connection not available'
      })
      return
    }

    // Get the file info before deleting
    const fileQuery = `
      SELECT file_name, file_path
      FROM dft_generation
      WHERE id = ? AND deleted_at IS NULL
      LIMIT 1
    `
    const fileResults = await pgConnection.raw(fileQuery, [id])
    const fileRows = fileResults?.rows || fileResults || []

    if (fileRows.length === 0) {
      res.status(404).json({
        message: 'DFT generation not found'
      })
      return
    }

    const dftRecord = fileRows[0]
    
    // Soft delete the database record
    await pgConnection.raw(
      'UPDATE dft_generation SET deleted_at = NOW(), updated_at = NOW() WHERE id = ?',
      [id]
    )

    // Delete the physical file if it exists
    try {
      const fileName = dftRecord.file_name
      const filePath = path.join(process.cwd(), 'static', 'settlement', 'dft', fileName)
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        console.log(`[Admin DFT] File deleted: ${filePath}`)
      }
    } catch (fileError) {
      console.warn(`[Admin DFT] Failed to delete file (non-fatal):`, fileError)
    }

    console.log(`[Admin DFT] DFT generation deleted: ${id}`)

    res.status(200).json({
      success: true,
      message: 'DFT generation deleted successfully',
      id
    })

  } catch (error) {
    console.error('[Admin DFT] Error deleting DFT generation:', error)
    res.status(500).json({
      message: 'Failed to delete DFT generation',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * @oas [get] /admin/dft/{id}
 * operationId: "AdminGetDftGeneration"
 * summary: "Get DFT Generation Details"
 * description: "Get details and content preview of a DFT generation"
 * x-authenticated: true
 * parameters:
 *   - (path) id {string} The ID of the DFT generation
 * responses:
 *   "200":
 *     description: OK
 * tags:
 *   - Admin DFT
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { id } = req.params

    let pgConnection: any
    try {
      pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch (e) {
      pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    if (!pgConnection) {
      res.status(500).json({
        message: 'Database connection not available'
      })
      return
    }

    // Get the DFT generation details
    const query = `
      SELECT *
      FROM dft_generation
      WHERE id = ? AND deleted_at IS NULL
      LIMIT 1
    `
    const results = await pgConnection.raw(query, [id])
    const rows = results?.rows || results || []

    if (rows.length === 0) {
      res.status(404).json({
        message: 'DFT generation not found'
      })
      return
    }

    const dftRecord = rows[0]
    
    // Try to read file content preview (first 10 lines)
    let filePreview: string | null = null
    try {
      const fileName = dftRecord.file_name
      const filePath = path.join(process.cwd(), 'static', 'settlement', 'dft', fileName)

      let fullContent: string | null = null

      if (fs.existsSync(filePath)) {
        fullContent = fs.readFileSync(filePath, 'utf-8')
      } else {
        const gcs = createGCSService()
        if (gcs) {
          fullContent = await gcs.readTextFile(`settlement/dft/${fileName}`)
        }
      }

      if (fullContent) {
        filePreview = fullContent.split('\n').slice(0, 10).join('\n')
      }
    } catch (fileError) {
      console.warn(`[Admin DFT] Failed to read file preview:`, fileError)
    }

    res.status(200).json({
      dft_generation: {
        id: dftRecord.id,
        batch_id: dftRecord.batch_id,
        generation_date: dftRecord.generation_date,
        file_name: dftRecord.file_name,
        status: dftRecord.status,
        transaction_count: dftRecord.transaction_count,
        total_amount: parseFloat(dftRecord.total_amount),
        currency: dftRecord.currency,
        generated_by: dftRecord.generated_by,
        created_at: dftRecord.created_at,
        updated_at: dftRecord.updated_at,
        file_preview: filePreview
      }
    })

  } catch (error) {
    console.error('[Admin DFT] Error getting DFT generation:', error)
    res.status(500).json({
      message: 'Failed to get DFT generation',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

