import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

// Function to initialize DFT tables if they don't exist
async function initializeDftTables(container: any) {
  // Resolve pg connection using the correct MedusaJS pattern
  let pgConnection: any
  try {
    pgConnection = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  } catch (e) {
    // Fallbacks
    pgConnection = (container as any).__pg_connection__ || (container as any).pgConnection
  }

  if (!pgConnection) {
    throw new Error("Database connection not available")
  }
  
  // Create DFT Generation table
  await pgConnection.raw(`
    CREATE TABLE IF NOT EXISTS "dft_generation" (
      "id" text NOT NULL,
      "batch_id" text UNIQUE NOT NULL,
      "generation_date" timestamptz NOT NULL,
      "file_name" text NOT NULL,
      "file_path" text NULL,
      "status" text NOT NULL DEFAULT 'pending',
      "total_amount" numeric NOT NULL DEFAULT 0,
      "transaction_count" integer NOT NULL DEFAULT 0,
      "currency" text NOT NULL DEFAULT 'PHP',
      "generated_by" text NOT NULL,
      "processed_at" timestamptz NULL,
      "downloaded_at" timestamptz NULL,
      "file_size" integer NULL,
      "checksum" text NULL,
      "notes" text NULL,
      "error_message" text NULL,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      "deleted_at" timestamptz NULL,
      CONSTRAINT "dft_generation_pkey" PRIMARY KEY ("id")
    );
  `)
  
  // Create index
  await pgConnection.raw(`
    CREATE INDEX IF NOT EXISTS "IDX_dft_generation_batch_id" ON "dft_generation" (batch_id) WHERE deleted_at IS NULL;
  `)
  
  console.log('DFT tables initialized successfully')
}

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
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  
  try {
    // Ensure DFT tables exist first
    await initializeDftTables(req.scope)
    
    // Get real DFT generations from database using raw SQL
    let pgConnection: any
    try {
      pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch (e) {
      pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    if (!pgConnection) {
      throw new Error("Database connection not available")
    }

    const result = await pgConnection.raw(`
      SELECT id, batch_id, status, generation_date, total_amount, 
             transaction_count, currency, file_name, generated_by, 
             created_at, updated_at
      FROM dft_generation 
      WHERE deleted_at IS NULL 
      ORDER BY created_at DESC 
      LIMIT 20
    `)

    res.json({
      dft_generations: result.rows || [],
      count: result.rows?.length || 0,
      offset: 0,
      limit: 20
    })
    
  } catch (error) {
    console.error('Error fetching DFT generations:', error)
    
    // Check if it's a table not found error
    if (error.message?.includes('relation') || error.message?.includes('table') || error.message?.includes('entity')) {
      // Table doesn't exist - initialize DFT system
      console.log('DFT tables not found, initializing DFT system...')
      
      try {
        // Initialize the DFT tables using raw SQL
        await initializeDftTables(req.scope)
        
        // Try again after initialization using raw SQL
        let pgConnection: any
        try {
          pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
        } catch (e) {
          pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
        }

        if (!pgConnection) {
          throw new Error("Database connection not available")
        }

        const result = await pgConnection.raw(`
          SELECT id, batch_id, status, generation_date, total_amount, 
                 transaction_count, currency, file_name, generated_by, 
                 created_at, updated_at
          FROM dft_generation 
          WHERE deleted_at IS NULL 
          ORDER BY created_at DESC 
          LIMIT 20
        `)

        res.json({
          dft_generations: result.rows || [],
          count: result.rows?.length || 0,
          offset: 0,
          limit: 20,
          message: "DFT system initialized successfully"
        })
        
      } catch (initError) {
        console.error('Failed to initialize DFT system:', initError)
        res.json({
          dft_generations: [],
          count: 0,
          offset: 0,
          limit: 20,
          message: "DFT system initialization in progress. Please refresh to see generated files."
        })
      }
    } else {
      // Other database error
      res.json({
        dft_generations: [],
        count: 0,
        offset: 0,
        limit: 20,
        message: "Database connection issue. Please try again later."
      })
    }
  }
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
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  
  try {
    // Ensure DFT tables exist
    await initializeDftTables(req.scope)
    
    // Create a new DFT generation record using raw SQL for now
    const batchId = "DFT_" + new Date().toISOString().slice(0, 10).replace(/-/g, '') + "_" + Date.now()
    const generationId = "dft_gen_" + Date.now()
    
    let pgConnection: any
    try {
      pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch (e) {
      pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    if (!pgConnection) {
      throw new Error("Database connection not available")
    }
    
    await pgConnection.raw(`
      INSERT INTO "dft_generation" (
        "id", "batch_id", "status", "generation_date", 
        "total_amount", "transaction_count", "currency", 
        "generated_by", "file_name"
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      generationId,
      batchId,
      "pending", 
      new Date(),
      0,
      0,
      "PHP",
      req.auth_context?.actor_id || "admin",
      `${batchId}_MARETINDA.txt`
    ])
    
    const dftGeneration = {
      id: generationId,
      batch_id: batchId,
      status: "pending",
      generation_date: new Date().toISOString(),
      total_amount: 0,
      transaction_count: 0,
      currency: "PHP",
      generated_by: req.auth_context?.actor_id || "admin",
      file_name: `${batchId}_MARETINDA.txt`
    }
    
    res.status(201).json({ dft_generation: dftGeneration })
    
  } catch (error) {
    console.error('Error creating DFT generation record:', error)
    res.status(500).json({
      message: 'Failed to create DFT generation record',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
