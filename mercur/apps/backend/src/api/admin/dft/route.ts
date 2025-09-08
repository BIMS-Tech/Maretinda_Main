import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * @oas [get] /admin/dft
 * operationId: "AdminListDftGenerations"
 * summary: "List DFT Generations"
 * description: "Retrieves a list of DFT file generations."
 * x-authenticated: true
 * parameters:
 *   - name: offset
 *     in: query
 *     schema:
 *       type: number
 *     required: false
 *     description: The number of items to skip before starting to collect the result set.
 *   - name: limit
 *     in: query
 *     schema:
 *       type: number
 *     required: false
 *     description: The number of items to return.
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
 *               description: The total number of items available
 *             offset:
 *               type: integer
 *               description: The number of items skipped before these items
 *             limit:
 *               type: integer
 *               description: The number of items per page
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
  // For now, return mock data until DFT module is registered
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const mockData = {
    dft_generations: [
      {
        id: "dft_gen_" + today.getTime(),
        batch_id: "DFT_" + today.toISOString().slice(0, 10).replace(/-/g, ''),
        status: "generated",
        generation_date: today.toISOString(),
        total_amount: 285750.00,
        transaction_count: 42,
        currency: "PHP",
        file_name: `DFT_${today.toISOString().slice(0, 10).replace(/-/g, '')}_MARETINDA.txt`,
        generated_by: "admin"
      },
      {
        id: "dft_gen_" + yesterday.getTime(),
        batch_id: "DFT_" + yesterday.toISOString().slice(0, 10).replace(/-/g, ''),
        status: "processed",
        generation_date: yesterday.toISOString(),
        total_amount: 192450.00,
        transaction_count: 28,
        currency: "PHP",
        file_name: `DFT_${yesterday.toISOString().slice(0, 10).replace(/-/g, '')}_MARETINDA.txt`,
        generated_by: "admin"
      }
    ],
    count: 2,
    offset: 0,
    limit: 20
  }

  res.json(mockData)
}

/**
 * @oas [post] /admin/dft
 * operationId: "AdminCreateDftGeneration"
 * summary: "Create DFT Generation"
 * description: "Creates a new DFT file generation request."
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
 *             description: Array of seller IDs to include in DFT generation
 *           payout_ids:
 *             type: array
 *             items:
 *               type: string
 *             description: Array of payout IDs to include in DFT generation
 *           date_range:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 format: date-time
 *               to:
 *                 type: string
 *                 format: date-time
 *           currency:
 *             type: string
 *             default: "PHP"
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
  // For now, return mock data until DFT module is registered
  const mockGeneration = {
    id: "dft_gen_" + Date.now(),
    batch_id: "DFT_" + new Date().toISOString().slice(0, 10).replace(/-/g, ''),
    status: "pending",
    generation_date: new Date().toISOString(),
    total_amount: 0,
    transaction_count: 0,
    currency: "PHP"
  }

  res.status(201).json({ dft_generation: mockGeneration })
}
