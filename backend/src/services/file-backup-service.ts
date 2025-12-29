/**
 * File Backup & Cleanup Service
 * 
 * Strategy:
 * 1. Save files locally for instant access
 * 2. Upload to GCS in background
 * 3. Verify GCS upload succeeded
 * 4. Delete local file after retention period
 * 5. Keep audit log of all operations
 * 
 * Benefits:
 * - Instant user response
 * - Automatic cloud backup
 * - Disk space management
 * - Audit trail
 */

import { createGCSService } from '../utils/google-cloud-storage'
import fs from 'fs'
import path from 'path'

export interface BackupResult {
  success: boolean
  localPath?: string
  gcsPath?: string
  fileSize?: number
  error?: string
}

export interface CleanupResult {
  cleaned: number
  failed: number
  spaceSaved: number
  errors: Array<{ file: string; error: string }>
}

class FileBackupService {
  private gcs: ReturnType<typeof createGCSService>
  private auditLog: Array<{
    timestamp: Date
    action: 'upload' | 'backup' | 'cleanup'
    file: string
    success: boolean
    error?: string
  }> = []

  constructor() {
    this.gcs = createGCSService()
  }

  /**
   * Backup a file to GCS
   */
  async backupFile(
    localPath: string,
    options: {
      folder?: string
      deleteAfterBackup?: boolean
      metadata?: Record<string, string>
    } = {}
  ): Promise<BackupResult> {
    try {
      // Check if local file exists
      if (!fs.existsSync(localPath)) {
        return { success: false, error: 'File not found' }
      }

      // Read file
      const buffer = fs.readFileSync(localPath)
      const filename = path.basename(localPath)
      const stats = fs.statSync(localPath)

      // Determine content type
      const contentType = this.getContentType(filename)

      // Backup to GCS
      if (!this.gcs) {
        console.warn('[FileBackup] GCS not configured, skipping backup')
        return { success: false, error: 'GCS not configured' }
      }

      const folder = options.folder || this.getFolderByType(filename)
      const result = await this.gcs.uploadFile(buffer, filename, {
        folder,
        contentType,
        metadata: {
          ...options.metadata,
          originalPath: localPath,
          backedUpAt: new Date().toISOString()
        },
        makePublic: false // Keep backups private
      })

      if (!result.success) {
        this.logAction('backup', filename, false, result.error)
        return { success: false, error: result.error }
      }

      console.log('[FileBackup] Backup success:', {
        file: filename,
        gcsPath: result.fileName,
        size: buffer.length
      })

      this.logAction('backup', filename, true)

      // Delete local file if requested
      if (options.deleteAfterBackup) {
        try {
          fs.unlinkSync(localPath)
          console.log('[FileBackup] Local file deleted:', localPath)
          this.logAction('cleanup', filename, true)
        } catch (error) {
          console.error('[FileBackup] Failed to delete local file:', error)
        }
      }

      return {
        success: true,
        localPath,
        gcsPath: result.fileName,
        fileSize: stats.size
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Backup failed'
      this.logAction('backup', path.basename(localPath), false, errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  /**
   * Backup all files in a directory
   */
  async backupDirectory(
    dirPath: string,
    options: {
      folder?: string
      recursive?: boolean
      deleteAfterBackup?: boolean
      olderThan?: number // Days
    } = {}
  ): Promise<{ successful: number; failed: number; totalSize: number }> {
    const results = { successful: 0, failed: 0, totalSize: 0 }

    try {
      if (!fs.existsSync(dirPath)) {
        console.warn('[FileBackup] Directory not found:', dirPath)
        return results
      }

      const files = fs.readdirSync(dirPath)
      const cutoffDate = options.olderThan 
        ? Date.now() - (options.olderThan * 24 * 60 * 60 * 1000)
        : 0

      for (const file of files) {
        const filePath = path.join(dirPath, file)
        const stats = fs.statSync(filePath)

        // Skip if newer than cutoff
        if (cutoffDate && stats.mtimeMs > cutoffDate) {
          continue
        }

        // Skip directories unless recursive
        if (stats.isDirectory()) {
          if (options.recursive) {
            const subResults = await this.backupDirectory(filePath, options)
            results.successful += subResults.successful
            results.failed += subResults.failed
            results.totalSize += subResults.totalSize
          }
          continue
        }

        // Backup file
        const result = await this.backupFile(filePath, {
          folder: options.folder,
          deleteAfterBackup: options.deleteAfterBackup
        })

        if (result.success) {
          results.successful++
          results.totalSize += result.fileSize || 0
        } else {
          results.failed++
        }
      }

      console.log('[FileBackup] Directory backup complete:', {
        directory: dirPath,
        successful: results.successful,
        failed: results.failed,
        totalSize: results.totalSize
      })

      return results
    } catch (error) {
      console.error('[FileBackup] Directory backup error:', error)
      return results
    }
  }

  /**
   * Clean up old local files that have been backed up to GCS
   */
  async cleanupOldFiles(
    dirPath: string,
    olderThanDays: number = 7,
    verifyGCSBackup: boolean = true
  ): Promise<CleanupResult> {
    const result: CleanupResult = {
      cleaned: 0,
      failed: 0,
      spaceSaved: 0,
      errors: []
    }

    try {
      if (!fs.existsSync(dirPath)) {
        return result
      }

      const cutoffDate = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000)
      const files = fs.readdirSync(dirPath)

      for (const file of files) {
        const filePath = path.join(dirPath, file)
        const stats = fs.statSync(filePath)

        // Skip directories (like settlement folder)
        if (!stats.isFile()) {
          continue
        }
        
        // Skip if too new
        if (stats.mtimeMs > cutoffDate) {
          continue
        }

        // Verify file exists in GCS before deleting
        if (verifyGCSBackup && this.gcs) {
          const folder = this.getFolderByType(file)
          const gcsPath = `${folder}/${file}`
          const exists = await this.gcs.fileExists(gcsPath)

          if (!exists) {
            console.warn('[FileBackup] File not in GCS, skipping cleanup:', file)
            result.failed++
            result.errors.push({
              file,
              error: 'Not found in GCS backup'
            })
            continue
          }
        }

        // Delete local file
        try {
          fs.unlinkSync(filePath)
          result.cleaned++
          result.spaceSaved += stats.size
          console.log('[FileBackup] Cleaned up:', file, `(${stats.size} bytes)`)
          this.logAction('cleanup', file, true)
        } catch (error) {
          result.failed++
          const errorMsg = error instanceof Error ? error.message : 'Delete failed'
          result.errors.push({ file, error: errorMsg })
          console.error('[FileBackup] Cleanup failed:', file, errorMsg)
          this.logAction('cleanup', file, false, errorMsg)
        }
      }

      console.log('[FileBackup] Cleanup complete:', {
        cleaned: result.cleaned,
        failed: result.failed,
        spaceSaved: `${(result.spaceSaved / 1024 / 1024).toFixed(2)} MB`
      })

      return result
    } catch (error) {
      console.error('[FileBackup] Cleanup error:', error)
      return result
    }
  }

  /**
   * Clean up all backup-eligible directories
   */
  async cleanupAll(olderThanDays: number = 7): Promise<CleanupResult> {
    console.log('[FileBackup] Starting full cleanup...')
    
    const directories = [
      path.join(process.cwd(), 'static/settlement/tama'),
      path.join(process.cwd(), 'static/settlement/dft'),
    ]

    const totalResult: CleanupResult = {
      cleaned: 0,
      failed: 0,
      spaceSaved: 0,
      errors: []
    }

    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        console.log('[FileBackup] Directory does not exist, skipping:', dir)
        continue
      }
      const result = await this.cleanupOldFiles(dir, olderThanDays, true)
      totalResult.cleaned += result.cleaned
      totalResult.failed += result.failed
      totalResult.spaceSaved += result.spaceSaved
      totalResult.errors.push(...result.errors)
    }

    console.log('[FileBackup] Full cleanup complete:', {
      cleaned: totalResult.cleaned,
      failed: totalResult.failed,
      spaceSaved: `${(totalResult.spaceSaved / 1024 / 1024).toFixed(2)} MB`
    })

    return totalResult
  }

  /**
   * Get folder name based on file type
   */
  private getFolderByType(filename: string): string {
    const ext = path.extname(filename).toLowerCase()
    
    // TAMA files
    if (filename.includes('tama') || filename.includes('TAMA')) {
      return 'backups/tama'
    }
    
    // DFT files
    if (filename.includes('dft') || filename.includes('DFT')) {
      return 'backups/dft'
    }
    
    // Images
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    if (imageExts.includes(ext)) {
      return 'backups/images'
    }
    
    // Documents
    const docExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt']
    if (docExts.includes(ext)) {
      return 'backups/documents'
    }
    
    return 'backups/other'
  }

  /**
   * Get content type based on file extension
   */
  private getContentType(filename: string): string {
    const ext = path.extname(filename).toLowerCase()
    
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.csv': 'text/csv',
      '.txt': 'text/plain'
    }
    
    return mimeTypes[ext] || 'application/octet-stream'
  }

