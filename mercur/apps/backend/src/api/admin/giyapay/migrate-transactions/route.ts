import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    console.log('[Admin GiyaPay Migration] Starting transaction migration')
    
    // Get or create the giyaPayService
    let giyaPayService
    try {
      giyaPayService = req.scope.resolve("giyaPayService")
      console.log('[Admin GiyaPay Migration] ✅ Service resolved from scope')
    } catch (serviceError) {
      console.log('[Admin GiyaPay Migration] Service not in scope, registering on-demand...')
      const GiyaPayService = require("../../../../services/giyapay").default
      req.scope.register("giyaPayService", new GiyaPayService(req.scope))
      giyaPayService = req.scope.resolve("giyaPayService")
      console.log('[Admin GiyaPay Migration] ✅ Service registered and resolved on-demand')
    }
    
    // Get database connection
    let pgConnection
    try {
      pgConnection = req.scope.resolve("__pg_connection__") || 
                     req.scope.resolve("pgConnection") ||
                     req.scope.container.__pg_connection__
      console.log('[Admin GiyaPay Migration] ✅ Database connection found')
    } catch (connectionError) {
      console.log('[Admin GiyaPay Migration] ❌ Database connection failed:', connectionError.message)
      return res.status(500).json({ 
        error: 'Database connection not available',
        message: connectionError.message 
      })
    }
    
    // Update existing transactions with default vendor information
    const updateResult = await pgConnection.raw(`
      UPDATE giyapay_transactions 
      SET 
        vendor_id = COALESCE(vendor_id, 'default_vendor'),
        vendor_name = COALESCE(vendor_name, 'Default Vendor'),
        beneficiary_name = COALESCE(beneficiary_name, 'Default Beneficiary'),
        beneficiary_account = COALESCE(beneficiary_account, 'DEFAULT_ACCOUNT'),
        beneficiary_address = COALESCE(beneficiary_address, 'Philippines'),
        beneficiary_bank_name = COALESCE(beneficiary_bank_name, 'Default Bank'),
        beneficiary_swift_code = COALESCE(beneficiary_swift_code, 'DEFAULTPH'),
        beneficiary_bank_address = COALESCE(beneficiary_bank_address, 'Philippines'),
        remittance_type = COALESCE(remittance_type, 'DFT'),
        source_account = COALESCE(source_account, 'GIYAPAY_MAIN'),
        purpose = COALESCE(purpose, CONCAT('DFT ', DATE(created_at)))
      WHERE vendor_id IS NULL OR vendor_id = ''
    `)
    
    console.log('[Admin GiyaPay Migration] ✅ Migration completed:', updateResult)
    
    // Get count of updated transactions
    const countResult = await pgConnection.raw(
      "SELECT COUNT(*) as total FROM giyapay_transactions WHERE vendor_id IS NOT NULL"
    )
    
    const totalTransactions = countResult.rows[0]?.total || 0
    
    return res.status(200).json({
      success: true,
      message: 'Transactions migrated successfully',
      totalTransactions: parseInt(totalTransactions),
      migrationResult: updateResult
    })
    
  } catch (error) {
    console.error('[Admin GiyaPay Migration] ❌ Error during migration:', error)
    return res.status(500).json({ 
      error: 'Migration failed',
      message: error.message 
    })
  }
}





















