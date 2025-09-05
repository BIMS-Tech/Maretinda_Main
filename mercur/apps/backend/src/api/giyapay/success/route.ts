import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    console.log('[GiyaPay Success] Callback received')
    console.log('[GiyaPay Success] Query params:', req.query)
    console.log('[GiyaPay Success] Headers:', req.headers)

    const { order_id, reference, transaction_id, status, nonce, refno, timestamp, amount, signature } = req.query

    // Find the payment session and cart
    const orderId = order_id || reference || transaction_id
    if (!orderId) {
      console.error('[GiyaPay Success] No order ID found in callback')
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-error?error=No+order+ID`)
    }

    console.log('[GiyaPay Success] Processing order ID:', orderId)

    // Extract the base cart ID from the order ID
    // Handle URL-encoded comma (%2C) in order_id
    let cartId = orderId.toString().split('%2C')[0].split(',')[0]
    
    console.log('[GiyaPay Success] Extracted cart ID:', cartId)

    // If it's a session ID format, extract the cart ID
    if (cartId.startsWith('giyapay_session_')) {
      // For session IDs, we'll need to find the cart differently
      console.log('[GiyaPay Success] Order ID is a session ID, need to find cart')
      // For now, we'll try to extract from the session mapping
      // This would need to be implemented based on your session storage
    }

    try {
      console.log('[GiyaPay Success] Attempting to complete cart:', cartId)
      
      // Simple approach: redirect to frontend with order info
      // The frontend can handle the cart completion
      const frontendUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?` + 
        new URLSearchParams({
          cart_id: cartId,
          order_id: orderId.toString(),
          refno: refno?.toString() || '',
          status: 'success',
          nonce: nonce?.toString() || '',
          timestamp: timestamp?.toString() || '',
          amount: amount?.toString() || '',
          signature: signature?.toString() || ''
        }).toString()

      console.log('[GiyaPay Success] Redirecting to frontend:', frontendUrl)
      return res.redirect(frontendUrl)

    } catch (error) {
      console.error('[GiyaPay Success] Error processing payment:', error)
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-error?error=Payment+processing+failed`)
    }

  } catch (error) {
    console.error('[GiyaPay Success] Unexpected error:', error)
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-error?error=Unexpected+error`)
  }
}