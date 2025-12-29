import { MedusaContainer } from "@medusajs/framework/types"
import { getFileBackupService } from "../services/file-backup-service"

/**
 * File Backup Loader
 * 
 * Initializes the file backup system on server startup
 * 
 * Note: Cleanup job is registered as a Medusa scheduled job in /jobs/file-cleanup-job.ts
 */
export default async function fileBackupLoader(container: MedusaContainer): Promise<void> {
  console.log('[File Backup Loader] ========== INITIALIZING ==========')
  
  try {
    // Register the backup service
    const backupService = getFileBackupService()
    
    container.register({
      fileBackupService: {
        resolve: () => backupService,
        lifetime: "SINGLETON"
      }
    })
    
    console.log('[File Backup Loader] Backup service registered')
    
    // Show current storage stats
    const stats = await backupService.getStats()
    console.log('[File Backup Loader] Current storage:', stats)
    
    console.log('[File Backup Loader] ========== INITIALIZED ==========')
    console.log('[File Backup Loader] Scheduled job "file-cleanup" will run daily at 2 AM')
  } catch (error) {
    console.error('[File Backup Loader] ========== FAILED ==========', error)
  }
}

