#!/usr/bin/env tsx
/**
 * Backup All Files Script
 * 
 * Usage: npm run backup:all
 * 
 * Backs up all files to GCS without deleting local copies
 */

import { getFileBackupService } from '../services/file-backup-service'
import path from 'path'

async function main() {
  console.log('╔════════════════════════════════════════════╗')
  console.log('║   Backup All Files to GCS                  ║')
  console.log('╚════════════════════════════════════════════╝')
  console.log('')

  const service = getFileBackupService()
  
  // Backup all directories
  console.log('📤 Backing up TAMA settlement files...')
  const tamaResult = await service.backupDirectory(
    path.join(process.cwd(), 'static/settlement/tama'),
    {
      folder: 'backups/settlement/tama',
      deleteAfterBackup: false // Don't delete, just backup
    }
  )
  console.log(`  ✅ ${tamaResult.successful} files backed up`)
  
  console.log('')
  console.log('📤 Backing up DFT settlement files...')
  const dftResult = await service.backupDirectory(
    path.join(process.cwd(), 'static/settlement/dft'),
    {
      folder: 'backups/settlement/dft',
      deleteAfterBackup: false
    }
  )
  console.log(`  ✅ ${dftResult.successful} files backed up`)
  
  console.log('')
  console.log('📤 Backing up uploaded images...')
  const staticResult = await service.backupDirectory(
    path.join(process.cwd(), 'static'),
    {
      folder: 'backups/images',
      deleteAfterBackup: false,
      recursive: false // Don't recurse into settlement folder
    }
  )
  console.log(`  ✅ ${staticResult.successful} files backed up`)
  
  console.log('')
  console.log('✅ Backup Complete!')
  console.log(`  • Total files: ${staticResult.successful + tamaResult.successful + dftResult.successful}`)
  console.log(`  • Total size: ${((staticResult.totalSize + tamaResult.totalSize + dftResult.totalSize) / 1024 / 1024).toFixed(2)} MB`)
  console.log(`  • Failed: ${staticResult.failed + tamaResult.failed + dftResult.failed}`)
  console.log('')
  console.log('All files are now backed up to Google Cloud Storage!')
  console.log('Local files are kept for fast access.')
  console.log('')
}

main().catch(console.error)

