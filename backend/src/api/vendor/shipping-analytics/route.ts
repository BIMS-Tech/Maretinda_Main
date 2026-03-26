import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

function getPgConnection(req: AuthenticatedMedusaRequest): any {
  try {
    return req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  } catch {
    return (req.scope as any).__pg_connection__ || (req.scope as any).pgConnection
  }
}

async function getSellerId(req: AuthenticatedMedusaRequest, pg: any): Promise<string | null> {
  const actorId = (req as any).auth_context?.actor_id
  if (!actorId) return null
  const member = await pg('member').where('id', actorId).first()
  return member?.seller_id ?? null
}

function getPeriodStart(period: string): Date {
  const now = new Date()
  const days: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }
  const d = days[period] ?? 30
  return new Date(now.getTime() - d * 24 * 60 * 60 * 1000)
}

/**
 * GET /vendor/shipping-analytics
 */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  try {
    const pg = getPgConnection(req)
    const sellerId = await getSellerId(req, pg)
    if (!sellerId) return res.status(403).json({ message: 'Seller not found' })

    const { period = '30d', provider_id } = req.query as { period?: string; provider_id?: string }
    const since = getPeriodStart(period)

    let query = pg('vendor_shipping_order')
      .where({ seller_id: sellerId })
      .whereNull('deleted_at')
      .where('created_at', '>=', since)

    if (provider_id) query = query.where({ provider: provider_id })

    const orders = await query.select('status', 'provider', 'amount', 'created_at')

    const total = orders.length
    const delivered = orders.filter((o: any) => o.status === 'delivered').length
    const failed = orders.filter((o: any) => ['failed', 'exception'].includes(o.status)).length
    const cancelled = orders.filter((o: any) => o.status === 'cancelled').length
    const totalCost = orders.reduce((s: number, o: any) => s + (parseFloat(o.amount) || 0), 0)

    // Provider breakdown
    const providerMap = new Map<string, { orders: number; cost: number; delivered: number }>()
    for (const o of orders) {
      const p = providerMap.get(o.provider) ?? { orders: 0, cost: 0, delivered: 0 }
      p.orders += 1
      p.cost += parseFloat(o.amount) || 0
      if (o.status === 'delivered') p.delivered += 1
      providerMap.set(o.provider, p)
    }

    const providerComparison = Array.from(providerMap.entries()).map(([pid, stats]) => ({
      providerId: pid,
      orders: stats.orders,
      cost: stats.cost,
      successRate: stats.orders > 0 ? Math.round((stats.delivered / stats.orders) * 100 * 10) / 10 : 0,
    }))

    res.json({
      period,
      analytics: {
        totalOrders: total,
        successfulDeliveries: delivered,
        failedDeliveries: failed,
        cancelledOrders: cancelled,
        successRate: total > 0 ? Math.round((delivered / total) * 100 * 10) / 10 : 0,
        totalCost,
        averageCostPerOrder: total > 0 ? Math.round((totalCost / total) * 100) / 100 : 0,
        averageDeliveryTime: null, // requires webhook-based timestamps
        onTimeDeliveryRate: null,
      },
      providerComparison: { providers: providerComparison },
      optimization: {
        tips: providerComparison.length > 1
          ? ['Compare provider success rates to choose the best option for your area']
          : ['Add more providers to compare rates and performance'],
        potentialSavings: 0,
      },
    })
  } catch (error) {
    console.error('[Shipping Analytics GET]', error)
    res.status(500).json({ message: 'Failed to fetch analytics' })
  }
}
