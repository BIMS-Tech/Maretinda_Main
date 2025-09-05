import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    console.log('[GiyaPay Cancel] Callback received')
    console.log('[GiyaPay Cancel] Query params:', req.query)

    const { order_id, reference } = req.query
    const orderId = order_id || reference

    console.log('[GiyaPay Cancel] Payment cancelled for order:', orderId)

    // Redirect to frontend cancel page
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-cancel?cancelled=true`
    console.log('[GiyaPay Cancel] Redirecting to:', redirectUrl)
    
    return res.redirect(redirectUrl)

  } catch (error) {
    console.error('[GiyaPay Cancel] Unexpected error:', error)
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-error?error=Unexpected+error`)
  }
}