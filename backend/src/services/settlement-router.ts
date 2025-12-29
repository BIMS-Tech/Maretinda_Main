import { MedusaService } from "@medusajs/framework/utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import TamaFileGeneratorService from "./tama-file-generator"
import DftFileGeneratorService from "./dft-file-generator"
import { createGCSService } from "../utils/google-cloud-storage"
import * as fs from 'fs'
import * as path from 'path'

interface SettlementResult {
  success: boolean
  tama_generation_id?: string
  tama_file_name?: string
  tama_transaction_count?: number
  tama_total_amount?: number
  dft_generation_id?: string
  dft_file_name?: string
  dft_transaction_count?: number
  dft_total_amount?: number
  errors?: string[]
}

/**
 * Settlement Router Service
 * 
 * Responsible for routing transactions to appropriate settlement batch:
 * - Metrobank vendors → TAMA batch
 * - Non-Metrobank vendors → DFT batch
 * 
 * Rules:
 * - Non-Metrobank vendors must NEVER appear in TAMA
 * - Metrobank vendors must NEVER appear in DFT
 * - Missing required bank data must exclude transaction and log error
 */
class SettlementRouterService extends MedusaService({}) {
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
      console.error('[SettlementRouter] Failed to resolve PG_CONNECTION:', error)
      throw error
    }
  }

  /**
   * Route all successful GiyaPay transactions to appropriate settlement batches
   */
  async routeSettlements(
    dateFrom?: string,
    dateTo?: string,
    generatedBy: string = 'system',
    sharedContext?: any
  ): Promise<SettlementResult> {
    console.log('[SettlementRouter] ========== STARTING SETTLEMENT ROUTING ==========')
    console.log(`[SettlementRouter] Date range: ${dateFrom || 'all'} to ${dateTo || 'all'}`)
    
    const result: SettlementResult = {
      success: false,
      errors: []
    }

    try {
      // Get or create services
      const tamaService = new TamaFileGeneratorService(this.container)
      const dftService = new DftFileGeneratorService(this.container)

      // Route to TAMA (Metrobank)
      console.log('[SettlementRouter] --- Routing Metrobank transactions to TAMA ---')
      try {
        const metrobankTransactions = await tamaService.getMetrobankTransactions(
          dateFrom,
          dateTo,
          sharedContext
        )

        console.log(`[SettlementRouter] Found ${metrobankTransactions.length} Metrobank transactions`)

        if (metrobankTransactions.length > 0) {
          const validation = tamaService.validateTransactions(metrobankTransactions)
          
          if (validation.invalidTransactions.length > 0) {
            console.warn(`[SettlementRouter] ${validation.invalidTransactions.length} invalid Metrobank transactions`)
            validation.invalidTransactions.forEach(inv => {
              const errorMsg = `Metrobank transaction ${inv.transaction.id} excluded: ${inv.errors.join(', ')}`
              console.error(`[SettlementRouter] ${errorMsg}`)
              result.errors?.push(errorMsg)
            })
          }

          if (validation.validTransactions.length > 0) {
            // Generate TAMA file
            const batchId = TamaFileGeneratorService.generateBatchId()
            const fileName = TamaFileGeneratorService.generateFileName(batchId)
            const fundingAccount = "2467246570570" // GiyaPay Metrobank account

            const fileContent = tamaService.generateFileContent(
              validation.validTransactions,
              fundingAccount
            )

            const metadata = tamaService.generateFileMetadata(
              batchId,
              fileName,
              validation.validTransactions,
              fundingAccount,
              generatedBy
            )

            // Create TAMA generation record
            const generationId = await tamaService.createTamaGeneration(
              metadata,
              `Automated settlement routing - ${new Date().toISOString()}`,
              sharedContext
            )

            // Upload to Google Cloud Storage
            const gcs = createGCSService()
            if (gcs) {
              const buffer = Buffer.from(fileContent, 'utf-8')
              const gcsResult = await gcs.uploadFile(buffer, fileName, {
                folder: 'settlement/tama',
                contentType: 'text/plain',
                makePublic: false, // Keep settlement files private
                metadata: {
                  batchId,
                  generationId,
                  generatedBy,
                  transactionCount: String(validation.validTransactions.length)
                }
              })
              
              if (gcsResult.success) {
                console.log('[SettlementRouter] TAMA file uploaded to GCS:', gcsResult.fileName)
              } else {
                console.error('[SettlementRouter] Failed to upload TAMA to GCS:', gcsResult.error)
                // Fallback to local storage
                const tamaDir = path.join(process.cwd(), 'static', 'settlement', 'tama')
                await fs.promises.mkdir(tamaDir, { recursive: true })
                const filePath = path.join(tamaDir, fileName)
                await fs.promises.writeFile(filePath, fileContent)
                console.log('[SettlementRouter] TAMA file saved locally as fallback')
              }
            } else {
              // No GCS configured, save locally
              const tamaDir = path.join(process.cwd(), 'static', 'settlement', 'tama')
              await fs.promises.mkdir(tamaDir, { recursive: true })
              const filePath = path.join(tamaDir, fileName)
              await fs.promises.writeFile(filePath, fileContent)
              console.log('[SettlementRouter] TAMA file saved locally (GCS not configured)')
            }

            result.tama_generation_id = generationId
            result.tama_file_name = fileName
            result.tama_transaction_count = validation.validTransactions.length
            result.tama_total_amount = metadata.total_amount

            console.log(`[SettlementRouter] ✅ TAMA batch created: ${generationId} (${validation.validTransactions.length} transactions, ₱${metadata.total_amount})`)
          } else {
            console.log('[SettlementRouter] ⚠️ No valid Metrobank transactions to process')
          }
        } else {
          console.log('[SettlementRouter] ℹ️ No Metrobank transactions found')
        }
      } catch (tamaError) {
        const errorMsg = `TAMA routing failed: ${tamaError instanceof Error ? tamaError.message : 'Unknown error'}`
        console.error(`[SettlementRouter] ❌ ${errorMsg}`)
        result.errors?.push(errorMsg)
      }

      // Route to DFT (Non-Metrobank)
      console.log('[SettlementRouter] --- Routing Non-Metrobank transactions to DFT ---')
      try {
        const nonMetrobankTransactions = await dftService.getNonMetrobankTransactions(
          dateFrom,
          dateTo,
          sharedContext
        )

        console.log(`[SettlementRouter] Found ${nonMetrobankTransactions.length} Non-Metrobank transactions`)

        if (nonMetrobankTransactions.length > 0) {
          const validation = dftService.validateTransactions(nonMetrobankTransactions)
          
          if (validation.invalidTransactions.length > 0) {
            console.warn(`[SettlementRouter] ${validation.invalidTransactions.length} invalid Non-Metrobank transactions`)
            validation.invalidTransactions.forEach(inv => {
              const errorMsg = `Non-Metrobank transaction ${inv.transaction.id} excluded: ${inv.errors.join(', ')}`
              console.error(`[SettlementRouter] ${errorMsg}`)
              result.errors?.push(errorMsg)
            })
          }

          if (validation.validTransactions.length > 0) {
            // Generate DFT file
            const batchId = DftFileGeneratorService.generateBatchId()
            const fileName = DftFileGeneratorService.generateFileName(batchId)

            const fileContent = dftService.generateFileContent(
              validation.validTransactions
            )

            const metadata = dftService.generateFileMetadata(
              batchId,
              fileName,
              validation.validTransactions,
              generatedBy
            )

            // Create DFT generation record
            const generationId = await dftService.createDftGeneration(
              metadata,
              `Automated settlement routing - ${new Date().toISOString()}`,
              sharedContext
            )

            // Upload to Google Cloud Storage
            const gcs = createGCSService()
            if (gcs) {
              const buffer = Buffer.from(fileContent, 'utf-8')
              const gcsResult = await gcs.uploadFile(buffer, fileName, {
                folder: 'settlement/dft',
                contentType: 'text/plain',
                makePublic: false, // Keep settlement files private
                metadata: {
                  batchId,
                  generationId,
                  generatedBy,
                  transactionCount: String(validation.validTransactions.length)
                }
              })
              
              if (gcsResult.success) {
                console.log('[SettlementRouter] DFT file uploaded to GCS:', gcsResult.fileName)
              } else {
                console.error('[SettlementRouter] Failed to upload DFT to GCS:', gcsResult.error)
                // Fallback to local storage
                const dftDir = path.join(process.cwd(), 'static', 'settlement', 'dft')
                await fs.promises.mkdir(dftDir, { recursive: true })
                const filePath = path.join(dftDir, fileName)
                await fs.promises.writeFile(filePath, fileContent)
                console.log('[SettlementRouter] DFT file saved locally as fallback')
              }
            } else {
              // No GCS configured, save locally
              const dftDir = path.join(process.cwd(), 'static', 'settlement', 'dft')
              await fs.promises.mkdir(dftDir, { recursive: true })
              const filePath = path.join(dftDir, fileName)
              await fs.promises.writeFile(filePath, fileContent)
              console.log('[SettlementRouter] DFT file saved locally (GCS not configured)')
            }

            result.dft_generation_id = generationId
            result.dft_file_name = fileName
            result.dft_transaction_count = validation.validTransactions.length
            result.dft_total_amount = metadata.total_amount

            console.log(`[SettlementRouter] ✅ DFT batch created: ${generationId} (${validation.validTransactions.length} transactions, ₱${metadata.total_amount})`)
          } else {
            console.log('[SettlementRouter] ⚠️ No valid Non-Metrobank transactions to process')
          }
        } else {
          console.log('[SettlementRouter] ℹ️ No Non-Metrobank transactions found')
        }
      } catch (dftError) {
        const errorMsg = `DFT routing failed: ${dftError instanceof Error ? dftError.message : 'Unknown error'}`
        console.error(`[SettlementRouter] ❌ ${errorMsg}`)
        result.errors?.push(errorMsg)
      }

      // Determine overall success
      const hasTamaOrDft = !!(result.tama_generation_id || result.dft_generation_id)
      const hasNoErrors = !result.errors || result.errors.length === 0
      result.success = hasTamaOrDft && hasNoErrors

      console.log('[SettlementRouter] ========== SETTLEMENT ROUTING COMPLETE ==========')
      console.log(`[SettlementRouter] Success: ${result.success}`)
      console.log(`[SettlementRouter] TAMA: ${result.tama_transaction_count || 0} transactions`)
      console.log(`[SettlementRouter] DFT: ${result.dft_transaction_count || 0} transactions`)
      console.log(`[SettlementRouter] Errors: ${result.errors?.length || 0}`)

      return result

    } catch (error) {
      console.error('[SettlementRouter] ❌ Fatal error during settlement routing:', error)
      result.success = false
      result.errors?.push(error instanceof Error ? error.message : 'Unknown error')
      return result
    }
  }

  /**
   * Get settlement summary for a date range
   */
  async getSettlementSummary(
    dateFrom?: string,
    dateTo?: string,
    sharedContext?: any
  ): Promise<any> {
    try {
      const manager = await this.getManager(sharedContext)
      
      const summary = {
        metrobank: {
          count: 0,
          total_amount: 0,
          has_incomplete_info: false
        },
        non_metrobank: {
          count: 0,
          total_amount: 0,
          has_incomplete_info: false
        }
      }

      // Get Metrobank summary
      const metrobankQuery = `
        SELECT 
          COUNT(*) as count,
          SUM(gt.amount) as total_amount,
          COUNT(CASE WHEN 
            COALESCE(s.bank_name, s.dft_bank_name) IS NULL 
            OR COALESCE(s.account_number, s.dft_account_number) IS NULL 
            OR COALESCE(s.account_name, s.dft_beneficiary_name) IS NULL
          THEN 1 END) as incomplete_count
        FROM giyapay_transaction gt
        LEFT JOIN seller s ON s.id = gt.vendor_id
        WHERE gt.status = 'SUCCESS'
          AND COALESCE(s.bank_name, s.dft_bank_name) ILIKE '%metrobank%'
      `
      const metrobankResult = await manager.raw(metrobankQuery)
      const metrobankRow = metrobankResult?.rows?.[0] || metrobankResult?.[0]
      if (metrobankRow) {
        summary.metrobank.count = parseInt(metrobankRow.count || 0)
        summary.metrobank.total_amount = parseFloat(metrobankRow.total_amount || 0)
        summary.metrobank.has_incomplete_info = parseInt(metrobankRow.incomplete_count || 0) > 0
      }

      // Get Non-Metrobank summary
      const nonMetrobankQuery = `
        SELECT 
          COUNT(*) as count,
          SUM(gt.amount) as total_amount,
          COUNT(CASE WHEN 
            COALESCE(s.swift_code, s.dft_swift_code) IS NULL 
            OR COALESCE(s.beneficiary_address, s.dft_beneficiary_address) IS NULL 
            OR COALESCE(s.beneficiary_bank_address, s.dft_bank_address) IS NULL
          THEN 1 END) as incomplete_count
        FROM giyapay_transaction gt
        LEFT JOIN seller s ON s.id = gt.vendor_id
        WHERE gt.status = 'SUCCESS'
          AND (
            (COALESCE(s.bank_name, s.dft_bank_name) NOT ILIKE '%metrobank%')
            OR COALESCE(s.bank_name, s.dft_bank_name) IS NULL
          )
      `
      const nonMetrobankResult = await manager.raw(nonMetrobankQuery)
      const nonMetrobankRow = nonMetrobankResult?.rows?.[0] || nonMetrobankResult?.[0]
      if (nonMetrobankRow) {
        summary.non_metrobank.count = parseInt(nonMetrobankRow.count || 0)
        summary.non_metrobank.total_amount = parseFloat(nonMetrobankRow.total_amount || 0)
        summary.non_metrobank.has_incomplete_info = parseInt(nonMetrobankRow.incomplete_count || 0) > 0
      }

      return summary

    } catch (error) {
      console.error('[SettlementRouter] Error getting settlement summary:', error)
      throw error
    }
  }
}

export default SettlementRouterService