  /**
   * Log action for audit trail
   */
  private logAction(
    action: 'upload' | 'backup' | 'cleanup',
    file: string,
    success: boolean,
    error?: string
  ) {
    this.auditLog.push({
      timestamp: new Date(),
      action,
      file,
      success,
      error
    })

    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000)
    }
  }

  /**
   * Get audit log
   */
  getAuditLog(limit: number = 100) {
    return this.auditLog.slice(-limit).reverse()
  }

  /**
   * Get statistics
   */
  async getStats() {
    const staticDir = path.join(process.cwd(), 'static')
    const tamaDir = path.join(process.cwd(), 'static/settlement/tama')
    const dftDir = path.join(process.cwd(), 'static/settlement/dft')

    const getDirStats = (dir: string, recursive: boolean = false) => {
      if (!fs.existsSync(dir)) return { count: 0, size: 0 }
      
      const files = fs.readdirSync(dir)
      let totalSize = 0
      let count = 0
      
      files.forEach(file => {
        const filePath = path.join(dir, file)
        const stats = fs.statSync(filePath)
        if (stats.isFile()) {
          totalSize += stats.size
          count++
        } else if (stats.isDirectory() && recursive) {
          const subStats = getDirStats(filePath, true)
          totalSize += subStats.size
          count += subStats.count
        }
      })
      
      return { count, size: totalSize }
    }

    // Get stats for images (exclude settlement folder)
    const getImageStats = () => {
      if (!fs.existsSync(staticDir)) return { count: 0, size: 0 }
      
      const files = fs.readdirSync(staticDir)
      let totalSize = 0
      let count = 0
      
      files.forEach(file => {
        if (file === 'settlement') return // Skip settlement folder
        
        const filePath = path.join(staticDir, file)
        const stats = fs.statSync(filePath)
        if (stats.isFile()) {
          totalSize += stats.size
          count++
        }
      })
      
      return { count, size: totalSize }
    }

    const imageStats = getImageStats()
    const tamaStats = getDirStats(tamaDir)
    const dftStats = getDirStats(dftDir)

    return {
      images: {
        files: imageStats.count,
        size: `${(imageStats.size / 1024 / 1024).toFixed(2)} MB`
      },
      tama: {
        files: tamaStats.count,
        size: `${(tamaStats.size / 1024 / 1024).toFixed(2)} MB`
      },
      dft: {
        files: dftStats.count,
        size: `${(dftStats.size / 1024 / 1024).toFixed(2)} MB`
      },
      total: {
        files: imageStats.count + tamaStats.count + dftStats.count,
        size: `${((imageStats.size + tamaStats.size + dftStats.size) / 1024 / 1024).toFixed(2)} MB`
      }
    }
  }
}

