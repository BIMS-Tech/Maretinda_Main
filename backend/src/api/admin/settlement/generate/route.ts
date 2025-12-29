import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import SettlementRouterService from '../../../../services/settlement-router'

/**
 * @oas [post] /admin/settlement/generate
 * operationId: "AdminGenerateSettlement"
 * summary: "Generate Settlement Reports"
 * description: "Manually trigger settlement report generation (TAMA and DFT)."
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
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *             tama_generation_id:
 *               type: string
 *             dft_generation_id:
 *               type: string
 * tags:
 *   - Admin Settlement
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { date_from, date_to } = req.body as any
    const adminUserId = req.auth_context?.actor_id || 'admin'

    console.log('[Admin Settlement] Manual settlement generation triggered')
    console.log(`[Admin Settlement] Date range: ${date_from || 'all'} to ${date_to || 'all'}`)

    const settlementRouter = new SettlementRouterService(req.scope)
    
    const result = await settlementRouter.routeSettlements(
      date_from,
      date_to,
      adminUserId
    )

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Settlement reports generated successfully',
        tama: result.tama_generation_id ? {
          generation_id: result.tama_generation_id,
          file_name: result.tama_file_name,
          transaction_count: result.tama_transaction_count,
          total_amount: result.tama_total_amount
        } : null,
        dft: result.dft_generation_id ? {
          generation_id: result.dft_generation_id,
          file_name: result.dft_file_name,
          transaction_count: result.dft_transaction_count,
          total_amount: result.dft_total_amount
        } : null,
        errors: result.errors || []
      })
    } else {
      res.status(400).json({
        success: false,
        message: 'Settlement generation completed with errors',
        errors: result.errors || ['Unknown error occurred']
      })
    }

  } catch (error) {
    console.error('[Admin Settlement] Error generating settlements:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to generate settlement reports',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

