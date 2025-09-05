/**
 * Settlement Calendar for Philippine Banking System
 * Handles T+1/T+2 settlement timelines with banking day calculations
 */

interface BankingDay {
  date: Date
  isBankingDay: boolean
  reason?: string
}

interface SettlementInfo {
  transactionDate: Date
  processingDate: Date // T+1
  creditingDate: Date  // T+2
  businessDaysToProcess: number
  businessDaysToCredit: number
  isWeekendTransaction: boolean
  isHolidayTransaction: boolean
}

// Philippine Banking Holidays 2024-2025 (sample - should be updated annually)
const PHILIPPINE_HOLIDAYS_2024_2025: Date[] = [
  // 2024
  new Date('2024-01-01'), // New Year's Day
  new Date('2024-04-09'), // Araw ng Kagitingan
  new Date('2024-03-28'), // Maundy Thursday
  new Date('2024-03-29'), // Good Friday
  new Date('2024-05-01'), // Labor Day
  new Date('2024-06-12'), // Independence Day
  new Date('2024-08-26'), // National Heroes Day
  new Date('2024-11-30'), // Bonifacio Day
  new Date('2024-12-25'), // Christmas Day
  new Date('2024-12-30'), // Rizal Day
  new Date('2024-12-31'), // New Year's Eve
  
  // 2025
  new Date('2025-01-01'), // New Year's Day
  new Date('2025-04-09'), // Araw ng Kagitingan
  new Date('2025-04-17'), // Maundy Thursday
  new Date('2025-04-18'), // Good Friday
  new Date('2025-05-01'), // Labor Day
  new Date('2025-06-12'), // Independence Day
  new Date('2025-08-25'), // National Heroes Day
  new Date('2025-11-30'), // Bonifacio Day
  new Date('2025-12-25'), // Christmas Day
  new Date('2025-12-30'), // Rizal Day
  new Date('2025-12-31'), // New Year's Eve
]

export class SettlementCalendar {
  
  /**
   * Check if a given date is a banking day (Monday-Friday, not a holiday)
   */
  static isBankingDay(date: Date): boolean {
    const dayOfWeek = date.getDay()
    
    // Weekend (Saturday = 6, Sunday = 0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false
    }
    
    // Check against Philippine banking holidays
    const dateString = date.toDateString()
    const isHoliday = PHILIPPINE_HOLIDAYS_2024_2025.some(holiday => 
      holiday.toDateString() === dateString
    )
    
    return !isHoliday
  }
  
  /**
   * Get the next banking day from a given date
   */
  static getNextBankingDay(fromDate: Date): Date {
    let nextDay = new Date(fromDate)
    nextDay.setDate(nextDay.getDate() + 1)
    
    while (!this.isBankingDay(nextDay)) {
      nextDay.setDate(nextDay.getDate() + 1)
    }
    
    return nextDay
  }
  
  /**
   * Add banking days to a date (skips weekends and holidays)
   */
  static addBankingDays(fromDate: Date, businessDays: number): Date {
    let currentDate = new Date(fromDate)
    let daysAdded = 0
    
    while (daysAdded < businessDays) {
      currentDate = this.getNextBankingDay(currentDate)
      daysAdded++
    }
    
    return currentDate
  }
  
  /**
   * Calculate settlement timeline for a transaction
   * T+1: Processing day (when Maritinda receives funds from GiyaPay)
   * T+2: Crediting day (when vendor bank accounts are credited)
   */
  static calculateSettlement(transactionDate: Date): SettlementInfo {
    const txDate = new Date(transactionDate)
    
    // T+1: Next banking day for processing
    const processingDate = this.addBankingDays(txDate, 1)
    
    // T+2: Second banking day for crediting
    const creditingDate = this.addBankingDays(txDate, 2)
    
    // Calculate actual business days
    const businessDaysToProcess = this.countBankingDaysBetween(txDate, processingDate)
    const businessDaysToCredit = this.countBankingDaysBetween(txDate, creditingDate)
    
    // Check if transaction was made on weekend/holiday
    const isWeekendTransaction = txDate.getDay() === 0 || txDate.getDay() === 6
    const isHolidayTransaction = !this.isBankingDay(txDate) && !isWeekendTransaction
    
    return {
      transactionDate: txDate,
      processingDate,
      creditingDate,
      businessDaysToProcess,
      businessDaysToCredit,
      isWeekendTransaction,
      isHolidayTransaction
    }
  }
  
  /**
   * Count banking days between two dates
   */
  static countBankingDaysBetween(startDate: Date, endDate: Date): number {
    let count = 0
    let currentDate = new Date(startDate)
    
    while (currentDate < endDate) {
      currentDate.setDate(currentDate.getDate() + 1)
      if (this.isBankingDay(currentDate)) {
        count++
      }
    }
    
    return count
  }
  
  /**
   * Check if today is a valid day for processing settlements
   */
  static canProcessSettlementsToday(): boolean {
    return this.isBankingDay(new Date())
  }
  
  /**
   * Get the next settlement processing date
   */
  static getNextSettlementDate(): Date {
    const today = new Date()
    if (this.isBankingDay(today)) {
      return today
    }
    return this.getNextBankingDay(today)
  }
  
  /**
   * Format settlement timeline for display
   */
  static formatSettlementTimeline(settlement: SettlementInfo): string {
    const formatDate = (date: Date) => date.toLocaleDateString('en-PH', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
    
    const txDay = formatDate(settlement.transactionDate)
    const processDay = formatDate(settlement.processingDate)
    const creditDay = formatDate(settlement.creditingDate)
    
    let timeline = `${txDay} → ${processDay} (T+1) → ${creditDay} (T+2)`
    
    if (settlement.isWeekendTransaction || settlement.isHolidayTransaction) {
      timeline += ' (delayed due to non-banking day)'
    }
    
    return timeline
  }
  
  /**
   * Get settlement status for a transaction
   */
  static getSettlementStatus(transactionDate: Date): 'pending' | 'processing' | 'completed' {
    const settlement = this.calculateSettlement(transactionDate)
    const now = new Date()
    
    if (now < settlement.processingDate) {
      return 'pending'
    } else if (now < settlement.creditingDate) {
      return 'processing'
    } else {
      return 'completed'
    }
  }
  
  /**
   * Get transactions that should be processed today (T+1)
   */
  static getTransactionsForProcessing(transactions: any[]): any[] {
    const today = new Date()
    if (!this.isBankingDay(today)) {
      return [] // No processing on non-banking days
    }
    
    return transactions.filter(txn => {
      const settlement = this.calculateSettlement(new Date(txn.created_at))
      return settlement.processingDate.toDateString() === today.toDateString()
    })
  }
  
  /**
   * Get transactions that should be credited today (T+2)
   */
  static getTransactionsForCrediting(transactions: any[]): any[] {
    const today = new Date()
    if (!this.isBankingDay(today)) {
      return [] // No crediting on non-banking days
    }
    
    return transactions.filter(txn => {
      const settlement = this.calculateSettlement(new Date(txn.created_at))
      return settlement.creditingDate.toDateString() === today.toDateString()
    })
  }
}

export default SettlementCalendar





