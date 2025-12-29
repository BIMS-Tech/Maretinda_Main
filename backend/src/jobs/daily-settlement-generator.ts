/**
 * Daily Settlement Generator Job
 * 
 * This job runs once per day to generate TAMA and DFT settlement reports
 * based on successful GiyaPay transactions.
 * 
 * Configuration:
 * - Runs daily at configurable time (default: 11:00 PM GMT+8)
 * - Transactions included must align with GiyaPay cut-off
 * - Routes transactions based on vendor bank:
 *   - Metrobank → TAMA
 *   - Others → DFT
 * 
 * Environment Variables:
 * - SETTLEMENT_GENERATION_TIME: Time to run job (default: "23:00")
 * - SETTLEMENT_TIMEZONE: Timezone for scheduling (default: "Asia/Manila")
 * - SETTLEMENT_CUTOFF_HOURS: Hours before current time to include transactions (default: 24)
 */

import SettlementRouterService from "../services/settlement-router"

interface ScheduledJobConfig {
  name: string
  schedule: string
  data?: any
}

export default async function dailySettlementGenerator(
  container: any,
  config?: ScheduledJobConfig
): Promise<void> {
  console.log('[DailySettlement] ========== STARTING DAILY SETTLEMENT GENERATION ==========')
  
  const startTime = new Date()
  console.log(`[DailySettlement] Job started at: ${startTime.toISOString()}`)

  try {
    // Get configuration
    const cutoffHours = parseInt(process.env.SETTLEMENT_CUTOFF_HOURS || '24')
    
    // Calculate date range based on cutoff
    const dateTo = new Date()
    const dateFrom = new Date(dateTo)
    dateFrom.setHours(dateFrom.getHours() - cutoffHours)

    const dateFromStr = dateFrom.toISOString().split('T')[0]
    const dateToStr = dateTo.toISOString().split('T')[0]

    console.log(`[DailySettlement] Processing transactions from ${dateFromStr} to ${dateToStr}`)
    console.log(`[DailySettlement] Cutoff: ${cutoffHours} hours`)

    // Create settlement router service
    const settlementRouter = new SettlementRouterService(container)

    // Route settlements
    const result = await settlementRouter.routeSettlements(
      dateFromStr,
      dateToStr,
      'scheduled-job'
    )

    const endTime = new Date()
    const duration = (endTime.getTime() - startTime.getTime()) / 1000

    if (result.success) {
      console.log('[DailySettlement] ========== SETTLEMENT GENERATION SUCCESSFUL ==========')
      console.log(`[DailySettlement] Duration: ${duration}s`)
      console.log(`[DailySettlement] TAMA: ${result.tama_transaction_count || 0} transactions, ₱${result.tama_total_amount || 0}`)
      console.log(`[DailySettlement] DFT: ${result.dft_transaction_count || 0} transactions, ₱${result.dft_total_amount || 0}`)
      
      if (result.errors && result.errors.length > 0) {
        console.warn(`[DailySettlement] Warnings: ${result.errors.length}`)
        result.errors.forEach(error => console.warn(`[DailySettlement]   - ${error}`))
      }
    } else {
      console.error('[DailySettlement] ========== SETTLEMENT GENERATION FAILED ==========')
      console.error(`[DailySettlement] Duration: ${duration}s`)
      console.error(`[DailySettlement] Errors:`)
      result.errors?.forEach(error => console.error(`[DailySettlement]   - ${error}`))
    }

  } catch (error) {
    console.error('[DailySettlement] ========== FATAL ERROR ==========')
    console.error('[DailySettlement] Error:', error)
    throw error
  }
}

// Job configuration
// Runs daily at 11:00 PM Manila time (GMT+8)
export const config: ScheduledJobConfig = {
  name: "daily-settlement-generator",
  schedule: process.env.SETTLEMENT_GENERATION_TIME || "0 23 * * *", // Default: 11:00 PM daily
  data: {
    description: "Generate daily TAMA and DFT settlement reports",
    timezone: process.env.SETTLEMENT_TIMEZONE || "Asia/Manila"
  }
}

