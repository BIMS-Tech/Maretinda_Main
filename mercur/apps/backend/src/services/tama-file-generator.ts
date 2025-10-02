import { MedusaService } from "@medusajs/framework/utils"
import { createHash } from "crypto"
import { InjectTransactionManager, MedusaContext } from "@medusajs/framework/utils"
import { Context } from "@medusajs/framework/types"
import { EntityManager } from "typeorm"

interface TamaTransaction {
  id: string
  reference_number: string
  vendor_id: string
  vendor_name: string
  beneficiary_name: string
  beneficiary_account: string
  amount: number
  transaction_date: Date
  remarks: string
}

interface TamaFileMetadata {
  batch_id: string
  file_name: string
  generation_date: Date
  transaction_count: number
  total_amount: number
  funding_account: string
  generated_by: string
}

class TamaFileGeneratorService extends MedusaService({}) {
  private container: any

  constructor(container: any) {
    super(container)
    this.container = container
  }

  /**
   * Initialize TAMA tables if they don't exist
   */
  @InjectTransactionManager()
  private async initializeTables(@MedusaContext() sharedContext?: Context<EntityManager>) {
    try {
      const manager = sharedContext?.transactionManager!
      
      // Create TAMA generation table
      await manager.query(`
        CREATE TABLE IF NOT EXISTS "tama_generation" (
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
          "funding_account" text NULL,
          "created_at" timestamptz NOT NULL DEFAULT now(),
          "updated_at" timestamptz NOT NULL DEFAULT now(),
          "deleted_at" timestamptz NULL,
          CONSTRAINT "tama_generation_pkey" PRIMARY KEY ("id")
        );
      `)
      
      // Create index
      await manager.query(`
        CREATE INDEX IF NOT EXISTS "IDX_tama_generation_batch_id" 
        ON "tama_generation" (batch_id) WHERE deleted_at IS NULL;
      `)
      
    } catch (error) {
      console.error('[TamaFileGenerator] Error initializing tables:', error)
      throw error
    }
  }

  /**
   * Generate TAMA batch ID
   */
  static generateBatchId(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const timestamp = Date.now().toString().slice(-6)
    return `TAMA_${date}_${timestamp}`
  }

