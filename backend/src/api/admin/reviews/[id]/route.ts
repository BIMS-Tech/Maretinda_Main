import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * Delete a review
 * Admin can delete reviews based on vendor request
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

    // Check if review exists
    const checkQuery = `SELECT id FROM review WHERE id = $1 AND deleted_at IS NULL LIMIT 1`
    const checkResult = await pgConnection.raw(checkQuery, [id])
    const checkRows = checkResult?.rows || checkResult || []

    if (checkRows.length === 0) {
      res.status(404).json({
        message: 'Review not found'
      })
      return
    }

    // Soft delete the review
    const deleteQuery = `UPDATE review SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`
    await pgConnection.raw(deleteQuery, [id])

    console.log(`[Admin Review] Review deleted: ${id}`)

    res.json({
      id,
      deleted: true
    })
  } catch (error) {
    console.error('[Admin Review Delete] Error:', error)
    res.status(500).json({
      message: 'Failed to delete review',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

