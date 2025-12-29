#!/usr/bin/env tsx
/**
 * Manual File Cleanup Script
 * 
 * Usage:
 *   npm run cleanup
 * 
 * This will:
 * 1. Backup all files to GCS
 * 2. Delete files older than retention period
 * 3. Show statistics
 */

import { scheduledCleanup, getFileBackupService } from '../services/file-backup-service'

async function main() {
  console.log('╔════════════════════════════════════════════╗')
  console.log('║   File Cleanup & Backup Utility            ║')
  console.log('╚════════════════════════════════════════════╝')
  console.log('')

  // Show current stats
  const service = getFileBackupService()
  const stats = await service.getStats()
  
  console.log('📊 Current Storage:')
  console.log('  • Images:', stats.images.files, 'files,', stats.images.size)
  console.log('  • TAMA:', stats.tama.files, 'files,', stats.tama.size)
  console.log('  • DFT:', stats.dft.files, 'files,', stats.dft.size)
  console.log('  • Total:', stats.total.files, 'files,', stats.total.size)
  console.log('')

  // Run cleanup
  console.log('🧹 Starting cleanup...')
  console.log('  • Images: 7 days retention')
  console.log('  • Settlement: 30 days retention')
  console.log('  • Verifying GCS backup before deletion')
  console.log('')

  const result = await scheduledCleanup()

  console.log('')
  console.log('✅ Cleanup Complete!')
  console.log('  • Cleaned:', result.cleaned, 'files')
  console.log('  • Space saved:', (result.spaceSaved / 1024 / 1024).toFixed(2), 'MB')
  console.log('  • Failed:', result.failed, 'files')
  console.log('')

  if (result.errors.length > 0) {
    console.log('❌ Errors:')
    result.errors.forEach(err => {
      console.log(`  • ${err.file}: ${err.error}`)
    })
    console.log('')
  }

  // Show updated stats
  const newStats = await service.getStats()
  console.log('📊 After Cleanup:')
  console.log('  • Total:', newStats.total.files, 'files,', newStats.total.size)
  console.log('')
}

main().catch(console.error)