  /**
   * Generate TAMA file name
   */
  static generateFileName(batchId?: string): string {
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '') // YYMMDD format
    return `TAMA - ${date}.txt`
  }

  /**
   * Format amount for TAMA file (with decimal point after 2 digits from right)
   */
  private formatAmount(amount: number): string {
    // Convert to centavos and format with decimal point
    const centavos = Math.round(amount * 100)
    const formatted = centavos.toString()
    if (formatted.length <= 2) {
      return `0.${formatted.padStart(2, '0')}`
    }
    return `${formatted.slice(0, -2)}.${formatted.slice(-2)}`
  }

  /**
   * Format date for TAMA file (MM/DD/YYYY)
   */
  private formatDate(date: Date): string {
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${month}/${day}/${year}`
  }

  /**
   * Format time for TAMA file (HH:MM AM/PM)
   */
  private formatTime(date: Date): string {
    let hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours ? hours : 12 // 0 should be 12
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`
  }

  /**
   * Generate TAMA header record
   */
  private generateHeaderRecord(fundingAccount: string, transactionDate: Date): string {
    const formattedDate = this.formatDate(transactionDate)
    const formattedTime = this.formatTime(transactionDate)
    
    return `H|${fundingAccount}|${formattedDate}|${formattedTime}`
  }

  /**
   * Generate TAMA detail record
   */
  private generateDetailRecord(transaction: TamaTransaction): string {
    const formattedAmount = this.formatAmount(transaction.amount)
    
    // TAMA format: D||Reference Number|Last Name|First Name||Destination Account|Amount|Remarks
    // Based on sample: D||8SHF-SGS2-TWBO-SNDP|SABARRE|FRANCES THERESE||2463246242144|1000|SAMPLE METROBANK
    
    // Parse beneficiary name (assume format: "LAST NAME, FIRST NAME" or "FIRST NAME LAST NAME")
    let lastName = ''
    let firstName = ''
    
    if (transaction.beneficiary_name) {
      const nameParts = transaction.beneficiary_name.trim().split(/[,\s]+/)
      if (nameParts.length >= 2) {
        if (transaction.beneficiary_name.includes(',')) {
          // Format: "LAST, FIRST MIDDLE"
          lastName = nameParts[0].trim()
          firstName = nameParts.slice(1).join(' ').trim()
        } else {
          // Format: "FIRST MIDDLE LAST" - assume last word is last name
          lastName = nameParts[nameParts.length - 1]
          firstName = nameParts.slice(0, -1).join(' ')
        }
      } else {
        // Single name - use as first name
        firstName = transaction.beneficiary_name.trim()
      }
    }

    return `D||${transaction.reference_number}|${lastName}|${firstName}||${transaction.beneficiary_account}|${formattedAmount}|${transaction.remarks || 'MARETINDA SETTLEMENT'}`
  }

  /**
   * Get transactions for Metrobank merchants
   */
  @InjectTransactionManager()
  async getMetrobankTransactions(
    dateFrom?: string,
    dateTo?: string,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<TamaTransaction[]> {
    try {
      const manager = sharedContext?.transactionManager!
      
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

      // Query for successful GiyaPay transactions with Metrobank merchants
      const query = `
        SELECT 
          gt.id,
          gt.reference_number,
          gt.vendor_id,
          gt.vendor_name,
          gt.amount,
          gt.created_at as transaction_date,
          gt.description as remarks,
          s.dft_beneficiary_name as beneficiary_name,
          s.dft_account_number as beneficiary_account,
          s.dft_bank_name
        FROM giyapay_transactions gt
        LEFT JOIN seller s ON s.id = gt.vendor_id
        WHERE gt.status = 'SUCCESS'
          AND s.dft_bank_name ILIKE '%metrobank%'
          AND s.dft_account_number IS NOT NULL
          AND s.dft_beneficiary_name IS NOT NULL
          ${dateFilter}
        ORDER BY gt.created_at DESC
      `

      const results = await manager.query(query, params)
      
      return results.map((row: any) => ({
        id: row.id,
        reference_number: row.reference_number,
        vendor_id: row.vendor_id,
        vendor_name: row.vendor_name,
        beneficiary_name: row.beneficiary_name,
        beneficiary_account: row.beneficiary_account,
        amount: parseFloat(row.amount),
        transaction_date: new Date(row.transaction_date),
        remarks: row.remarks || 'MARETINDA SETTLEMENT'
      }))

    } catch (error) {
      console.error('[TamaFileGenerator] Error getting Metrobank transactions:', error)
      throw error
    }
  }

  /**
   * Generate TAMA file content
   */
  generateFileContent(
    transactions: TamaTransaction[],
    fundingAccount: string,
    transactionDate?: Date
  ): string {
    const fileDate = transactionDate || new Date()
    
    // Generate header record
    const headerRecord = this.generateHeaderRecord(fundingAccount, fileDate)
    
    // Generate detail records
    const detailRecords = transactions.map(transaction => 
      this.generateDetailRecord(transaction)
    )
    
    // Combine all records
    const allRecords = [headerRecord, ...detailRecords]
    
    return allRecords.join('\n')
  }

  /**
   * Generate TAMA file metadata
   */
  generateFileMetadata(
    batchId: string,
    fileName: string,
    transactions: TamaTransaction[],
    fundingAccount: string,
    generatedBy: string
  ): TamaFileMetadata {
    const totalAmount = transactions.reduce((sum, txn) => sum + txn.amount, 0)
    
    return {
      batch_id: batchId,
      file_name: fileName,
      generation_date: new Date(),
      transaction_count: transactions.length,
      total_amount: totalAmount,
      funding_account: fundingAccount,
      generated_by: generatedBy
    }
  }

  /**
   * Validate TAMA transactions
   */
  validateTransactions(transactions: TamaTransaction[]): {
    validTransactions: TamaTransaction[]
    invalidTransactions: { transaction: TamaTransaction; errors: string[] }[]
  } {
    const validTransactions: TamaTransaction[] = []
    const invalidTransactions: { transaction: TamaTransaction; errors: string[] }[] = []
    
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
   * Create TAMA generation record
   */
  @InjectTransactionManager()
  async createTamaGeneration(
    metadata: TamaFileMetadata,
    notes?: string,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<string> {
    try {
      await this.initializeTables(sharedContext)
      const manager = sharedContext?.transactionManager!
      
      const generationId = `tama_gen_${Date.now()}`
      
      await manager.query(`
        INSERT INTO "tama_generation" (
          "id", "batch_id", "generation_date", "file_name",
          "status", "total_amount", "transaction_count", 
          "currency", "generated_by", "funding_account", "notes"
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        metadata.funding_account,
        notes || ""
      ])
      
      return generationId
      
    } catch (error) {
      console.error('[TamaFileGenerator] Error creating TAMA generation:', error)
      throw error
    }
  }

  /**
   * Get TAMA generations
   */
  @InjectTransactionManager()
  async getTamaGenerations(
    limit = 50,
    offset = 0,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<any[]> {
    try {
      await this.initializeTables(sharedContext)
      const manager = sharedContext?.transactionManager!
      
      const results = await manager.query(`
        SELECT * FROM "tama_generation"
        WHERE deleted_at IS NULL
        ORDER BY generation_date DESC
        LIMIT ? OFFSET ?
      `, [limit, offset])
      
      return results
      
    } catch (error) {
      console.error('[TamaFileGenerator] Error getting TAMA generations:', error)
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

export default TamaFileGeneratorService


