import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    console.log('[Admin GiyaPay Download] Starting report generation')
    
    // Get query parameters
    const { 
      format = 'dft', 
      dateFrom, 
      dateTo, 
      take = 1000, 
      skip = 0 
    } = req.query
    
    console.log('[Admin GiyaPay Download] Parameters:', { format, dateFrom, dateTo, take, skip })
    
    // Get or create the giyaPayService
    let giyaPayService
    try {
      giyaPayService = req.scope.resolve("giyaPayService")
      console.log('[Admin GiyaPay Download] ✅ Service resolved from scope')
    } catch (serviceError) {
      console.log('[Admin GiyaPay Download] Service not in scope, registering on-demand...')
      const GiyaPayService = require("../../../../services/giyapay").default
      req.scope.register("giyaPayService", new GiyaPayService(req.scope))
      giyaPayService = req.scope.resolve("giyaPayService")
      console.log('[Admin GiyaPay Download] ✅ Service registered and resolved on-demand')
    }
    
    if (format === 'dft') {
      // Generate DFT report
      const dftContent = await giyaPayService.generateDFTReport({
        take: parseInt(take as string) || 1000,
        skip: parseInt(skip as string) || 0,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        order: { createdAt: 'DESC' }
      })
      
      const filename = `giyapay_dft_report_${new Date().toISOString().split('T')[0]}.txt`
      
      res.set({
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      })
      
      console.log(`[Admin GiyaPay Download] ✅ Sending DFT report: ${filename}`)
      return res.send(dftContent)
    } else if (format === 'tama') {
      // Generate TAMA report
      const { fundingAccount } = req.query
      const tamaContent = await giyaPayService.generateTAMAReport({
        take: parseInt(take as string) || 1000,
        skip: parseInt(skip as string) || 0,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
        fundingAccount: fundingAccount as string,
        order: { createdAt: 'DESC' }
      })
      
      const date = new Date().toISOString().slice(2, 10).replace(/-/g, '') // YYMMDD format
      const filename = `TAMA - ${date}.txt`
      
      res.set({
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      })
      
      console.log(`[Admin GiyaPay Download] ✅ Sending TAMA report: ${filename}`)
      return res.send(tamaContent)
    } else {
      // Generate JSON report (default)
      const transactions = await giyaPayService.getTransactionsForAPI({
        take: parseInt(take as string) || 1000,
        skip: parseInt(skip as string) || 0,
        order: { createdAt: 'DESC' }
      })
      
      const filename = `giyapay_transactions_${new Date().toISOString().split('T')[0]}.json`
      
      res.set({
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      })
      
      console.log(`[Admin GiyaPay Download] ✅ Sending JSON report: ${filename}`)
      return res.json(transactions)
    }
    
  } catch (error) {
    console.error('[Admin GiyaPay Download] ❌ Error generating report:', error)
    return res.status(500).json({ 
      error: 'Failed to generate report',
      message: error.message 
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  return GET(req, res) // Support both GET and POST
}



























