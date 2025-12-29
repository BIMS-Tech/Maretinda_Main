import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import SettlementRouterService from '../../../services/settlement-router'

/**
 * @oas [get] /admin/settlement/summary
 * operationId: "AdminGetSettlementSummary"
 * summary: "Get Settlement Summary"
 * description: "Get summary of pending settlements for Metrobank and Non-Metrobank."
 * x-authenticated: true
 * parameters:
 *   - (query) date_from {string} Start date for summary
 *   - (query) date_to {string} End date for summary
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 * tags:
 *   - Admin Settlement
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { date_from, date_to } = req.query as any

    const settlementRouter = new SettlementRouterService(req.scope)
    const summary = await settlementRouter.getSettlementSummary(date_from, date_to)

    res.status(200).json({
      summary,
      date_range: {
        from: date_from || 'all',
        to: date_to || 'all'
      }
    })

  } catch (error) {
    console.error('[Admin Settlement] Error getting settlement summary:', error)
    res.status(500).json({
      message: 'Failed to get settlement summary',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

