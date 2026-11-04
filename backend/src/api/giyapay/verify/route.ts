import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import GiyaPayService from "../../../services/giyapay"
import { giyapayCallbackSignature, giyapaySignaturesMatch } from "../../../lib/giyapay-signature"

/**
 * Resolve the owning seller for a GiyaPay transaction from its cart (preferred)
 * or order, mirroring the lookup in /giyapay/update-transaction. Returns null
 * when it cannot be determined (e.g. subscription payments) so the transaction
 * can still be recorded — update-transaction remains a fallback.
 */
async function resolveSeller(
  scope: any,
  cartId?: string,
  orderId?: string
): Promise<{ sellerId: string; sellerName: string } | null> {
  try {
    const db = scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

    let resolvedCartId = cartId
    if (!resolvedCartId && orderId) {
      const orderCart = await db.raw(
        `SELECT cart_id FROM order_cart WHERE order_id = ? LIMIT 1`,
        [orderId]
      )
      resolvedCartId = (orderCart?.rows || orderCart || [])[0]?.cart_id
    }
    if (!resolvedCartId) return null

    const result = await db.raw(
      `SELECT DISTINCT s.id AS seller_id, s.name AS seller_name
         FROM cart_line_item cli
         JOIN seller_seller_product_product ssp ON ssp.product_id = cli.product_id
         JOIN seller s ON s.id = ssp.seller_id
        WHERE cli.cart_id = ?
        LIMIT 1`,
      [resolvedCartId]
    )
    const row = (result?.rows || result || [])[0]
    return row?.seller_id ? { sellerId: row.seller_id, sellerName: row.seller_name } : null
  } catch (e) {
    console.warn('[GiyaPay Verify] Could not resolve seller for transaction:', e)
    return null
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    console.log('[GiyaPay Verify] Verification request received')

    const { nonce, order_id, refno, timestamp, amount, signature, payment_method, cart_id } = req.body as any

    const isText = (v: unknown) => typeof v === 'string' && v.length > 0 && v.length <= 512
    if (![signature, nonce, refno, order_id].every(isText)) {
      console.error('[GiyaPay Verify] Missing required parameters')
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
      })
    }

    if (cart_id !== undefined && typeof cart_id !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid cart_id' })
    }
    if (!/^\d+(\.\d+)?$/.test(String(amount)) || !isText(String(timestamp))) {
      return res.status(400).json({ success: false, message: 'Invalid amount or timestamp' })
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

    // For subscription renewal payments (vrenew_ prefix), try subscription-specific
    // GiyaPay config first; fall back to main config if not set.
    let merchantSecret = config.merchantSecret
    const isSubscriptionPayment = String(order_id).startsWith("vrenew_") || String(order_id).startsWith("vsub_")
    if (isSubscriptionPayment) {
      try {
        const db = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
        const subConfig = await db("giyapay_subscription_config")
          .where("is_enabled", true)
          .select("merchant_secret")
          .first()
        if (subConfig?.merchant_secret) {
          merchantSecret = subConfig.merchant_secret
          console.log('[GiyaPay Verify] Using subscription-specific merchant secret for order:', order_id)
        }
      } catch {
        // table may not exist yet — fall back to main config
      }
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

    const expectedSignature = giyapayCallbackSignature(
      callbackUrl,
      { nonce, order_id, refno, timestamp, amount },
      merchantSecret
    )

    if (!giyapaySignaturesMatch(signature, expectedSignature)) {
      console.error('[GiyaPay Verify] Signature mismatch for order:', order_id)
      return res.status(400).json({
        success: false,
        message: 'Invalid signature',
      })
    }

    console.log('[GiyaPay Verify] Signature verified for order:', order_id, '| ref:', refno)

    const amountInPesos = Number(amount) / 100

    // Guard against a missing id arriving as the literal string "undefined"
    // (truthy, so it would otherwise be stored and render as the word
    // "undefined" — and poison cart_id, breaking seller attribution).
    const isBogus = (v: any) => {
      const s = String(v ?? "").trim().toLowerCase()
      return !s || s === "undefined" || s === "null"
    }
    const cleanOrderId = isBogus(order_id) ? null : order_id
    const cleanCartId = isBogus(cart_id) ? cleanOrderId : cart_id

    // A payment pays for one cart, ever. The signature doesn't cover cart_id, so
    // the first verified callback fixes the binding and replays can't move it.
    const db = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const existing = await db('giyapay_transaction').where('reference_number', refno).first().catch(() => null)
    if (existing) {
      if (cleanCartId && existing.cart_id && existing.cart_id !== cleanCartId) {
        console.error('[GiyaPay Verify] Refused to reuse payment', refno, 'for a second cart')
        return res.status(409).json({ success: false, message: 'This payment was already used for another order' })
      }
      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        order_id,
        refno,
      })
    }

    // Attribute the transaction to its seller at creation time so it shows up
    // in the seller panel even if the follow-up update-transaction call never
    // fires. Skipped for subscription payments (vrenew_/vsub_), which aren't
    // seller-order transactions.
    const seller = isSubscriptionPayment
      ? null
      : await resolveSeller(container, cleanCartId || undefined, cleanOrderId || undefined)

    // Fatal: checkout only proceeds on this record, so a paid-but-unrecorded
    // payment must surface as an error with its reference, not as success.
    await giyaPayService.createTransaction({
      referenceNumber: refno,
      orderId: cleanOrderId || undefined,
      cartId: cleanCartId || undefined,
      sellerId: seller?.sellerId,
      amount: amountInPesos,
      currency: 'PHP',
      status: 'SUCCESS',
      gateway: payment_method || 'GIYAPAY',
      description: cleanOrderId ? `Payment for order ${cleanOrderId}` : 'GiyaPay payment',
      paymentData: { nonce, timestamp, signature, payment_method },
    })
    console.log('[GiyaPay Verify] Transaction saved for reference:', refno, seller ? `(seller ${seller.sellerId})` : '(no seller resolved)')

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
