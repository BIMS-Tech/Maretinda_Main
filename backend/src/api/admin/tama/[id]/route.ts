import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { createGCSService } from '../../../../utils/google-cloud-storage'
import * as fs from 'fs'
import * as path from 'path'

/**
 * @oas [delete] /admin/tama/{id}
 * operationId: "AdminDeleteTamaGeneration"
 * summary: "Delete TAMA Generation"
 * description: "Deletes a TAMA generation record and its associated file"
 * x-authenticated: true
 * parameters:
 *   - (path) id {string} The ID of the TAMA generation
 * responses:
 *   "200":
 *     description: OK
 * tags:
 *   - Admin TAMA
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
      FROM tama_generation
      WHERE id = ? AND deleted_at IS NULL
      LIMIT 1
    `
    const fileResults = await pgConnection.raw(fileQuery, [id])
    const fileRows = fileResults?.rows || fileResults || []

    if (fileRows.length === 0) {
      res.status(404).json({
        message: 'TAMA generation not found'
      })
      return
    }

    const tamaRecord = fileRows[0]
    
    // Soft delete the database record
    await pgConnection.raw(
      'UPDATE tama_generation SET deleted_at = NOW(), updated_at = NOW() WHERE id = ?',
      [id]
    )

    // Delete the physical file if it exists
    try {
      const fileName = tamaRecord.file_name
      const filePath = path.join(process.cwd(), 'static', 'settlement', 'tama', fileName)
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        console.log(`[Admin TAMA] File deleted: ${filePath}`)
      }
    } catch (fileError) {
      console.warn(`[Admin TAMA] Failed to delete file (non-fatal):`, fileError)
    }

    console.log(`[Admin TAMA] TAMA generation deleted: ${id}`)

    res.status(200).json({
      success: true,
      message: 'TAMA generation deleted successfully',
      id
    })

  } catch (error) {
    console.error('[Admin TAMA] Error deleting TAMA generation:', error)
    res.status(500).json({
      message: 'Failed to delete TAMA generation',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * @oas [get] /admin/tama/{id}
 * operationId: "AdminGetTamaGeneration"
 * summary: "Get TAMA Generation Details"
 * description: "Get details and content preview of a TAMA generation"
 * x-authenticated: true
 * parameters:
 *   - (path) id {string} The ID of the TAMA generation
 * responses:
 *   "200":
 *     description: OK
 * tags:
 *   - Admin TAMA
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

    // Get the TAMA generation details
    const query = `
      SELECT *
      FROM tama_generation
      WHERE id = ? AND deleted_at IS NULL
      LIMIT 1
    `
    const results = await pgConnection.raw(query, [id])
    const rows = results?.rows || results || []

    if (rows.length === 0) {
      res.status(404).json({
        message: 'TAMA generation not found'
      })
      return
    }

    const tamaRecord = rows[0]
    
    // Try to read file content preview (first 20 lines)
    let filePreview: string | null = null
    try {
      const fileName = tamaRecord.file_name
      const filePath = path.join(process.cwd(), 'static', 'settlement', 'tama', fileName)

      let fullContent: string | null = null

      if (fs.existsSync(filePath)) {
        fullContent = fs.readFileSync(filePath, 'utf-8')
      } else {
        const gcs = createGCSService()
        if (gcs) {
          fullContent = await gcs.readTextFile(`settlement/tama/${fileName}`)
        }
      }

      if (fullContent) {
        filePreview = fullContent.split('\n').slice(0, 20).join('\n')
      }
    } catch (fileError) {
      console.warn(`[Admin TAMA] Failed to read file preview:`, fileError)
    }

    res.status(200).json({
      tama_generation: {
        id: tamaRecord.id,
        batch_id: tamaRecord.batch_id,
        generation_date: tamaRecord.generation_date,
        file_name: tamaRecord.file_name,
        status: tamaRecord.status,
        transaction_count: tamaRecord.transaction_count,
        total_amount: parseFloat(tamaRecord.total_amount),
        currency: tamaRecord.currency,
        funding_account: tamaRecord.funding_account,
        generated_by: tamaRecord.generated_by,
        created_at: tamaRecord.created_at,
        updated_at: tamaRecord.updated_at,
        file_preview: filePreview
      }
    })

  } catch (error) {
    console.error('[Admin TAMA] Error getting TAMA generation:', error)
    res.status(500).json({
      message: 'Failed to get TAMA generation',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

