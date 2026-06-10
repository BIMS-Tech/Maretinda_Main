import { Container, Heading, Text, Select } from "@medusajs/ui"
import { ChartPie, TriangleRightMini } from "@medusajs/icons"
import { useState } from "react"
import { useShippingAnalytics } from "../../../hooks/api/shipping"

const PERIOD_LABELS: Record<string, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "1y": "Last year",
}

const PROVIDER_NAMES: Record<string, string> = {
  ninjavan: "Ninja Van",
  jnt: "J&T Express",
  lalamove: "Lalamove",
}

export const ShippingAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("30d")

  const { data: analytics, isLoading, isError } = useShippingAnalytics(selectedPeriod)

  if (isLoading) {
    return (
      <Container className="p-6">
        <div className="flex items-center gap-3">
          <ChartPie className="h-5 w-5 text-ui-fg-subtle" />
          <Heading level="h2">Shipping Analytics</Heading>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border bg-ui-bg-subtle animate-pulse h-24" />
          ))}
        </div>
      </Container>
    )
  }

  if (isError || !analytics) {
    return (
      <Container className="p-6">
        <Text className="text-ui-fg-error">Failed to load shipping analytics</Text>
      </Container>
    )
  }

  const {
    totalOrders,
    successfulDeliveries,
    failedDeliveries,
    cancelledOrders,
    successRate,
    totalCost,
    averageCostPerOrder,
  } = analytics.analytics

  const inTransitOrders = Math.max(
    0,
    totalOrders - successfulDeliveries - failedDeliveries - cancelledOrders
  )

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount)

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return "text-ui-tag-green-text bg-ui-tag-green-bg"
    if (rate >= 80) return "text-ui-tag-orange-text bg-ui-tag-orange-bg"
    return "text-ui-tag-red-text bg-ui-tag-red-bg"
  }

  const getProviderRateColor = (rate: number) => {
    if (rate >= 95) return "text-ui-tag-green-text"
    if (rate >= 80) return "text-ui-tag-orange-text"
    return "text-ui-tag-red-text"
  }

  const hasOrders = totalOrders > 0
  const hasProviders = analytics.providerComparison.providers.length > 0

  return (
    <Container className="p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <ChartPie className="h-5 w-5 text-ui-fg-subtle" />
          <div>
            <Heading level="h2">Shipping Analytics</Heading>
            <Text className="text-xs text-ui-fg-muted mt-0.5">{PERIOD_LABELS[selectedPeriod]}</Text>
          </div>
        </div>

        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <Select.Trigger className="w-36">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="7d">Last 7 days</Select.Item>
            <Select.Item value="30d">Last 30 days</Select.Item>
            <Select.Item value="90d">Last 90 days</Select.Item>
            <Select.Item value="1y">Last year</Select.Item>
          </Select.Content>
        </Select>
      </div>

      <div className="border-t border-ui-border-base px-6 pb-6 pt-5 flex flex-col gap-6">

        {/* Empty state */}
        {!hasOrders && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <ChartPie className="h-10 w-10 text-ui-fg-muted" />
            <Text className="font-medium text-ui-fg-base">No shipping data yet</Text>
            <Text className="text-sm text-ui-fg-muted max-w-xs">
              Create your first shipment to start seeing analytics for the {PERIOD_LABELS[selectedPeriod].toLowerCase()} period.
            </Text>
          </div>
        )}

        {/* Metric cards — only when there are orders */}
        {hasOrders && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Orders */}
            <div className="p-4 rounded-lg border border-ui-border-base bg-ui-bg-base flex flex-col gap-1">
              <Text className="text-xs font-medium text-ui-fg-subtle uppercase tracking-wide">Total Orders</Text>
              <Text className="text-2xl font-bold text-ui-fg-base">{totalOrders}</Text>
              <Text className="text-xs text-ui-fg-muted">
                {inTransitOrders > 0 ? `${inTransitOrders} in transit` : "All resolved"}
              </Text>
            </div>

            {/* Delivered */}
            <div className="p-4 rounded-lg border border-ui-border-base bg-ui-bg-base flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <Text className="text-xs font-medium text-ui-fg-subtle uppercase tracking-wide">Delivered</Text>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getSuccessRateColor(successRate)}`}>
                  {successRate}%
                </span>
              </div>
              <Text className="text-2xl font-bold text-ui-fg-base">{successfulDeliveries}</Text>
              <Text className="text-xs text-ui-fg-muted">of {totalOrders} orders</Text>
            </div>

            {/* Failed / Cancelled */}
            <div className="p-4 rounded-lg border border-ui-border-base bg-ui-bg-base flex flex-col gap-1">
              <Text className="text-xs font-medium text-ui-fg-subtle uppercase tracking-wide">Issues</Text>
              <Text className="text-2xl font-bold text-ui-fg-base">{failedDeliveries + cancelledOrders}</Text>
              <Text className="text-xs text-ui-fg-muted">
                {failedDeliveries} failed · {cancelledOrders} cancelled
              </Text>
            </div>

            {/* Cost */}
            <div className="p-4 rounded-lg border border-ui-border-base bg-ui-bg-base flex flex-col gap-1">
              <Text className="text-xs font-medium text-ui-fg-subtle uppercase tracking-wide">Shipping Cost</Text>
              <Text className="text-2xl font-bold text-ui-fg-base">{formatCurrency(totalCost)}</Text>
              <Text className="text-xs text-ui-fg-muted">
                avg {formatCurrency(averageCostPerOrder)} / order
              </Text>
            </div>
          </div>
        )}

        {/* Status breakdown bar — only when there are orders */}
        {hasOrders && (
          <div>
            <Text className="text-sm font-medium text-ui-fg-base mb-2">Order Status Breakdown</Text>
            <div className="flex rounded-full overflow-hidden h-3 gap-px bg-ui-bg-subtle">
              {successfulDeliveries > 0 && (
                <div
                  className="bg-ui-tag-green-bg h-full"
                  style={{ width: `${(successfulDeliveries / totalOrders) * 100}%` }}
                  title={`Delivered: ${successfulDeliveries}`}
                />
              )}
              {inTransitOrders > 0 && (
                <div
                  className="bg-ui-tag-blue-bg h-full"
                  style={{ width: `${(inTransitOrders / totalOrders) * 100}%` }}
                  title={`In transit: ${inTransitOrders}`}
                />
              )}
              {failedDeliveries > 0 && (
                <div
                  className="bg-ui-tag-red-bg h-full"
                  style={{ width: `${(failedDeliveries / totalOrders) * 100}%` }}
                  title={`Failed: ${failedDeliveries}`}
                />
              )}
              {cancelledOrders > 0 && (
                <div
                  className="bg-ui-tag-orange-bg h-full"
                  style={{ width: `${(cancelledOrders / totalOrders) * 100}%` }}
                  title={`Cancelled: ${cancelledOrders}`}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-xs text-ui-fg-muted">
                <span className="w-2 h-2 rounded-full bg-ui-tag-green-bg border border-ui-tag-green-border" />
                Delivered ({successfulDeliveries})
              </span>
              {inTransitOrders > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-ui-fg-muted">
                  <span className="w-2 h-2 rounded-full bg-ui-tag-blue-bg border border-ui-tag-blue-border" />
                  In transit ({inTransitOrders})
                </span>
              )}
              {failedDeliveries > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-ui-fg-muted">
                  <span className="w-2 h-2 rounded-full bg-ui-tag-red-bg border border-ui-tag-red-border" />
                  Failed ({failedDeliveries})
                </span>
              )}
              {cancelledOrders > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-ui-fg-muted">
                  <span className="w-2 h-2 rounded-full bg-ui-tag-orange-bg border border-ui-tag-orange-border" />
                  Cancelled ({cancelledOrders})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Provider comparison */}
        <div>
          <Heading level="h3" className="mb-3">Provider Performance</Heading>
          {!hasProviders ? (
            <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-5 text-center">
              <Text className="text-sm text-ui-fg-muted">No provider data for this period</Text>
            </div>
          ) : (
            <div className="space-y-2">
              {analytics.providerComparison.providers.map((provider: any) => (
                <div
                  key={provider.providerId}
                  className="flex items-center justify-between p-3 rounded-lg border border-ui-border-base bg-ui-bg-base"
                >
                  <div>
                    <Text className="font-medium text-ui-fg-base text-sm">
                      {PROVIDER_NAMES[provider.providerId] ?? provider.providerId}
                    </Text>
                    <Text className="text-xs text-ui-fg-muted">{provider.orders} orders</Text>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <Text className="text-sm font-medium text-ui-fg-base">{formatCurrency(provider.cost)}</Text>
                      <Text className="text-xs text-ui-fg-muted">Total cost</Text>
                    </div>
                    <div className="text-right min-w-[60px]">
                      <Text className={`text-sm font-semibold ${getProviderRateColor(provider.successRate)}`}>
                        {provider.successRate}%
                      </Text>
                      <Text className="text-xs text-ui-fg-muted">Success</Text>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Optimization tips */}
        {analytics.optimization.tips.length > 0 && (
          <div>
            <Heading level="h3" className="mb-3">Tips</Heading>
            <div className="p-4 rounded-lg border border-ui-tag-blue-border bg-ui-tag-blue-bg">
              <div className="flex items-start gap-3">
                <TriangleRightMini className="h-4 w-4 text-ui-tag-blue-text flex-shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  {analytics.optimization.tips.map((tip: string, index: number) => (
                    <Text key={index} className="text-sm text-ui-fg-subtle">
                      {tip}
                    </Text>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}
