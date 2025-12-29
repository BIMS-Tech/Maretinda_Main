import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import crypto from "crypto"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    console.log('[GiyaPay Success] Callback received')
    console.log('[GiyaPay Success] Query params:', req.query)
    
    const { nonce, order_id, refno, timestamp, amount, signature } = req.query as any
    
    if (!signature) {
      console.error('[GiyaPay Success] Missing signature')
      return res.status(400).json({ error: 'Missing signature' })
    }

    // Get GiyaPay service to verify signature and update transaction
    const container = req.scope
    let giyaPayService
    
    try {
      giyaPayService = container.resolve("giyaPayService")
    } catch (error) {
      console.error('[GiyaPay Success] GiyaPay service not available')
    }

    // Verify signature
    let isValidSignature = false
    if (giyaPayService) {
      const config = await giyaPayService.getConfig()
      if (config && config.merchantSecret) {
        // Reconstruct callback URL without signature for verification
        const callbackParams = { nonce, order_id, refno, timestamp, amount }
        const queryString = Object.keys(callbackParams)
          .filter(key => callbackParams[key] !== undefined)
          .map(key => `${key}=${callbackParams[key]}`)
          .join('&')
        
        const expectedSignature = crypto
          .createHash('sha512')
          .update(queryString + config.merchantSecret)
          .digest('hex')
        
        isValidSignature = signature === expectedSignature
      }
    }

    if (!isValidSignature) {
      console.error('[GiyaPay Success] Invalid signature')
      return res.status(400).json({ error: 'Invalid signature' })
    }

    // Update transaction status to success
    if (giyaPayService && nonce) {
      try {
        // Here you would update the transaction status
        // For now, we'll just log it
        console.log(`[GiyaPay Success] Payment successful for order: ${order_id}, ref: ${refno}`)
        
        // You might want to trigger order completion workflows here
        // const orderService = container.resolve("orderService")
        // await orderService.capturePayment(order_id)
        
      } catch (error) {
        console.error('[GiyaPay Success] Error updating transaction:', error)
      }
    }

    // Redirect to success page
    const frontendUrl = process.env.FRONTEND_URL || process.env.STORE_CORS || 'http://localhost:3000'
    const redirectUrl = `${frontendUrl}/payment-success?order_id=${order_id}&ref=${refno}`
    
    console.log('[GiyaPay Success] Redirecting to:', redirectUrl)
    return res.redirect(redirectUrl)
    
  } catch (error) {
    console.error('[GiyaPay Success] Unexpected error:', error)
    const frontendUrl = process.env.FRONTEND_URL || process.env.STORE_CORS || 'http://localhost:3000'
    return res.redirect(`${frontendUrl}/payment-error`)
  }
}









