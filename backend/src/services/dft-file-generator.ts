import { MedusaService } from "@medusajs/framework/utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createHash } from "crypto"

interface DftTransaction {
  id: string
  reference_number: string
  vendor_id?: string
  vendor_name?: string
  beneficiary_name: string
  beneficiary_account: string
  swift_code: string
  beneficiary_address: string
  beneficiary_bank_address: string
  amount: number // Gross amount
  net_amount: number // Net amount after fees
  transaction_date: Date
  remarks: string
}

interface DftFileMetadata {
  batch_id: string
  file_name: string
  generation_date: Date
  transaction_count: number
  total_amount: number
  generated_by: string
}

class DftFileGeneratorService extends MedusaService({}) {
  private container: any

  constructor(container: any) {
    super(container)
    this.container = container
  }

  private async getManager(sharedContext?: any) {
    if (sharedContext?.transactionManager) {
      return sharedContext.transactionManager
    }
    try {
      return this.container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch (error) {
      console.error('[DftFileGenerator] Failed to resolve PG_CONNECTION:', error)
      throw error
    }
  }

  /**
   * Initialize DFT tables if they don't exist
   */
  private async initializeTables(sharedContext?: any) {
    try {
      const manager = await this.getManager(sharedContext)
      
      // Create DFT generation table
      await manager.raw(`
        CREATE TABLE IF NOT EXISTS "dft_generation" (
          "id" text NOT NULL,
          "batch_id" text UNIQUE NOT NULL,
          "generation_date" timestamptz NOT NULL,
          "file_name" text NOT NULL,
          "file_path" text NULL,
          "status" text NOT NULL DEFAULT 'pending',
          "total_amount" numeric NOT NULL DEFAULT 0,
          "transaction_count" integer NOT NULL DEFAULT 0,
          "currency" text NOT NULL DEFAULT 'PHP',
          "generated_by" text NOT NULL,
          "processed_at" timestamptz NULL,
          "downloaded_at" timestamptz NULL,
          "file_size" integer NULL,
          "checksum" text NULL,
          "notes" text NULL,
          "error_message" text NULL,
          "created_at" timestamptz NOT NULL DEFAULT now(),
          "updated_at" timestamptz NOT NULL DEFAULT now(),
          "deleted_at" timestamptz NULL,
          CONSTRAINT "dft_generation_pkey" PRIMARY KEY ("id")
        );
      `)
      
      // Create index
      await manager.raw(`
        CREATE INDEX IF NOT EXISTS "IDX_dft_generation_batch_id" 
        ON "dft_generation" (batch_id) WHERE deleted_at IS NULL;
      `)
      
    } catch (error) {
      console.error('[DftFileGenerator] Error initializing tables:', error)
      throw error
    }
  }

  /**
   * Generate DFT batch ID
   */
  static generateBatchId(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const timestamp = Date.now().toString().slice(-6)
    return `DFT_${date}_${timestamp}`
  }

  /**
   * Generate DFT file name
   * Format: "DFT - YYMMDD.txt"
   */
  static generateFileName(batchId?: string): string {
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '') // YYMMDD format
    return `DFT - ${date}.txt`
  }

  /**
   * Format amount for DFT file (standard decimal format)
   */
  private formatAmount(amount: number): string {
    return amount.toFixed(2)
  }

  /**
   * Format date for DFT file
   * Format: YYYYMMDD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}${month}${day}`
  }

  /**
   * Calculate net amount after fees
   * Fees deducted:
   * - Payment processing fee: 2.5% (GiyaPay fee)
   * - Transaction fee: ₱5 per transaction (Maretinda fee)
   */
  private calculateNetAmount(grossAmount: number): number {
    const paymentProcessingFeeRate = 0.025
    const transactionFee = 5.00
    
    const paymentProcessingFee = grossAmount * paymentProcessingFeeRate
    const netAmount = grossAmount - paymentProcessingFee - transactionFee
    
    return Math.max(0, netAmount)
  }

