import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * POST /giyapay/update-transaction
 *
 * Called by the storefront after checkout to record which order a verified
 * payment produced. This route is public, so it can only do that one thing:
 *
 *   - it never changes a transaction's status — only /giyapay/verify, which
 *     checks GiyaPay's signature, creates SUCCESS transactions;
 *   - it never moves a payment to another cart;
 *   - it only accepts an order that really was created from the payment's cart.
 *
 * Anything else here would let an anonymous caller turn a failed payment into a
 * paid one, or forge the vrenew_/vsub_ order ids that subscriptions trust.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { reference_number, order_id, cart_id } = req.body as any

    if (typeof reference_number !== "string" || !reference_number) {
      return res.status(400).json({ success: false, message: "Missing reference_number" })
    }
    if ((order_id !== undefined && typeof order_id !== "string") || (cart_id !== undefined && typeof cart_id !== "string")) {
      return res.status(400).json({ success: false, message: "Invalid order_id or cart_id" })
    }

    const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const txn = await db("giyapay_transaction").where("reference_number", reference_number).first()

    if (!txn) {
      return res.status(404).json({ success: false, message: "Transaction not found" })
    }
    if (txn.status !== "SUCCESS") {
      return res.status(409).json({ success: false, message: "Transaction was not successful" })
    }
    if (cart_id && txn.cart_id && cart_id !== txn.cart_id) {
      return res.status(409).json({ success: false, message: "Transaction belongs to another cart" })
    }
    if (!order_id) {
      return res.status(200).json({ success: true, message: "Nothing to update" })
    }

    const isSameOrder = txn.order_id === order_id
    const alreadyLinked = /^(order_|ordset_)/.test(txn.order_id ?? "")
    if (alreadyLinked && !isSameOrder) {
      return res.status(409).json({ success: false, message: "Transaction is already linked to an order" })
    }
    if (!isSameOrder && !(await orderCameFromCart(db, order_id, txn.cart_id))) {
      return res.status(400).json({ success: false, message: "Order does not match this payment" })
    }

    const seller = await sellerOfCart(db, txn.cart_id)
    await db("giyapay_transaction")
      .where("reference_number", reference_number)
      .update({
        order_id,
        ...(seller ? { seller_id: seller } : {}),
        updated_at: new Date(),
      })

    return res.status(200).json({ success: true, message: "Transaction updated successfully" })
  } catch (error) {
    console.error("[GiyaPay Update Transaction] Unexpected error:", error)
    return res.status(500).json({ success: false, message: "Internal server error" })
  }
}

async function orderCameFromCart(db: any, orderId: string, cartId?: string | null): Promise<boolean> {
  if (!cartId) return false
  const orderSet = await db("order_set").where({ id: orderId, cart_id: cartId }).first().catch(() => null)
  if (orderSet) return true
  const order = await db("order_cart").where({ order_id: orderId, cart_id: cartId }).first().catch(() => null)
  return Boolean(order)
}

async function sellerOfCart(db: any, cartId?: string | null): Promise<string | null> {
  if (!cartId) return null
  const result = await db.raw(
    `SELECT ssp.seller_id
       FROM cart_line_item cli
       JOIN seller_seller_product_product ssp ON ssp.product_id = cli.product_id
      WHERE cli.cart_id = ?
      LIMIT 1`,
    [cartId]
  )
  return result.rows?.[0]?.seller_id ?? null
}
