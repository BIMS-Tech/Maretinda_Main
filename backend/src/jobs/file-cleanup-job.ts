/**
 * File Cleanup Scheduled Job (Medusa v2)
 * 
 * Runs periodically to:
 * 1. Backup files to GCS
 * 2. Delete local files older than retention period
 * 3. Log all operations
 */

import type { MedusaContainer } from "@medusajs/framework/types"
import { scheduledCleanup } from '../services/file-backup-service'

// Medusa v2 scheduled job configuration
export const config = {
  name: "file-cleanup",
  schedule: "0 2 * * *", // Every day at 2 AM (can override with CLEANUP_SCHEDULE env)
}

// Job handler
export default async function fileCleanupHandler(container: MedusaContainer): Promise<void> {
  console.log('[FileCleanupJob] === SCHEDULED CLEANUP STARTED ===')
  
  try {
    const result = await scheduledCleanup()
    
    console.log('[FileCleanupJob] === CLEANUP COMPLETED ===', {
      cleaned: result.cleaned,
      failed: result.failed,
      spaceSaved: `${(result.spaceSaved / 1024 / 1024).toFixed(2)} MB`
    })
    
    if (result.errors.length > 0) {
      console.error('[FileCleanupJob] Errors during cleanup:', result.errors)
    }
  } catch (error) {
    console.error('[FileCleanupJob] === CLEANUP FAILED ===', error)
    throw error
  }
}

// Helper function for manual cleanup (use via API or scripts)
export const runManualCleanup = async (): Promise<void> => {
  console.log('[FileCleanupJob] === MANUAL CLEANUP STARTED ===')
  
  try {
    const result = await scheduledCleanup()
    
    console.log('[FileCleanupJob] === MANUAL CLEANUP COMPLETED ===', {
      cleaned: result.cleaned,
      spaceSaved: `${(result.spaceSaved / 1024 / 1024).toFixed(2)} MB`
    })
  } catch (error) {
    console.error('[FileCleanupJob] === MANUAL CLEANUP FAILED ===', error)
    throw error
  }
}

