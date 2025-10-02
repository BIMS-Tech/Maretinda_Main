import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import TamaFileGeneratorService from '../../../../services/tama-file-generator'

/**
 * @oas [post] /admin/reports/generate
 * operationId: "AdminGenerateReport"
 * summary: "Generate Report"
 * description: "Generates a new report (DFT or TAMA) based on the specified type."
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         required:
 *           - report_type
 *         properties:
 *           report_type:
 *             type: string
 *             enum: [dft, tama]
 *             description: Type of report to generate
 *           date_range:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 format: date-time
 *               to:
 *                 type: string
 *                 format: date-time
 *           funding_account:
 *             type: string
 *             description: BIMS Bank Account Number (required for TAMA)
 *           source_account:
 *             type: string
 *             description: Source account for transfers (required for DFT)
 *           seller_ids:
 *             type: array
 *             items:
 *               type: string
 *             description: Array of seller IDs to include (DFT only)
 *           notes:
 *             type: string
 * responses:
 *   "201":
 *     description: Report generation started
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             report:
 *               type: object
 * tags:
 *   - Admin Reports
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { report_type, date_range, funding_account, source_account, seller_ids, notes } = req.body as any
    
    if (!report_type) {
      res.status(400).json({
        message: 'Report type is required',
        error: 'Missing required field: report_type'
      })
      return
    }
    
    if (report_type.toLowerCase() === 'tama') {
      // Generate TAMA report
      if (!funding_account) {
        res.status(400).json({
          message: 'Funding account is required for TAMA reports',
          error: 'Missing required field: funding_account'
        })
        return
      }
      
      // Get or create TAMA service
      let tamaService: TamaFileGeneratorService
      try {
        tamaService = req.scope.resolve("tamaFileGeneratorService")
      } catch (serviceError) {
        console.log('[Admin Reports Generate] TAMA service not in scope, registering on-demand...')
        req.scope.register("tamaFileGeneratorService", new TamaFileGeneratorService(req.scope))
        tamaService = req.scope.resolve("tamaFileGeneratorService")
      }
      
      // Get Metrobank transactions
      const transactions = await tamaService.getMetrobankTransactions(
        date_range?.from,
        date_range?.to
      )
      
      if (transactions.length === 0) {
        res.status(400).json({
          message: 'No Metrobank transactions found for the specified date range',
          error: 'No transactions available for TAMA generation'
        })
        return
      }
      
      // Validate transactions
      const validation = tamaService.validateTransactions(transactions)
      
      if (validation.validTransactions.length === 0) {
        res.status(400).json({
          message: 'No valid transactions found for TAMA generation',
          error: 'All transactions have validation errors',
          validation_errors: validation.invalidTransactions
        })
        return
      }
      
      // Generate TAMA file data
      const batchId = TamaFileGeneratorService.generateBatchId()
      const fileName = TamaFileGeneratorService.generateFileName(batchId)
      
      // Generate file content
      const fileContent = tamaService.generateFileContent(
        validation.validTransactions,
        funding_account
      )
      
      // Generate metadata
      const metadata = tamaService.generateFileMetadata(
        batchId,
        fileName,
        validation.validTransactions,
        funding_account,
        req.auth_context?.actor_id || "admin"
      )
      
      // Create TAMA generation record
      const generationId = await tamaService.createTamaGeneration(metadata, notes)
      
      // Save file content
      const fs = require('fs').promises
      const path = require('path')
      const tamaDir = path.join(process.cwd(), 'uploads', 'tama')
      await fs.mkdir(tamaDir, { recursive: true })
      
      const filePath = path.join(tamaDir, fileName)
      await fs.writeFile(filePath, fileContent, 'utf8')
      
      console.log(`TAMA generation created via reports: ${generationId} with ${validation.validTransactions.length} transactions`)

      res.status(201).json({
        report: {
          id: generationId,
          batch_id: batchId,
          file_name: fileName,
          report_type: 'TAMA',
          status: "generated",
          transaction_count: validation.validTransactions.length,
          total_amount: metadata.total_amount,
          currency: "PHP",
          generated_by: req.auth_context?.actor_id || "admin",
          funding_account: funding_account,
          notes: notes || "",
          file_path: filePath
        },
        validation_summary: {
          valid_transactions: validation.validTransactions.length,
          invalid_transactions: validation.invalidTransactions.length,
          validation_errors: validation.invalidTransactions.map(invalid => ({
            reference_number: invalid.transaction.reference_number,
            errors: invalid.errors
          }))
        }
      })
      
    } else if (report_type.toLowerCase() === 'dft') {
      // For DFT, redirect to existing DFT generation endpoint
      res.status(400).json({
        message: 'DFT generation should use the dedicated DFT endpoint',
        error: 'Please use /admin/dft/generate for DFT report generation'
      })
      
    } else {
      res.status(400).json({
        message: 'Invalid report type',
        error: 'Report type must be either "dft" or "tama"'
      })
    }
    
  } catch (error) {
    console.error('[Admin Reports Generate] Error generating report:', error)
    res.status(500).json({
      message: 'Failed to generate report',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

