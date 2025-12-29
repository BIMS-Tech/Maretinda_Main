import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    console.log('[GiyaPay Error] Callback received')
    console.log('[GiyaPay Error] Query params:', req.query)
    
    const { order_id, nonce } = req.query as any
    
    // Get GiyaPay service to update transaction status
    const container = req.scope
    let giyaPayService
    
    try {
      giyaPayService = container.resolve("giyaPayService")
    } catch (error) {
      console.error('[GiyaPay Error] GiyaPay service not available')
    }

    // Update transaction status to failed
    if (giyaPayService && nonce) {
      try {
        console.log(`[GiyaPay Error] Payment failed for order: ${order_id}`)
        
        // Here you would update the transaction status to failed
        // You might also want to update the order status
        
      } catch (error) {
        console.error('[GiyaPay Error] Error updating transaction:', error)
      }
    }

    // Redirect to error page
    const frontendUrl = process.env.FRONTEND_URL || process.env.STORE_CORS || 'http://localhost:3000'
    const redirectUrl = `${frontendUrl}/payment-error?order_id=${order_id}`
    
    console.log('[GiyaPay Error] Redirecting to:', redirectUrl)
    return res.redirect(redirectUrl)
    
  } catch (error) {
    console.error('[GiyaPay Error] Unexpected error:', error)
    const frontendUrl = process.env.FRONTEND_URL || process.env.STORE_CORS || 'http://localhost:3000'
    return res.redirect(`${frontendUrl}/payment-error`)
  }
}









