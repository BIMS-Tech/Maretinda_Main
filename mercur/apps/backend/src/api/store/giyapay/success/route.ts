import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
// import { splitAndCompleteCartWorkflow } from '../../../../../workflows/cart/workflows'

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    console.log('[GiyaPay Success] Callback received')
    console.log('[GiyaPay Success] Query params:', req.query)
    console.log('[GiyaPay Success] Headers:', req.headers)

    const { order_id, reference, transaction_id, status } = req.query

    // Find the payment session and cart
    const orderId = order_id || reference || transaction_id
    if (!orderId) {
      console.error('[GiyaPay Success] No order ID found in callback')
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-error?error=No+order+ID`)
    }

    console.log('[GiyaPay Success] Processing order ID:', orderId)

    // Extract the base order/cart ID from the unique order ID
    // Your format: `${baseOrderId}_${customerId}_${timestamp}_${randomHex}`
    const orderIdParts = orderId.toString().split('_')
    let cartId = orderIdParts[0] // Base order ID is usually the cart ID

    // If it's a session ID, try to find the cart
    if (cartId.startsWith('giyapay_session_')) {
      console.log('[GiyaPay Success] Order ID is a session ID, need to find cart')
      
      try {
              // Get payment session service
      const container = req.scope
      const paymentSessionService = container.resolve('paymentSessionService') as any
        
        // Extract session ID from the order ID
        const sessionIdMatch = orderId.toString().match(/giyapay_session_\d+_[a-z0-9]+_[a-f0-9]+/)
        if (sessionIdMatch) {
          const sessionId = sessionIdMatch[0]
          console.log('[GiyaPay Success] Extracted session ID:', sessionId)
          
          const paymentSession = await paymentSessionService.retrieve(sessionId)
          console.log('[GiyaPay Success] Payment session:', paymentSession)
          
          if (paymentSession?.cart_id) {
            cartId = paymentSession.cart_id
            console.log('[GiyaPay Success] Found cart ID from session:', cartId)
          }
        }
      } catch (error) {
        console.error('[GiyaPay Success] Error finding cart from session:', error)
      }
    }

    console.log('[GiyaPay Success] Using cart ID:', cartId)

    // Authorize the payment session
    const container = req.scope
    
    try {
      // For GiyaPay callbacks, we need to manually complete the cart
      // since we don't have customer authentication
      
      // Try to complete the cart directly using the workflow
      console.log('[GiyaPay Success] Attempting cart completion via workflow...')
      
      // Use Medusa's built-in cart completion
      console.log('[GiyaPay Success] Attempting cart completion...')
      
      // Get cart service and complete the cart
      const cartService = container.resolve('cartService') as any
      
      try {
        const completedCart = await cartService.complete(cartId)
        console.log('[GiyaPay Success] Cart completion result:', completedCart)
        
        if (completedCart?.order_set?.orders?.[0]?.id) {
          const newOrderId = completedCart.order_set.orders[0].id
          console.log('[GiyaPay Success] Order created:', newOrderId)
          
          const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order/${newOrderId}/confirmed`
          console.log('[GiyaPay Success] Redirecting to:', redirectUrl)
          
          return res.redirect(redirectUrl)
        }
      } catch (completionError) {
        console.log('[GiyaPay Success] Cart completion failed, trying payment authorization first:', completionError.message)
      }
      
      // Fallback to service approach with payment authorization
      const cart = await cartService.retrieve(cartId)
      
      if (!cart) {
        console.error('[GiyaPay Success] Cart not found:', cartId)
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-error?error=Cart+not+found`)
      }

      console.log('[GiyaPay Success] Cart found:', cart.id)

      // Find GiyaPay payment session
      const giyaPaySession = cart.payment_collection?.payment_sessions?.find((session: any) => 
        session.provider_id === 'giyapay' || 
        session.provider_id === 'pp_giyapay_giyapay' ||
        session.provider_id === 'pp_giyapay'
      )

      if (!giyaPaySession) {
        console.error('[GiyaPay Success] No GiyaPay payment session found')
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-error?error=Payment+session+not+found`)
      }

      console.log('[GiyaPay Success] Found payment session:', giyaPaySession.id)

      // Authorize the payment
      const paymentService = container.resolve('paymentService') as any
      await paymentService.authorizePaymentSession(
        cart.payment_collection.id,
        giyaPaySession.id
      )

      console.log('[GiyaPay Success] Payment authorized')

      // Complete the cart
      const result = await cartService.complete(cartId)
      console.log('[GiyaPay Success] Cart completed:', result)

      if (result?.order_set?.orders?.[0]?.id) {
        const newOrderId = result.order_set.orders[0].id
        console.log('[GiyaPay Success] Order created:', newOrderId)
        
        // Redirect to order confirmation page
        const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order/${newOrderId}/confirmed`
        console.log('[GiyaPay Success] Redirecting to:', redirectUrl)
        
        return res.redirect(redirectUrl)
      } else {
        console.error('[GiyaPay Success] No order created from cart completion')
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-error?error=Order+creation+failed`)
      }

    } catch (error) {
      console.error('[GiyaPay Success] Error processing payment:', error)
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-error?error=Payment+processing+failed`)
    }

  } catch (error) {
    console.error('[GiyaPay Success] Unexpected error:', error)
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-error?error=Unexpected+error`)
  }
}