  /**
   * Generate DFT file record (pipe-delimited format)
   * Mandatory format rules per requirements:
   * - Position 14 → Swift Code
   * - Position 16 → removed (empty)
   * - Position 17 → "DFT <GiyaPay Transaction Date>"
   * - Position 20 → "0" (Charge Type)
   */
  private generateDftRecord(transaction: DftTransaction, transactionDate: Date): string {
    const netAmount = transaction.net_amount ?? this.calculateNetAmount(transaction.amount)
    const formattedAmount = this.formatAmount(netAmount)
    const formattedDate = this.formatDate(transactionDate)
    
    // DFT Format (pipe-delimited):
    // 1. Beneficiary Account Number
    // 2. Beneficiary Name
    // 3. Amount
    // 4-13. (Various fields - using empty or default values)
    // 14. Swift Code (Position 14 - MANDATORY)
    // 15. (Field - using empty)
    // 16. (Removed - empty)
    // 17. "DFT <GiyaPay Transaction Date>" (Position 17 - MANDATORY)
    // 18-19. (Fields - using empty or default)
    // 20. "0" (Charge Type - Position 20 - MANDATORY)
    
    // Clean up addresses - remove newlines and extra spaces
    const cleanAddress = (addr: string) => addr?.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim() || ''
    
    const record = [
      transaction.beneficiary_account,                    // 1. Account Number
      transaction.beneficiary_name,                       // 2. Beneficiary Name
      formattedAmount,                                    // 3. Amount
      '',                                                 // 4. Empty
      '',                                                 // 5. Empty
      '',                                                 // 6. Empty
      '',                                                 // 7. Empty
      '',                                                 // 8. Empty
      '',                                                 // 9. Empty
      '',                                                 // 10. Empty
      '',                                                 // 11. Empty
      '',                                                 // 12. Empty
      '',                                                 // 13. Empty
      transaction.swift_code,                             // 14. Swift Code (MANDATORY)
      cleanAddress(transaction.beneficiary_address),      // 15. Beneficiary Address (cleaned)
      '',                                                 // 16. Removed (empty)
      `DFT ${formattedDate}`,                            // 17. "DFT <Date>" (MANDATORY)
      cleanAddress(transaction.beneficiary_bank_address), // 18. Bank Address (cleaned)
      transaction.reference_number,                       // 19. Reference Number
      '0'                                                 // 20. Charge Type "0" (MANDATORY)
    ]
    
    return record.join('|')
  }

  /**
   * Get transactions for Non-Metrobank merchants
   */
  async getNonMetrobankTransactions(
    dateFrom?: string,
    dateTo?: string,
    sharedContext?: any
  ): Promise<DftTransaction[]> {
    try {
      await this.initializeTables(sharedContext)
      const manager = await this.getManager(sharedContext)
      
      // Build date filter
      let dateFilter = ''
      const params: any[] = []
      
      if (dateFrom || dateTo) {
        const conditions: string[] = []
        if (dateFrom) {
          conditions.push('gt.created_at >= ?')
          params.push(dateFrom)
        }
        if (dateTo) {
          conditions.push('gt.created_at <= ?')
          params.push(dateTo)
        }
        dateFilter = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : ''
      }

      // Query for successful GiyaPay transactions with Non-Metrobank merchants
      const query = `
        SELECT 
          gt.id,
          gt.reference_number,
          gt.order_id,
          gt.amount,
          gt.created_at as transaction_date,
          gt.description as remarks,
          COALESCE(s.bank_name, s.dft_bank_name) as bank_name,
          COALESCE(s.swift_code, s.dft_swift_code) as swift_code,
          COALESCE(s.account_name, s.dft_beneficiary_name) as beneficiary_name,
          COALESCE(s.account_number, s.dft_account_number) as beneficiary_account,
          COALESCE(s.beneficiary_address, s.dft_beneficiary_address) as beneficiary_address,
          COALESCE(s.beneficiary_bank_address, s.dft_bank_address) as beneficiary_bank_address,
          s.id as vendor_id,
          s.name as vendor_name
        FROM giyapay_transaction gt
        LEFT JOIN seller s ON s.id = gt.vendor_id
        WHERE gt.status = 'SUCCESS'
          AND (
            (COALESCE(s.bank_name, s.dft_bank_name) NOT ILIKE '%metrobank%')
            OR COALESCE(s.bank_name, s.dft_bank_name) IS NULL
          )
          AND COALESCE(s.swift_code, s.dft_swift_code) IS NOT NULL
          AND COALESCE(s.account_number, s.dft_account_number) IS NOT NULL
          AND COALESCE(s.account_name, s.dft_beneficiary_name) IS NOT NULL
          AND COALESCE(s.beneficiary_address, s.dft_beneficiary_address) IS NOT NULL
          AND COALESCE(s.beneficiary_bank_address, s.dft_bank_address) IS NOT NULL
          ${dateFilter}
        ORDER BY gt.created_at DESC
      `

      const results = await manager.raw(query, params)
      const rows = results?.rows || results || []
      
      if (rows.length > 0) {
        console.log(`[DftFileGenerator] Found ${rows.length} Non-Metrobank transactions for DFT`)
      }
      
      return rows.map((row: any) => {
        const grossAmount = parseFloat(row.amount)
        const netAmount = this.calculateNetAmount(grossAmount)
        
        return {
          id: row.id,
          reference_number: row.reference_number,
          vendor_id: row.vendor_id,
          vendor_name: row.vendor_name,
          beneficiary_name: row.beneficiary_name,
          beneficiary_account: row.beneficiary_account,
          swift_code: row.swift_code,
          beneficiary_address: row.beneficiary_address,
          beneficiary_bank_address: row.beneficiary_bank_address,
          amount: grossAmount,
          net_amount: netAmount,
          transaction_date: new Date(row.transaction_date),
          remarks: row.remarks || 'MARETINDA SETTLEMENT'
        }
      })

    } catch (error) {
      console.error('[DftFileGenerator] Error getting non-Metrobank transactions:', error)
      throw error
    }
  }

