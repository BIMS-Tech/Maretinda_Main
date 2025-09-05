import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'

/**
 * @oas [get] /admin/dft/{id}
 * operationId: "AdminGetDftGeneration"
 * summary: "Get DFT Generation"
 * description: "Retrieves a DFT generation by its ID."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     schema:
 *       type: string
 *     description: The ID of the DFT generation.
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
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params

  // For now, return mock data until DFT module is registered
  const mockGeneration = {
    id,
    batch_id: "DFT_" + new Date().toISOString().slice(0, 10).replace(/-/g, ''),
    status: "pending",
    generation_date: new Date().toISOString(),
    total_amount: 0,
    transaction_count: 0,
    currency: "PHP",
    file_name: null,
    file_path: null
  }

  res.json({ dft_generation: mockGeneration })
}
