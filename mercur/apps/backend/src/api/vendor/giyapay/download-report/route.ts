import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    console.log('[Vendor GiyaPay Download] Starting report generation')
    
    // Get vendor ID from authenticated user
    const vendor = req.scope.resolve("auth_user") || (req as any).auth_user
    const vendorId = vendor?.member_id || vendor?.id
    
    if (!vendorId) {
      console.log('[Vendor GiyaPay Download] ❌ No vendor ID found')
      return res.status(401).json({ error: 'Unauthorized - vendor not found' })
    }
    
    console.log('[Vendor GiyaPay Download] Request from vendor:', vendorId)
    
    // Get query parameters
    const { 
      format = 'dft', 
      dateFrom, 
      dateTo, 
      take = 1000, 
      skip = 0 
    } = req.query
    
    console.log('[Vendor GiyaPay Download] Parameters:', { format, dateFrom, dateTo, take, skip })
    
    // Get or create the giyaPayService
    let giyaPayService
    try {
      giyaPayService = req.scope.resolve("giyaPayService")
      console.log('[Vendor GiyaPay Download] ✅ Service resolved from scope')
    } catch (serviceError) {
      console.log('[Vendor GiyaPay Download] Service not in scope, registering on-demand...')
      const GiyaPayService = require("../../../../services/giyapay").default
      req.scope.register("giyaPayService", new GiyaPayService(req.scope))
      giyaPayService = req.scope.resolve("giyaPayService")
      console.log('[Vendor GiyaPay Download] ✅ Service registered and resolved on-demand')
    }
    
    if (format === 'dft') {
      // Generate DFT report for vendor only
      const dftContent = await giyaPayService.generateDFTReport({
        take: parseInt(take as string) || 1000,
        skip: parseInt(skip as string) || 0,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        order: { createdAt: 'DESC' },
        vendorId // Filter by vendor
      })
      
      const filename = `vendor_giyapay_dft_report_${new Date().toISOString().split('T')[0]}.txt`
      
      res.set({
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      })
      
      console.log(`[Vendor GiyaPay Download] ✅ Sending DFT report: ${filename}`)
      return res.send(dftContent)
    } else {
      // Generate JSON report for vendor only
      const transactions = await giyaPayService.getTransactionsForAPI({
        take: parseInt(take as string) || 1000,
        skip: parseInt(skip as string) || 0,
        order: { createdAt: 'DESC' },
        vendorId // Filter by vendor
      })
      
      const filename = `vendor_giyapay_transactions_${new Date().toISOString().split('T')[0]}.json`
      
      res.set({
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      })
      
      console.log(`[Vendor GiyaPay Download] ✅ Sending JSON report: ${filename}`)
      return res.json(transactions)
    }
    
  } catch (error) {
    console.error('[Vendor GiyaPay Download] ❌ Error generating report:', error)
    return res.status(500).json({ 
      error: 'Failed to generate report',
      message: error.message 
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  return GET(req, res) // Support both GET and POST
}


























