import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

// DFT File Generator Class (inline to avoid module resolution issues)
class DftFileGenerator {
  /**
   * Generates DFT file content according to MBOS specifications
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
      transaction.swift_code || "",                // Position 15: SWIFT Code
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
      const errors: string[] = []

      // Basic validation
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

      if (errors.length === 0) {
        validTransactions.push(transaction)
        totalAmount += parseFloat(transaction.amount.toString())
      } else {
        invalidTransactions.push({
          transaction,
          errors
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

type GenerateDftFileInput = {
  sellers: any[]
  payouts: any[]
  source_account: string
  notes?: string
}

type GenerateDftFileOutput = {
  batch_id: string
  file_name: string
  file_content: string
  transaction_count: number
  total_amount: number
  metadata: any
}

export const generateDftFileStep = createStep(
  "generate-dft-file",
  async (input: GenerateDftFileInput) => {
    try {
      // Generate batch ID
      const batchId = DftFileGenerator.generateBatchId()
      const fileName = DftFileGenerator.generateFileName(batchId)
      
      // Prepare transactions for DFT file
      const transactions = input.sellers.map(seller => {
        // Find corresponding payout for seller
        const payout = input.payouts.find(p => p.seller_id === seller.id)
        
        if (!payout) {
          throw new Error(`No payout found for seller ${seller.name} (${seller.id})`)
        }
        
        const amount = payout.amount
        
        return {
          seller_id: seller.id,
          payout_id: payout.id,
          amount: amount,
          currency: "PHP",
          source_account: input.source_account,
          beneficiary_account: seller.dft_account_number,
          beneficiary_name: seller.dft_beneficiary_name,
          beneficiary_code: seller.dft_beneficiary_code || seller.id.slice(-8),
          beneficiary_address: seller.dft_beneficiary_address,
          swift_code: seller.dft_swift_code,
          bank_address: seller.dft_bank_address,
          remittance_type: "TT",
          charge_type: "0",
          transaction_date: new Date(),
          purpose: `DFT ${new Date().toISOString().slice(0, 10)}`
        }
      })

      // Validate transactions
      const validation = DftFileGenerator.validateTransactionBatch(transactions)
      
      if (validation.invalidTransactions.length > 0) {
        const errors = validation.invalidTransactions.map(invalid => 
          `Seller ${invalid.transaction.seller_id}: ${invalid.errors.join(', ')}`
        )
        throw new Error(`Invalid transactions found: ${errors.join('; ')}`)
      }

      // Generate file content
      const fileContent = DftFileGenerator.generateFileContent(validation.validTransactions)
      
      // Generate metadata
      const metadata = DftFileGenerator.generateFileMetadata(validation.validTransactions, batchId)

      return new StepResponse({
        batch_id: batchId,
        file_name: fileName,
        file_content: fileContent,
        transaction_count: validation.validTransactions.length,
        total_amount: validation.summary.totalAmount,
        metadata: metadata
      })

    } catch (error) {
      throw new Error(`Failed to generate DFT file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
)
