import { Container, Heading, Text, Button, Select, Badge } from "@medusajs/ui"
import { ChartPie, ArrowUpRightOnBox, CalendarMini, TriangleRightMini } from "@medusajs/icons"
import { useState } from "react"
import { useShippingAnalytics, useExportAnalytics } from "../../../hooks/api/shipping"

export const ShippingAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("30d")
  const [selectedProvider, setSelectedProvider] = useState<string>("")
  
  const { data: analytics, isLoading, isError } = useShippingAnalytics(selectedPeriod, selectedProvider)
  const { mutateAsync: exportAnalytics, isPending: isExporting } = useExportAnalytics()

  if (isLoading) {
    return (
      <Container className="p-6">
        <Text>Loading shipping analytics...</Text>
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

  const handleExport = async (format: string) => {
    try {
      await exportAnalytics({
        action: 'export-analytics',
        format,
        filters: { period: selectedPeriod, provider_id: selectedProvider }
      })
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount)
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return "text-green-600 bg-green-100"
    if (rate >= 90) return "text-yellow-600 bg-yellow-100"
    return "text-red-600 bg-red-100"
  }

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <ChartPie className="h-5 w-5 text-ui-fg-subtle" />
          <Heading level="h2">Shipping Analytics</Heading>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <Select.Trigger className="w-32">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="7d">Last 7 days</Select.Item>
              <Select.Item value="30d">Last 30 days</Select.Item>
              <Select.Item value="90d">Last 90 days</Select.Item>
              <Select.Item value="1y">Last year</Select.Item>
            </Select.Content>
          </Select>

          <Button 
            size="small" 
            variant="secondary"
            onClick={() => handleExport('csv')}
            isLoading={isExporting}
          >
            <ArrowUpRightOnBox className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="border-t border-ui-border-base p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg border bg-ui-bg-base">
            <div className="flex items-center justify-between mb-2">
              <Text className="font-semibold text-sm">Total Orders</Text>
              <TriangleRightMini className="h-4 w-4 text-green-600" />
            </div>
            <Text className="text-2xl font-bold text-ui-fg-base">
              {analytics.analytics.totalOrders}
            </Text>
            <Text className="text-xs text-ui-fg-muted">
              {analytics.period} period
            </Text>
          </div>

          <div className="p-4 rounded-lg border bg-ui-bg-base">
            <div className="flex items-center justify-between mb-2">
              <Text className="font-semibold text-sm">Success Rate</Text>
              <div className={`px-2 py-1 rounded text-xs font-medium ${getSuccessRateColor(analytics.analytics.successRate)}`}>
                {analytics.analytics.successRate}%
              </div>
            </div>
            <Text className="text-lg font-bold text-ui-fg-base">
              {analytics.analytics.successfulDeliveries}/{analytics.analytics.totalOrders}
            </Text>
            <Text className="text-xs text-ui-fg-muted">
              Successful deliveries
            </Text>
          </div>

          <div className="p-4 rounded-lg border bg-ui-bg-base">
            <div className="flex items-center justify-between mb-2">
              <Text className="font-semibold text-sm">Total Shipping Cost</Text>
            </div>
            <Text className="text-2xl font-bold text-ui-fg-base">
              {formatCurrency(analytics.analytics.totalCost)}
            </Text>
            <Text className="text-xs text-ui-fg-muted">
              Avg: {formatCurrency(analytics.analytics.averageCostPerOrder)}
            </Text>
          </div>

          <div className="p-4 rounded-lg border bg-ui-bg-base">
            <div className="flex items-center justify-between mb-2">
              <Text className="font-semibold text-sm">Avg Delivery Time</Text>
            </div>
            <Text className="text-2xl font-bold text-ui-fg-base">
              {Math.floor(analytics.analytics.averageDeliveryTime / 60)}h {analytics.analytics.averageDeliveryTime % 60}m
            </Text>
            <Text className="text-xs text-ui-fg-muted">
              On-time rate: {analytics.analytics.onTimeDeliveryRate}%
            </Text>
          </div>
        </div>

        {/* Provider Comparison */}
        <div className="mb-6">
          <Heading level="h3" className="mb-4">Provider Performance</Heading>
          <div className="space-y-3">
            {analytics.providerComparison.providers.map((provider: any) => (
              <div key={provider.providerId} className="flex items-center justify-between p-3 rounded border">
                <div className="flex items-center gap-3">
                  <Text className="font-medium">{provider.providerId.toUpperCase()}</Text>
                  <Badge size="small" variant="neutral">
                    {provider.orders} orders
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <Text className="font-medium">{formatCurrency(provider.cost)}</Text>
                    <Text className="text-xs text-ui-fg-muted">Total cost</Text>
                  </div>
                  
                  <div className="text-right">
                    <Text className={`font-medium ${getSuccessRateColor(provider.successRate).includes('green') ? 'text-green-600' : provider.successRate >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {provider.successRate}%
                    </Text>
                    <Text className="text-xs text-ui-fg-muted">Success rate</Text>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Optimization Tips */}
        <div>
          <Heading level="h3" className="mb-4">Cost Optimization</Heading>
          <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <TriangleRightMini className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <Text className="font-medium text-blue-900 mb-2">Potential Savings Available</Text>
                <Text className="text-sm text-blue-800 mb-3">
                  You could save up to {formatCurrency(analytics.optimization.potentialSavings)} per month by optimizing your shipping strategy.
                </Text>
                <div className="space-y-1">
                  {analytics.optimization.tips.map((tip: string, index: number) => (
                    <Text key={index} className="text-xs text-blue-700">
                      • {tip}
                    </Text>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  )
}