  /**
   * Generate DFT file content
   */
  generateFileContent(
    transactions: DftTransaction[],
    transactionDate?: Date
  ): string {
    const fileDate = transactionDate || new Date()
    
    // Generate detail records
    const detailRecords = transactions.map(transaction => 
      this.generateDftRecord(transaction, fileDate)
    )
    
    // DFT format doesn't have a header, just detail records
    return detailRecords.join('\n')
  }

  /**
   * Generate DFT file metadata
   */
  generateFileMetadata(
    batchId: string,
    fileName: string,
    transactions: DftTransaction[],
    generatedBy: string
  ): DftFileMetadata {
    // Use net_amount for total (after fees)
    const totalAmount = transactions.reduce((sum, txn) => sum + (txn.net_amount ?? this.calculateNetAmount(txn.amount)), 0)
    
    return {
      batch_id: batchId,
      file_name: fileName,
      generation_date: new Date(),
      transaction_count: transactions.length,
      total_amount: totalAmount,
      generated_by: generatedBy
    }
  }

  /**
   * Validate DFT transactions
   */
  validateTransactions(transactions: DftTransaction[]): {
    validTransactions: DftTransaction[]
    invalidTransactions: { transaction: DftTransaction; errors: string[] }[]
  } {
    const validTransactions: DftTransaction[] = []
    const invalidTransactions: { transaction: DftTransaction; errors: string[] }[] = []
    
    for (const transaction of transactions) {
      const errors: string[] = []
      
      if (!transaction.reference_number) {
        errors.push('Missing reference number')
      }
      
      if (!transaction.beneficiary_account) {
        errors.push('Missing beneficiary account number')
      }
      
      if (!transaction.beneficiary_name) {
        errors.push('Missing beneficiary name')
      }
      
      if (!transaction.swift_code) {
        errors.push('Missing SWIFT code')
      }
      
      if (!transaction.beneficiary_address) {
        errors.push('Missing beneficiary address')
      }
      
      if (!transaction.beneficiary_bank_address) {
        errors.push('Missing bank address')
      }
      
      if (!transaction.amount || transaction.amount <= 0) {
        errors.push('Invalid amount')
      }
      
      if (errors.length === 0) {
        validTransactions.push(transaction)
      } else {
        invalidTransactions.push({ transaction, errors })
      }
    }
    
    return { validTransactions, invalidTransactions }
  }

  /**
   * Create DFT generation record
   */
  async createDftGeneration(
    metadata: DftFileMetadata,
    notes?: string,
    sharedContext?: any
  ): Promise<string> {
    try {
      await this.initializeTables(sharedContext)
      const manager = await this.getManager(sharedContext)
      
      const generationId = `dft_gen_${Date.now()}`
      
      await manager.raw(`
        INSERT INTO "dft_generation" (
          "id", "batch_id", "generation_date", "file_name",
          "status", "total_amount", "transaction_count", 
          "currency", "generated_by", "notes"
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        generationId,
        metadata.batch_id,
        metadata.generation_date,
        metadata.file_name,
        "generated",
        metadata.total_amount,
        metadata.transaction_count,
        "PHP",
        metadata.generated_by,
        notes || ""
      ])
      
      return generationId
      
    } catch (error) {
      console.error('[DftFileGenerator] Error creating DFT generation:', error)
      throw error
    }
  }

  /**
   * Get DFT generations
   */
  async getDftGenerations(
    limit = 50,
    offset = 0,
    sharedContext?: any
  ): Promise<any[]> {
    try {
      await this.initializeTables(sharedContext)
      const manager = await this.getManager(sharedContext)
      
      const results = await manager.raw(`
        SELECT * FROM "dft_generation"
        WHERE deleted_at IS NULL
        ORDER BY generation_date DESC
        LIMIT ? OFFSET ?
      `, [limit, offset])
      
      const rows = results?.rows || results || []
      return rows
      
    } catch (error) {
      console.error('[DftFileGenerator] Error getting DFT generations:', error)
      return []
    }
  }

  /**
   * Calculate file checksum
   */
  calculateChecksum(content: string): string {
    return createHash('md5').update(content).digest('hex')
  }
}

export default DftFileGeneratorService

