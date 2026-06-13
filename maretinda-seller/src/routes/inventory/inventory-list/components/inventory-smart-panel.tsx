import { Container, Heading, Text, Badge } from "@medusajs/ui"
import { Link } from "react-router-dom"
import { useInventoryItems } from "../../../../hooks/api/inventory"
import { useOrders } from "../../../../hooks/api"
import { usePlanLimits } from "../../../../hooks/api/plan-limits"
import { FeatureGate } from "../../../../components/common/feature-gate"
import { subDays, format } from "date-fns"

const LOW_STOCK_THRESHOLD = 5
const FORECAST_DAYS = 14

type InventoryItemWithLevels = {
  id: string
  title?: string | null
  sku?: string | null
  stocked_quantity?: number | null
  location_levels?: { stocked_quantity: number }[]
}

const getTotalStock = (item: InventoryItemWithLevels): number => {
  if (item.stocked_quantity != null) return item.stocked_quantity
  return (
    item.location_levels?.reduce((s, l) => s + (l.stocked_quantity ?? 0), 0) ??
    0
  )
}

export const InventorySmartPanel = () => {
  const { inventoryLevel } = usePlanLimits()

  if (inventoryLevel === "standard") {
    return (
      <FeatureGate
        requiredPlans={["Boost", "Managed"]}
        featureName="Smart Inventory"
        description="Smart inventory alerts notify you when stock is running low so you can restock before selling out."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <LowStockAlerts />
      {inventoryLevel === "advanced" && <DemandForecast />}
    </div>
  )
}

const LowStockAlerts = () => {
  const { inventory_items, isPending } = useInventoryItems({
    limit: 200,
    fields: "id,title,sku,*location_levels",
  }) as { inventory_items: InventoryItemWithLevels[] | undefined; isPending: boolean }

  const lowStock = (inventory_items ?? []).filter(
    (item) => getTotalStock(item) <= LOW_STOCK_THRESHOLD
  )

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2" className="text-base font-semibold">
            Low Stock Alerts
          </Heading>
          <Text size="small" className="text-ui-fg-muted">
            Items with {LOW_STOCK_THRESHOLD} or fewer units remaining
          </Text>
        </div>
        {!isPending && lowStock.length > 0 && (
          <Badge color="red">{lowStock.length} items</Badge>
        )}
      </div>

      {isPending ? (
        <div className="px-6 py-6 text-center text-ui-fg-muted text-sm">
          Checking stock levels…
        </div>
      ) : lowStock.length === 0 ? (
        <div className="px-6 py-5 flex items-center gap-3">
          <span className="text-xl">✅</span>
          <Text size="small" className="text-ui-fg-subtle">
            All inventory levels look healthy.
          </Text>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ui-border-base bg-ui-bg-subtle">
                <th className="px-5 py-3 text-left text-xs font-medium text-ui-fg-muted">
                  Item
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-ui-fg-muted">
                  SKU
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-ui-fg-muted">
                  Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-ui-fg-muted">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((item) => {
                const stock = getTotalStock(item)
                return (
                  <tr
                    key={item.id}
                    className="border-b border-ui-border-base last:border-0 hover:bg-ui-bg-subtle transition-colors"
                  >
                    <td className="px-5 py-3">
                      <Link
                        to={`/inventory/${item.id}`}
                        className="text-xs font-medium text-ui-fg-base hover:text-blue-600 hover:underline"
                      >
                        {item.title ?? "Unnamed item"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ui-fg-muted">
                      {item.sku ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`text-xs font-bold ${
                          stock === 0 ? "text-red-600" : "text-amber-600"
                        }`}
                      >
                        {stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          stock === 0
                            ? "bg-red-500/10 text-red-600"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {stock === 0 ? "Out of stock" : "Low stock"}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  )
}

const DemandForecast = () => {
  const { inventory_items, isPending: invPending } = useInventoryItems({
    limit: 200,
    fields: "id,title,sku,*location_levels",
  }) as { inventory_items: InventoryItemWithLevels[] | undefined; isPending: boolean }

  const { orders, isPending: ordersPending } = useOrders()

  const isPending = invPending || ordersPending

  const cutoff = subDays(new Date(), 30)
  const recentOrders = (orders ?? []).filter(
    (o) => o.created_at && new Date(o.created_at) >= cutoff
  )

  const skuVelocity: Record<string, number> = {}
  for (const order of recentOrders) {
    for (const item of order.items ?? []) {
      const sku = (item.variant as any)?.sku as string | undefined
      if (sku) skuVelocity[sku] = (skuVelocity[sku] ?? 0) + (item.quantity ?? 1)
    }
  }

  const forecasted = (inventory_items ?? [])
    .map((item) => {
      const stock = getTotalStock(item)
      const sku = item.sku ?? ""
      const unitsSold30Days = skuVelocity[sku] ?? 0
      const dailyRate = unitsSold30Days / 30
      const daysUntilStockout =
        dailyRate > 0 ? Math.floor(stock / dailyRate) : Infinity
      return { item, stock, unitsSold30Days, dailyRate, daysUntilStockout }
    })
    .filter((f) => f.daysUntilStockout <= FORECAST_DAYS && f.unitsSold30Days > 0)
    .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout)

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2" className="text-base font-semibold">
            Demand Forecast
          </Heading>
          <Text size="small" className="text-ui-fg-muted">
            Items likely to stock out within {FORECAST_DAYS} days based on recent sales
          </Text>
        </div>
        {!isPending && forecasted.length > 0 && (
          <Badge color="orange">{forecasted.length} at risk</Badge>
        )}
      </div>

      {isPending ? (
        <div className="px-6 py-6 text-center text-ui-fg-muted text-sm">
          Calculating forecast…
        </div>
      ) : forecasted.length === 0 ? (
        <div className="px-6 py-5 flex items-center gap-3">
          <span className="text-xl">📦</span>
          <Text size="small" className="text-ui-fg-subtle">
            No stockouts predicted in the next {FORECAST_DAYS} days.
          </Text>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ui-border-base bg-ui-bg-subtle">
                <th className="px-5 py-3 text-left text-xs font-medium text-ui-fg-muted">Item</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-ui-fg-muted">Stock</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-ui-fg-muted">Sold (30d)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-ui-fg-muted">Est. Stockout</th>
              </tr>
            </thead>
            <tbody>
              {forecasted.map(({ item, stock, unitsSold30Days, daysUntilStockout }) => {
                const stockoutDate = format(
                  new Date(Date.now() + daysUntilStockout * 86400000),
                  "MMM d"
                )
                return (
                  <tr
                    key={item.id}
                    className="border-b border-ui-border-base last:border-0 hover:bg-ui-bg-subtle"
                  >
                    <td className="px-5 py-3">
                      <Link
                        to={`/inventory/${item.id}`}
                        className="text-xs font-medium text-ui-fg-base hover:text-blue-600 hover:underline"
                      >
                        {item.title ?? "Unnamed item"}
                      </Link>
                      {item.sku && (
                        <p className="text-xs text-ui-fg-muted font-mono">{item.sku}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-ui-fg-base">
                      {stock}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-ui-fg-subtle">
                      {unitsSold30Days}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        daysUntilStockout <= 3
                          ? "bg-red-500/10 text-red-600"
                          : daysUntilStockout <= 7
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-orange-500/10 text-orange-600"
                      }`}>
                        ~{stockoutDate} ({daysUntilStockout}d)
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  )
}
