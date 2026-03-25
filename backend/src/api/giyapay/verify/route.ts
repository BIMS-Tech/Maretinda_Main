import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import crypto from "crypto"
import GiyaPayService from "../../../services/giyapay"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    console.log('[GiyaPay Verify] Verification request received')

    const { nonce, order_id, refno, timestamp, amount, signature, payment_method } = req.body as any

    if (!signature || !nonce || !refno || !order_id) {
      console.error('[GiyaPay Verify] Missing required parameters')
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
      })
    }

    const container = req.scope
    let giyaPayService: any

    try {
      giyaPayService = container.resolve("giyaPayService") as any
    } catch {
      giyaPayService = new GiyaPayService(container)
    }

    const config = await giyaPayService?.getConfig()

    if (!config || !config.merchantSecret) {
      console.error('[GiyaPay Verify] Merchant secret not configured')
      return res.status(500).json({
        success: false,
        message: 'Payment gateway not properly configured',
      })
    }

    // Verify the callback signature using the GiyaPay Gateway Direct algorithm.
    //
    // GiyaPay docs: take the full success callback URL (everything before "&signature="),
    // append the merchant secret, then SHA512 hash it.
    //
    // Example (from docs):
    //   toBeHashed = successCallback.split("&signature=")[0]  // URL + params without signature
    //   expectedSig = sha512(toBeHashed + merchantSecret)
    //
    // GiyaPay appends params in this fixed order:
    //   ?nonce=X&order_id=Y&refno=Z&timestamp=A&amount=B&signature=S
    //
    // We reconstruct the URL-without-signature part from the individual params we received.
    const storefrontUrl = (process.env.STOREFRONT_URL || process.env.STORE_CORS?.split(",")[0] || "http://localhost:3000").replace(/\/$/, "")
    const callbackUrl = `${storefrontUrl}/giyapay/success`
    const urlWithoutSignature = `${callbackUrl}?nonce=${nonce}&order_id=${order_id}&refno=${refno}&timestamp=${timestamp}&amount=${amount}`

    const expectedSignature = crypto
      .createHash('sha512')
      .update(urlWithoutSignature + config.merchantSecret)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.error('[GiyaPay Verify] Signature mismatch for order:', order_id)
      console.error('[GiyaPay Verify] Expected:', expectedSignature.substring(0, 16) + '...')
      console.error('[GiyaPay Verify] Received:', String(signature).substring(0, 16) + '...')
      return res.status(400).json({
        success: false,
        message: 'Invalid signature',
      })
    }

    console.log('[GiyaPay Verify] Signature verified for order:', order_id, '| ref:', refno)

    // Record the transaction
    try {
      const amountInPesos = amount ? Number(amount) / 100 : 0
      await giyaPayService.createTransaction({
        referenceNumber: refno,
        orderId: order_id,
        cartId: order_id,
        amount: amountInPesos,
        currency: 'PHP',
        status: 'SUCCESS',
        gateway: payment_method || 'GIYAPAY',
        description: `Payment for order ${order_id}`,
        paymentData: { nonce, timestamp, signature, payment_method },
      })
      console.log('[GiyaPay Verify] Transaction saved for reference:', refno)
    } catch (txnError) {
      console.error('[GiyaPay Verify] Failed to save transaction (non-fatal):', txnError)
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      order_id,
      refno,
    })

  } catch (error) {
    console.error('[GiyaPay Verify] Unexpected error:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}
