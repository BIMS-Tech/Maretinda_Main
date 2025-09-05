import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { generateDftFileWorkflow } from '../../../../workflows/dft/workflows'

/**
 * @oas [post] /admin/dft/generate
 * operationId: "AdminGenerateDftFile"
 * summary: "Generate DFT File"
 * description: "Generates a DFT file based on pending payouts and vendor configurations."
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         properties:
 *           seller_ids:
 *             type: array
 *             items:
 *               type: string
 *             description: Array of seller IDs to include
 *           include_all_pending:
 *             type: boolean
 *             default: false
 *             description: Include all pending payouts
 *           date_range:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 format: date-time
 *               to:
 *                 type: string
 *                 format: date-time
 *           source_account:
 *             type: string
 *             description: Source account for transfers
 *           notes:
 *             type: string
 * responses:
 *   "201":
 *     description: DFT file generation started
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
  const { seller_ids, include_all_pending, date_range, source_account, notes } = req.validatedBody as any
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
    // Execute DFT generation workflow
    const { result: workflowResult } = await generateDftFileWorkflow(req.scope).run({
      input: {
        seller_ids: seller_ids,
        source_account: source_account || "123456789",
        generated_by: req.auth_context?.actor_id || "admin",
        notes: notes,
        date_range: date_range
      }
    })

    res.status(201).json({ 
      dft_generation: {
        id: workflowResult.dft_generation_id,
        batch_id: workflowResult.batch_id,
        file_name: workflowResult.file_name,
        file_path: workflowResult.file_path,
        status: "generated",
        transaction_count: workflowResult.transaction_count,
        total_amount: workflowResult.total_amount,
        currency: "PHP",
        generated_by: req.auth_context?.actor_id || "admin",
        notes: notes || ""
      },
      validation_summary: workflowResult.validation_summary
    })

  } catch (error) {
    console.error('Error generating DFT file:', error)
    res.status(500).json({
      message: 'Failed to generate DFT file',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}


