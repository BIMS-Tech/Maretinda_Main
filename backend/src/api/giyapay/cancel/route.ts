import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    console.log('[GiyaPay Cancel] Callback received')
    console.log('[GiyaPay Cancel] Query params:', req.query)
    
    const { order_id, nonce } = req.query as any
    
    // Get GiyaPay service to update transaction status
    const container = req.scope
    let giyaPayService
    
    try {
      giyaPayService = container.resolve("giyaPayService")
    } catch (error) {
      console.error('[GiyaPay Cancel] GiyaPay service not available')
    }

    // Update transaction status to cancelled
    if (giyaPayService && nonce) {
      try {
        console.log(`[GiyaPay Cancel] Payment cancelled for order: ${order_id}`)
        
        // Here you would update the transaction status to cancelled
        
      } catch (error) {
        console.error('[GiyaPay Cancel] Error updating transaction:', error)
      }
    }

    // Redirect to checkout or cart page
    const frontendUrl = process.env.FRONTEND_URL || process.env.STORE_CORS || 'http://localhost:3000'
    const redirectUrl = `${frontendUrl}/checkout?cancelled=true`
    
    console.log('[GiyaPay Cancel] Redirecting to:', redirectUrl)
    return res.redirect(redirectUrl)
    
  } catch (error) {
    console.error('[GiyaPay Cancel] Unexpected error:', error)
    const frontendUrl = process.env.FRONTEND_URL || process.env.STORE_CORS || 'http://localhost:3000'
    return res.redirect(`${frontendUrl}/checkout`)
  }
}









