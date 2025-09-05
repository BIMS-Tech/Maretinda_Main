import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    console.log('[GiyaPay Error] Callback received')
    console.log('[GiyaPay Error] Query params:', req.query)

    const { error, order_id, reference } = req.query
    const errorMessage = error || 'Payment failed'
    const orderId = order_id || reference

    console.log('[GiyaPay Error] Payment failed for order:', orderId)
    console.log('[GiyaPay Error] Error message:', errorMessage)

    // Redirect to frontend error page
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-error?error=${encodeURIComponent(errorMessage.toString())}`
    console.log('[GiyaPay Error] Redirecting to:', redirectUrl)
    
    return res.redirect(redirectUrl)

  } catch (error) {
    console.error('[GiyaPay Error] Unexpected error:', error)
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-error?error=Unexpected+error`)
  }
}