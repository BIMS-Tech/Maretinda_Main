import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /admin/seller-overview
 *
 * Admin endpoint — returns all sellers with their subscription status
 * and the GiyaPay payment transaction that activated their account.
 *
 * Query params:
 *   status  - filter by subscription status (active | expired | cancelled)
 *   limit   - default 50
 *   offset  - default 0
 *
 * Sample response:
 * {
 *   "sellers": [
 *     {
 *       "seller_id": "seller_...",
 *       "seller_name": "My Store",
 *       "email": "seller@example.com",
 *       "subscription": {
 *         "id": "vsub_...",
 *         "plan_name": "Boost",
 *         "price": 2499,
 *         "status": "active",
 *         "start_date": "...",
 *         "end_date": "...",
 *         "days_remaining": 22
 *       },
 *       "payment": {
 *         "reference_number": "GIYAPAY-REF-123",
 *         "amount": 2499,
 *         "gateway": "GCASH",
 *         "status": "SUCCESS",
 *         "paid_at": "..."
 *       }
 *     }
 *   ],
 *   "count": 1,
 *   "limit": 50,
 *   "offset": 0
 * }
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void> {
  try {
    const { status, limit: limitQ, offset: offsetQ } = req.query as any
    const limit = limitQ ? parseInt(limitQ) : 50
    const offset = offsetQ ? parseInt(offsetQ) : 0

    let pgConnection: any
    try {
      pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    } catch {
      pgConnection = (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
    }

    // Base query: all sellers
    let subQuery = pgConnection("seller_subscription as vs")
      .select("vs.*")
      .orderBy("vs.created_at", "desc")

    if (status) subQuery = subQuery.where("vs.status", status)

    const subscriptions: any[] = await subQuery.limit(limit).offset(offset)
    const [{ count }] = await pgConnection("seller_subscription").count("id as count")

    const now = new Date()

    const sellers = await Promise.all(
      subscriptions.map(async (sub) => {
        // Seller info
        const seller = await pgConnection("seller").where("id", sub.seller_id).first()

        // Payment transaction that matches this subscription
        const payment = await pgConnection("giyapay_transaction")
          .where("seller_id", sub.seller_id)
          .where("reference_number", sub.payment_reference)
          .first()
          .catch(() => null)

        // Fallback: any vsub_ payment linked to this seller
        const fallbackPayment = !payment
          ? await pgConnection("giyapay_transaction")
              .where("seller_id", sub.seller_id)
              .whereLike("order_id", "vsub_%")
              .orderBy("created_at", "desc")
              .first()
              .catch(() => null)
          : null

        const txn = payment || fallbackPayment

        // Remaining time
        const endDate = new Date(sub.end_date)
        const diffMs = endDate.getTime() - now.getTime()
        const daysRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))

        return {
          seller_id: sub.seller_id,
          seller_name: seller?.name || null,
          seller_email: seller?.email || null,
          subscription: {
            id: sub.id,
            plan_name: sub.plan_name,
            price: sub.price,
            status: sub.status,
            start_date: sub.start_date,
            end_date: sub.end_date,
            auto_renew: sub.auto_renew,
            days_remaining: sub.status === "active" ? daysRemaining : 0,
            created_at: sub.created_at,
          },
          payment: txn
            ? {
                reference_number: txn.reference_number,
                amount: parseFloat(txn.amount),
                gateway: txn.gateway,
                status: txn.status,
                order_id: txn.order_id,
                paid_at: txn.created_at,
              }
            : null,
        }
      })
    )

    res.status(200).json({ sellers, count: Number(count), limit, offset })
  } catch (error) {
    console.error("[Admin sellerOverview] Error:", error)
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch seller overview" })
  }
}
