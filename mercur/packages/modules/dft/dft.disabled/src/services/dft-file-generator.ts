import { DftLineData } from "../types"

export class DftFileGenerator {
  /**
   * Generates DFT file content according to MBOS specifications
   * Format: D|Remittance Type|Currency|Amount|Source Account|Destination Account Number|1|Beneficiary Code|Beneficiary Name||||Beneficiary Address|SWIFT Code|Beneficiary Bank Address||Purpose|||0|||
   */
  static generateFileContent(transactions: any[]): string {
    const lines: string[] = []
    
    transactions.forEach((transaction, index) => {
      const line = this.generateDftLine(transaction, index + 1)
      lines.push(line)
    })
    
    return lines.join('\r\n') // Use CRLF line endings for Windows compatibility
  }

  /**
   * Generates a single DFT line according to MBOS format specifications
   * Based on the requirements:
   * - Position 14: "SWIFT Code" (changed from "Beneficiary Bank")
   * - Position 16: Removed (was "Swift Code")
   * - Position 17: "DFT <Date of GiyaPay Transaction>" 
   * - Position 20: "0" (Charge Type)
   */
  private static generateDftLine(transaction: any, sequenceNumber: number): string {
    const transactionDate = new Date(transaction.transaction_date || new Date())
    const formattedDate = transactionDate.toISOString().slice(0, 10)
    
    const lineData: string[] = [
      "D",                                          // Position 1: Record Type
      transaction.remittance_type || "TT",          // Position 2: Remittance Type
      transaction.currency || "PHP",               // Position 3: Currency
      this.formatAmount(transaction.amount),       // Position 4: Amount
      transaction.source_account,                  // Position 5: Source Account
      transaction.beneficiary_account,             // Position 6: Destination Account Number
      "1",                                         // Position 7: Sequence (always 1)
      transaction.beneficiary_code || "",          // Position 8: Beneficiary Code
      transaction.beneficiary_name || "",          // Position 9: Beneficiary Name
      "",                                          // Position 10: Empty
      "",                                          // Position 11: Empty
      "",                                          // Position 12: Empty
      "",                                          // Position 13: Empty
      transaction.beneficiary_address || "",       // Position 14: Beneficiary Address
      transaction.swift_code || "",                // Position 15: SWIFT Code (changed from original)
      transaction.bank_address || "",              // Position 16: Beneficiary Bank Address
      "",                                          // Position 17: Empty
      `DFT ${formattedDate}`,                      // Position 18: Purpose (DFT + Date)
      "",                                          // Position 19: Empty
      "",                                          // Position 20: Empty
      "0",                                         // Position 21: Charge Type (always 0)
      "",                                          // Position 22: Empty
      "",                                          // Position 23: Empty
      ""                                           // Position 24: Empty
    ]

    return lineData.join("|")
  }

  /**
   * Formats amount to proper decimal format
   */
  private static formatAmount(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return numAmount.toFixed(2)
  }

  /**
   * Generates a unique batch ID
   */
  static generateBatchId(): string {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '')
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `DFT_${dateStr}_${timeStr}_${randomSuffix}`
  }

  /**
   * Generates filename for DFT file
   */
  static generateFileName(batchId: string): string {
    return `${batchId}.txt`
  }

  /**
   * Validates transaction data for DFT generation
   */
  static validateTransaction(transaction: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Required fields validation
    if (!transaction.amount || transaction.amount <= 0) {
      errors.push("Amount is required and must be greater than 0")
    }

    if (!transaction.source_account) {
      errors.push("Source account is required")
    }

    if (!transaction.beneficiary_account) {
      errors.push("Beneficiary account number is required")
    }

    if (!transaction.beneficiary_name) {
      errors.push("Beneficiary name is required")
    }

    if (!transaction.swift_code) {
      errors.push("SWIFT code is required")
    }

    if (!transaction.beneficiary_address) {
      errors.push("Beneficiary address is required")
    }

    if (!transaction.bank_address) {
      errors.push("Bank address is required")
    }

    // Format validations
    if (transaction.swift_code && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(transaction.swift_code)) {
      errors.push("SWIFT code format is invalid")
    }

    if (transaction.currency && transaction.currency !== "PHP") {
      errors.push("Only PHP currency is supported")
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Validates batch of transactions
   */
  static validateTransactionBatch(transactions: any[]): { 
    validTransactions: any[]
    invalidTransactions: Array<{ transaction: any; errors: string[] }>
    summary: {
      total: number
      valid: number
      invalid: number
      totalAmount: number
    }
  } {
    const validTransactions: any[] = []
    const invalidTransactions: Array<{ transaction: any; errors: string[] }> = []
    let totalAmount = 0

    transactions.forEach(transaction => {
      const validation = this.validateTransaction(transaction)
      
      if (validation.isValid) {
        validTransactions.push(transaction)
        totalAmount += parseFloat(transaction.amount.toString())
      } else {
        invalidTransactions.push({
          transaction,
          errors: validation.errors
        })
      }
    })

    return {
      validTransactions,
      invalidTransactions,
      summary: {
        total: transactions.length,
        valid: validTransactions.length,
        invalid: invalidTransactions.length,
        totalAmount
      }
    }
  }

  /**
   * Generates file metadata
   */
  static generateFileMetadata(transactions: any[], batchId: string) {
    const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)
    
    return {
      batchId,
      fileName: this.generateFileName(batchId),
      transactionCount: transactions.length,
      totalAmount,
      currency: "PHP",
      generatedAt: new Date().toISOString(),
      checksum: this.generateChecksum(transactions)
    }
  }

  /**
   * Generates a simple checksum for verification
   */
  private static generateChecksum(transactions: any[]): string {
    const data = transactions.map(t => 
      `${t.amount}${t.beneficiary_account}${t.swift_code}`
    ).join('')
    
    // Simple hash function for checksum
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(16).toUpperCase()
  }
}
