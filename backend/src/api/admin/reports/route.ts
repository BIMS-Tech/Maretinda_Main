import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import TamaFileGeneratorService from '../../../services/tama-file-generator'

/**
 * @oas [get] /admin/reports
 * operationId: "AdminListReports"
 * summary: "List Reports"
 * description: "Lists all available reports including DFT and TAMA file generations."
 * x-authenticated: true
 * parameters:
 *   - (query) limit=50 {integer} Limit the number of results returned
 *   - (query) offset=0 {integer} Number of results to skip
 *   - (query) report_type {string} Filter by report type (dft, tama)
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             reports:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     format: date
 *                   file_name:
 *                     type: string
 *                   report_type:
 *                     type: string
 *                     enum: [DFT, TAMA]
 *                   download_url:
 *                     type: string
 *                   id:
 *                     type: string
 *                   status:
 *                     type: string
 *                   transaction_count:
 *                     type: integer
 *                   total_amount:
 *                     type: number
 *             count:
 *               type: integer
 * tags:
 *   - Admin Reports
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { limit = 50, offset = 0, report_type } = req.query as any
    
    // Get database connection
    let pgConnection: any
    try {
      pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch (e) {
      pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    if (!pgConnection) {
      res.status(500).json({
        message: "Database connection not available",
        error: "Unable to connect to database"
      })
      return
    }
    
    const reports: any[] = []
    
    // Get DFT reports (if not filtering for TAMA only)
    if (!report_type || report_type.toLowerCase() === 'dft') {
      try {
        const dftResults = await pgConnection.raw(`
          SELECT 
            id, batch_id, generation_date, file_name, status, 
            transaction_count, total_amount, currency, generated_by,
            created_at, updated_at
          FROM "dft_generation"
          WHERE deleted_at IS NULL
          ORDER BY generation_date DESC
          LIMIT ? OFFSET ?
        `, [parseInt(limit as string) || 50, parseInt(offset as string) || 0])
        
        const rows = dftResults?.rows || dftResults || []
        
        for (const dft of rows) {
          reports.push({
            id: dft.id,
            date: new Date(dft.generation_date).toISOString().split('T')[0],
            file_name: `Maretinda Transactions ${new Date(dft.generation_date).toISOString().slice(2, 10).replace(/-/g, '')}`,
            report_type: 'DFT',
            download_url: `/admin/dft/${dft.id}/download`,
            status: dft.status,
            transaction_count: dft.transaction_count,
            total_amount: parseFloat(dft.total_amount),
            currency: dft.currency,
            generated_by: dft.generated_by,
            batch_id: dft.batch_id,
            original_file_name: dft.file_name,
            created_at: dft.created_at,
            updated_at: dft.updated_at
          })
        }
      } catch (dftError) {
        console.warn('[Admin Reports] DFT table might not exist:', (dftError as Error).message)
      }
    }
    
    // Get TAMA reports (if not filtering for DFT only)
    if (!report_type || report_type.toLowerCase() === 'tama') {
      try {
        // Initialize TAMA service to ensure tables exist
        let tamaService: TamaFileGeneratorService
        try {
          tamaService = req.scope.resolve("tamaFileGeneratorService") as any
        } catch (serviceError) {
          tamaService = new TamaFileGeneratorService(req.scope)
          req.scope.register({
            tamaFileGeneratorService: { resolve: () => tamaService, lifetime: "SINGLETON" }
          })
        }
        
        const tamaResults = await pgConnection.raw(`
          SELECT 
            id, batch_id, generation_date, file_name, status, 
            transaction_count, total_amount, currency, generated_by,
            funding_account, created_at, updated_at
          FROM "tama_generation"
          WHERE deleted_at IS NULL
          ORDER BY generation_date DESC
          LIMIT ? OFFSET ?
        `, [parseInt(limit as string) || 50, parseInt(offset as string) || 0])
        
        const rows = tamaResults?.rows || tamaResults || []
        
        for (const tama of rows) {
          reports.push({
            id: tama.id,
            date: new Date(tama.generation_date).toISOString().split('T')[0],
            file_name: `Maretinda Transactions ${new Date(tama.generation_date).toISOString().slice(2, 10).replace(/-/g, '')}`,
            report_type: 'TAMA',
            download_url: `/admin/tama/${tama.id}/download`,
            status: tama.status,
            transaction_count: tama.transaction_count,
            total_amount: parseFloat(tama.total_amount),
            currency: tama.currency,
            generated_by: tama.generated_by,
            batch_id: tama.batch_id,
            funding_account: tama.funding_account,
            original_file_name: tama.file_name,
            created_at: tama.created_at,
            updated_at: tama.updated_at
          })
        }
      } catch (tamaError) {
        console.warn('[Admin Reports] TAMA table might not exist:', (tamaError as Error).message)
      }
    }
    
    // Sort all reports by generation date (most recent first)
    reports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
    // Apply limit and offset to combined results
    const paginatedReports = reports.slice(
      parseInt(offset as string) || 0,
      (parseInt(offset as string) || 0) + (parseInt(limit as string) || 50)
    )
    
    res.status(200).json({
      reports: paginatedReports,
      count: paginatedReports.length,
      total: reports.length
    })
    
  } catch (error) {
    console.error('[Admin Reports] Error listing reports:', error)
    res.status(500).json({
      message: 'Failed to list reports',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
