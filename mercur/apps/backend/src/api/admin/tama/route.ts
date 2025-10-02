import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import TamaFileGeneratorService from '../../../services/tama-file-generator'

/**
 * @oas [get] /admin/tama
 * operationId: "AdminListTamaGenerations"
 * summary: "List TAMA Generations"
 * description: "Lists all TAMA file generations with pagination."
 * x-authenticated: true
 * parameters:
 *   - (query) limit=50 {integer} Limit the number of results returned
 *   - (query) offset=0 {integer} Number of results to skip
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             tama_generations:
 *               type: array
 *               items:
 *                 type: object
 *             count:
 *               type: integer
 * tags:
 *   - Admin TAMA
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { limit = 50, offset = 0 } = req.query as any
    
    // Get or create TAMA service
    let tamaService: TamaFileGeneratorService
    try {
      tamaService = req.scope.resolve("tamaFileGeneratorService")
    } catch (serviceError) {
      console.log('[Admin TAMA] Service not in scope, registering on-demand...')
      req.scope.register("tamaFileGeneratorService", new TamaFileGeneratorService(req.scope))
      tamaService = req.scope.resolve("tamaFileGeneratorService")
    }
    
    const tamaGenerations = await tamaService.getTamaGenerations(
      parseInt(limit as string) || 50,
      parseInt(offset as string) || 0
    )
    
    res.status(200).json({
      tama_generations: tamaGenerations,
      count: tamaGenerations.length
    })
    
  } catch (error) {
    console.error('Error listing TAMA generations:', error)
    res.status(500).json({
      message: 'Failed to list TAMA generations',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * @oas [post] /admin/tama
 * operationId: "AdminCreateTamaGeneration"
 * summary: "Create TAMA Generation"
 * description: "Creates a new TAMA file generation request for Metrobank merchants."
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         properties:
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
 *             description: BIMS Bank Account Number for funding
 *           notes:
 *             type: string
 * responses:
 *   "201":
 *     description: Created
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             tama_generation:
 *               type: object
 * tags:
 *   - Admin TAMA
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { date_range, funding_account, notes } = req.body as any
    
    if (!funding_account) {
      res.status(400).json({
        message: 'Funding account is required',
        error: 'Missing required field: funding_account'
      })
      return
    }
    
    // Get or create TAMA service
    let tamaService: TamaFileGeneratorService
    try {
      tamaService = req.scope.resolve("tamaFileGeneratorService")
    } catch (serviceError) {
      console.log('[Admin TAMA] Service not in scope, registering on-demand...')
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
    
    if (validation.invalidTransactions.length > 0) {
      const errors = validation.invalidTransactions.map(invalid => 
        `Transaction ${invalid.transaction.reference_number}: ${invalid.errors.join(', ')}`
      )
      console.warn('[Admin TAMA] Some transactions have validation errors:', errors)
    }
    
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
    
    // Save file content (similar to DFT implementation)
    const fs = require('fs').promises
    const path = require('path')
    const tamaDir = path.join(process.cwd(), 'uploads', 'tama')
    await fs.mkdir(tamaDir, { recursive: true })
    
    const filePath = path.join(tamaDir, fileName)
    await fs.writeFile(filePath, fileContent, 'utf8')
    
    console.log(`TAMA generation created: ${generationId} with ${validation.validTransactions.length} transactions, total: ${metadata.total_amount}`)

    res.status(201).json({ 
      tama_generation: {
        id: generationId,
        batch_id: batchId,
        file_name: fileName,
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
      },
      file_content_preview: fileContent.split('\n').slice(0, 5).join('\n') + (fileContent.split('\n').length > 5 ? '\n...' : '')
    })

  } catch (error) {
    console.error('Error creating TAMA generation record:', error)
    res.status(500).json({
      message: 'Failed to create TAMA generation record',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}


