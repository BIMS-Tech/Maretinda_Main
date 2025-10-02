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
        
        for (const dft of dftResults) {
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
        console.warn('[Admin Reports] DFT table might not exist:', dftError.message)
      }
    }
    
    // Get TAMA reports (if not filtering for DFT only)
    if (!report_type || report_type.toLowerCase() === 'tama') {
      try {
        // Initialize TAMA service to ensure tables exist
        let tamaService: TamaFileGeneratorService
        try {
          tamaService = req.scope.resolve("tamaFileGeneratorService")
        } catch (serviceError) {
          console.log('[Admin Reports] TAMA service not in scope, registering on-demand...')
          req.scope.register("tamaFileGeneratorService", new TamaFileGeneratorService(req.scope))
          tamaService = req.scope.resolve("tamaFileGeneratorService")
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
        
        for (const tama of tamaResults) {
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
        console.warn('[Admin Reports] TAMA table might not exist:', tamaError.message)
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
      
      // Redirect to TAMA generation endpoint
      const tamaResponse = await fetch(`${req.protocol}://${req.get('host')}/admin/tama`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.get('Authorization') || '',
          'Cookie': req.get('Cookie') || ''
        },
        body: JSON.stringify({
          date_range,
          funding_account,
          notes
        })
      })
      
      const tamaResult = await tamaResponse.json()
      
      if (!tamaResponse.ok) {
        res.status(tamaResponse.status).json(tamaResult)
        return
      }
      
      res.status(201).json({
        report: {
          ...tamaResult.tama_generation,
          report_type: 'TAMA'
        },
        validation_summary: tamaResult.validation_summary
      })
      
    } else if (report_type.toLowerCase() === 'dft') {
      // Generate DFT report
      if (!source_account) {
        res.status(400).json({
          message: 'Source account is required for DFT reports',
          error: 'Missing required field: source_account'
        })
        return
      }
      
      // Redirect to DFT generation endpoint
      const dftResponse = await fetch(`${req.protocol}://${req.get('host')}/admin/dft/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.get('Authorization') || '',
          'Cookie': req.get('Cookie') || ''
        },
        body: JSON.stringify({
          seller_ids,
          date_range,
          source_account,
          notes
        })
      })
      
      const dftResult = await dftResponse.json()
      
      if (!dftResponse.ok) {
        res.status(dftResponse.status).json(dftResult)
        return
      }
      
      res.status(201).json({
        report: {
          ...dftResult.dft_generation,
          report_type: 'DFT'
        },
        validation_summary: dftResult.validation_summary
      })
      
    } else {
      res.status(400).json({
        message: 'Invalid report type',
        error: 'Report type must be either "dft" or "tama"'
      })
    }
    
  } catch (error) {
    console.error('[Admin Reports] Error generating report:', error)
    res.status(500).json({
      message: 'Failed to generate report',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}


