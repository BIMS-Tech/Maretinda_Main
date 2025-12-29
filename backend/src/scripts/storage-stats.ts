#!/usr/bin/env tsx
/**
 * Storage Statistics Script
 * 
 * Usage: npm run storage:stats
 * 
 * Shows:
 * - Current disk usage
 * - File counts
 * - Recent backup activity
 */

import { getFileBackupService } from '../services/file-backup-service'

async function main() {
  console.log('╔════════════════════════════════════════════╗')
  console.log('║   Storage Statistics                       ║')
  console.log('╚════════════════════════════════════════════╝')
  console.log('')

  const service = getFileBackupService()
  
  // Get stats
  const stats = await service.getStats()
  
  console.log('📊 Local Storage:')
  console.log('  ┌──────────────┬────────┬────────────┐')
  console.log('  │ Directory    │ Files  │ Size       │')
  console.log('  ├──────────────┼────────┼────────────┤')
  console.log(`  │ Images       │ ${String(stats.images.files).padEnd(6)} │ ${stats.images.size.padEnd(10)} │`)
  console.log(`  │ TAMA Files   │ ${String(stats.tama.files).padEnd(6)} │ ${stats.tama.size.padEnd(10)} │`)
  console.log(`  │ DFT Files    │ ${String(stats.dft.files).padEnd(6)} │ ${stats.dft.size.padEnd(10)} │`)
  console.log('  ├──────────────┼────────┼────────────┤')
  console.log(`  │ TOTAL        │ ${String(stats.total.files).padEnd(6)} │ ${stats.total.size.padEnd(10)} │`)
  console.log('  └──────────────┴────────┴────────────┘')
  console.log('')

  // Get recent activity
  const activity = service.getAuditLog(10)
  
  if (activity.length > 0) {
    console.log('📝 Recent Activity (last 10):')
    activity.forEach(log => {
      const icon = log.success ? '✅' : '❌'
      const action = log.action.toUpperCase().padEnd(7)
      console.log(`  ${icon} ${action} ${log.file}`)
    })
    console.log('')
  }

  // Cleanup recommendations
  const totalSizeMB = parseFloat(stats.total.size)
  if (totalSizeMB > 1000) {
    console.log('⚠️  Storage Warning:')
    console.log(`  Total size (${stats.total.size}) exceeds 1GB`)
    console.log('  Recommendation: Run cleanup with:')
    console.log('    npm run cleanup')
    console.log('')
  } else {
    console.log('✅ Storage looks good!')
    console.log(`  Current usage: ${stats.total.size} of recommended 1GB`)
    console.log('')
  }
}

main().catch(console.error)

