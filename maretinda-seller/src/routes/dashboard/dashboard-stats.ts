type OrderLike = { total?: number | null; status?: string | null; fulfillment_status?: string | null }

const CANCELLED = ["canceled", "cancelled"]

/**
 * Headline numbers for the dashboard. Store amounts are already in pesos
 * (major units), so totals are added as they are.
 */
export const orderStats = (orders: OrderLike[]) => {
  const live = orders.filter((o) => !CANCELLED.includes(o.status ?? ""))
  const revenue = live.reduce((sum, o) => sum + Number(o.total ?? 0), 0)
  return {
    revenue,
    averageOrder: live.length ? revenue / live.length : 0,
    orders: live.length,
    toFulfil: live.filter((o) => o.fulfillment_status === "not_fulfilled").length,
    toShip: live.filter((o) => o.fulfillment_status === "fulfilled").length,
  }
}

/** Whole days until the plan ends; null when there's no end date. */
export const daysLeft = (endDate: string | null | undefined, now = new Date()) => {
  if (!endDate) return null
  return Math.max(0, Math.ceil((new Date(endDate).getTime() - now.getTime()) / 86_400_000))
}
