import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getFileBackupService, scheduledCleanup } from "../../../services/file-backup-service"
import { runManualCleanup } from "../../../jobs/file-cleanup-job"

/**
 * Get backup and storage statistics
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const backupService = getFileBackupService()
    
    const stats = await backupService.getStats()
    const auditLog = backupService.getAuditLog(50) // Last 50 entries
    
    res.status(200).json({
      storage: stats,
      recentActivity: auditLog,
      schedule: "Daily at 2 AM (Medusa scheduled job)"
    })
  } catch (error) {
    console.error('[FileBackup API] Get stats error:', error)
    res.status(500).json({
      message: 'Failed to get backup stats',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * Trigger manual cleanup
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { action, olderThanDays } = req.body as any
    
    if (action === 'cleanup') {
      console.log('[FileBackup API] Manual cleanup triggered')
      
      const result = await scheduledCleanup()
      
      res.status(200).json({
        message: 'Cleanup completed',
        result: {
          cleaned: result.cleaned,
          failed: result.failed,
          spaceSaved: `${(result.spaceSaved / 1024 / 1024).toFixed(2)} MB`,
          errors: result.errors
        }
      })
    } else if (action === 'run-job') {
      await runManualCleanup()
      
      res.status(200).json({
        message: 'Cleanup job executed'
      })
    } else {
      res.status(400).json({
        message: 'Invalid action. Use "cleanup" or "run-job"'
      })
    }
  } catch (error) {
    console.error('[FileBackup API] Manual cleanup error:', error)
    res.status(500).json({
      message: 'Cleanup failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

