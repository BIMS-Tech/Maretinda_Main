import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import DftFileGeneratorService from '../../../services/dft-file-generator'
import * as fs from 'fs'
import * as path from 'path'

/**
 * @oas [get] /admin/dft
 * operationId: "AdminListDftGenerations"
 * summary: "List DFT Generations"
 * description: "Lists all DFT file generations with pagination."
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
 *             dft_generations:
 *               type: array
 *               items:
 *                 type: object
 *             count:
 *               type: integer
 * tags:
 *   - Admin DFT
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
    
    // Get or create DFT service
    let dftService: DftFileGeneratorService
    try {
      dftService = req.scope.resolve("dftFileGeneratorService") as any
    } catch (serviceError) {
      console.log('[Admin DFT] Service not in scope, creating new instance...')
      dftService = new DftFileGeneratorService(req.scope)
      req.scope.register({
        dftFileGeneratorService: { resolve: () => dftService, lifetime: "SINGLETON" }
      })
    }

    const dftGenerations = await dftService.getDftGenerations(
      parseInt(limit as string) || 50,
      parseInt(offset as string) || 0
    )

    res.status(200).json({
      dft_generations: dftGenerations,
      count: dftGenerations.length
    })
  } catch (error) {
    console.error('Error listing DFT generations:', error)
    res.status(500).json({
      message: 'Failed to list DFT generations',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * @oas [post] /admin/dft
 * operationId: "AdminCreateDftGeneration"
 * summary: "Create DFT Generation"
 * description: "Creates a new DFT file generation request for non-Metrobank merchants."
 * x-authenticated: true
 * requestBody:
 *   required: false
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         properties:
 *           date_from:
 *             type: string
 *             format: date
 *           date_to:
 *             type: string
 *             format: date
 *           notes:
 *             type: string
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             dft_generation:
 *               type: object
 * tags:
 *   - Admin DFT
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { date_from, date_to, notes } = req.body as any
    
    // Get admin user
    const adminUserId = req.auth_context?.actor_id || 'system'
    
    // Get or create DFT service
    let dftService: DftFileGeneratorService
    try {
      dftService = req.scope.resolve("dftFileGeneratorService") as any
    } catch (serviceError) {
      console.log('[Admin DFT] Service not in scope, creating new instance...')
      dftService = new DftFileGeneratorService(req.scope)
      req.scope.register({
        dftFileGeneratorService: { resolve: () => dftService, lifetime: "SINGLETON" }
      })
    }

    // Get non-Metrobank transactions
    const transactions = await dftService.getNonMetrobankTransactions(
      date_from,
      date_to
    )

    if (!transactions || transactions.length === 0) {
      res.status(400).json({
        message: 'No transactions available',
        error: 'No transactions available for DFT generation'
      })
      return
    }

    // Validate transactions
    const validation = dftService.validateTransactions(transactions)
    const { validTransactions, invalidTransactions } = validation

    if (invalidTransactions.length > 0) {
      const errors = invalidTransactions.map(inv => ({
        transaction_id: inv.transaction.id,
        errors: inv.errors
      }))
      console.warn('[Admin DFT] Some transactions have validation errors:', errors)
    }

    if (validTransactions.length === 0) {
      res.status(400).json({
        message: 'No valid transactions found for DFT generation',
        errors: invalidTransactions
      })
      return
    }

    // Generate DFT file data
    const batchId = DftFileGeneratorService.generateBatchId()
    const fileName = DftFileGeneratorService.generateFileName(batchId)

    // Generate file content
    const fileContent = dftService.generateFileContent(
      validTransactions
    )

    const metadata = dftService.generateFileMetadata(
      batchId,
      fileName,
      validTransactions,
      adminUserId
    )

    // Create DFT generation record
    const generationId = await dftService.createDftGeneration(metadata, notes)

    // Write file to disk
    const dftDir = path.join(process.cwd(), 'uploads', 'dft')
    await fs.promises.mkdir(dftDir, { recursive: true })
    
    const filePath = path.join(dftDir, fileName)
    await fs.promises.writeFile(filePath, fileContent)

    console.log(`DFT generation created: ${generationId} with ${validation.validTransactions.length} transactions, total: ${metadata.total_amount}`)

    res.status(200).json({
      dft_generation: {
        id: generationId,
        batch_id: batchId,
        file_name: fileName,
        file_path: filePath,
        transaction_count: validTransactions.length,
        total_amount: metadata.total_amount,
        invalid_count: invalidTransactions.length,
        validation_errors: invalidTransactions.length > 0 ? invalidTransactions.map(inv => ({
          transaction_id: inv.transaction.id,
          vendor_name: inv.transaction.vendor_name,
          errors: inv.errors
        })) : []
      }
    })

  } catch (error) {
    console.error('Error creating DFT generation record:', error)
    res.status(500).json({
      message: 'Failed to create DFT generation record',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