// Singleton instance
let fileBackupServiceInstance: FileBackupService | null = null

export const getFileBackupService = (): FileBackupService => {
  if (!fileBackupServiceInstance) {
    fileBackupServiceInstance = new FileBackupService()
  }
  return fileBackupServiceInstance
}

/**
 * Helper function: Backup file with auto-cleanup
 */
export const backupAndCleanup = async (
  localPath: string,
  retentionDays: number = 7
): Promise<BackupResult> => {
  const service = getFileBackupService()
  
  // Get file age
  const stats = fs.statSync(localPath)
  const fileAgeDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24)
  
  // Backup to GCS
  const result = await service.backupFile(localPath, {
    deleteAfterBackup: fileAgeDays > retentionDays, // Only delete old files
    metadata: {
      fileAge: `${fileAgeDays.toFixed(1)} days`
    }
  })
  
  return result
}

/**
 * Scheduled cleanup function (call this from a cron job)
 */
export const scheduledCleanup = async (): Promise<CleanupResult> => {
  console.log('[FileBackup] === SCHEDULED CLEANUP STARTED ===')
  
  const service = getFileBackupService()
  
  // Note: We clean specific folders, not the entire static directory
  // This prevents accidentally deleting settlement files with image retention period
  
  // Cleanup TAMA settlement files (30 days retention)
  const tamaResult = await service.cleanupOldFiles(
    path.join(process.cwd(), 'static/settlement/tama'),
    30, // 30 days (important compliance files)
    true // Verify GCS backup before deleting
  )
  
  // Cleanup DFT settlement files (30 days retention)
  const dftResult = await service.cleanupOldFiles(
    path.join(process.cwd(), 'static/settlement/dft'),
    30, // 30 days (important compliance files)
    true
  )
  
  // Cleanup uploaded images (7 days retention)
  // Only cleanup image files in static root, not settlement folder
  const imageResult = await service.cleanupOldFiles(
    path.join(process.cwd(), 'static'),
    7, // 7 days
    true,
  )
  
  const totalResult: CleanupResult = {
    cleaned: imageResult.cleaned + tamaResult.cleaned + dftResult.cleaned,
    failed: imageResult.failed + tamaResult.failed + dftResult.failed,
    spaceSaved: imageResult.spaceSaved + tamaResult.spaceSaved + dftResult.spaceSaved,
    errors: [...imageResult.errors, ...tamaResult.errors, ...dftResult.errors]
  }
  
  console.log('[FileBackup] === SCHEDULED CLEANUP COMPLETE ===', {
    cleaned: totalResult.cleaned,
    spaceSaved: `${(totalResult.spaceSaved / 1024 / 1024).toFixed(2)} MB`,
    failed: totalResult.failed
  })
  
  return totalResult
}

