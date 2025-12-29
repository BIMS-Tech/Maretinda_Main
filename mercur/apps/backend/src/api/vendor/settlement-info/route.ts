import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SettlementCalendar } from "../../../lib/settlement-calendar"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    // Get seller from authenticated user
    const user = req.user
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const seller = (user as any).seller
    if (!seller) {
      return res.status(404).json({ error: "Seller not found" })
    }

    // Get settlement calendar information
    const today = new Date()
    const canProcessToday = SettlementCalendar.canProcessSettlementsToday()
    const nextSettlementDate = SettlementCalendar.getNextSettlementDate()
    
    // Sample transaction settlement info
    const sampleTransactionDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
    const settlementExample = SettlementCalendar.calculateSettlement(sampleTransactionDate)
    
    // Note: Settlement is based on vendor's order payments, not GiyaPay gateway transactions
    // GiyaPay transactions are marketplace-wide (one transaction covers multiple vendors)
    // Settlement calculations should use vendor's completed orders instead
    
    // For now, provide settlement schedule information without transaction-specific data
    // In production, this should query the vendor's orders and calculate settlements from those
    let settlementStatuses = []
    
    // Placeholder for today's activities - should be calculated from vendor's orders
    const transactionsForProcessing = []
    const transactionsForCrediting = []

    const settlementInfo = {
      vendor_id: seller.id,
      current_date: today.toISOString(),
      is_banking_day: SettlementCalendar.isBankingDay(today),
      can_process_settlements_today: canProcessToday,
      next_settlement_date: nextSettlementDate.toISOString(),
      
      // Settlement schedule explanation
      schedule: {
        description: "T+1/T+2 Settlement Schedule",
        t_plus_1: "Transactions are processed the next banking day (Maritinda receives funds)",
        t_plus_2: "Vendor accounts are credited on the second banking day",
        banking_days: "Monday to Friday, excluding Philippine bank holidays",
        weekend_rule: "Weekend transactions are processed on the following Monday",
        holiday_rule: "Holiday transactions are processed on the next banking day"
      },
      
      // Example settlement calculation
      example_settlement: {
        description: "Settlement timeline example",
        transaction_date: settlementExample.transactionDate.toISOString(),
        processing_date: settlementExample.processingDate.toISOString(),
        crediting_date: settlementExample.creditingDate.toISOString(),
        timeline_display: SettlementCalendar.formatSettlementTimeline(settlementExample),
        business_days_to_credit: settlementExample.businessDaysToCredit
      },
      
      // Today's settlement activities
      today_activities: {
        transactions_for_processing: transactionsForProcessing.length,
        transactions_for_crediting: transactionsForCrediting.length,
        processing_amount: transactionsForProcessing.reduce((sum, txn) => sum + parseFloat(txn.amount), 0),
        crediting_amount: transactionsForCrediting.reduce((sum, txn) => sum + parseFloat(txn.amount), 0)
      },
      
      // Recent transaction settlement statuses
      recent_transactions: settlementStatuses
    }

    res.json({
      settlement_info: settlementInfo
    })

  } catch (error) {
    console.error('[Settlement Info API] Error:', error)
    res.status(500).json({
      error: 'Failed to fetch settlement information',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}





