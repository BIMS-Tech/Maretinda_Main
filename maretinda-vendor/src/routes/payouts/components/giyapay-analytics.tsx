import { Container, Heading, Text } from "@medusajs/ui"
import { CheckCircle, CurrencyDollar, CreditCard, Spinner } from "@medusajs/icons"

import { useGiyaPayAnalytics } from "../../../hooks/api/payouts"

export const GiyaPayAnalytics = () => {
  const { analytics, isLoading, isError } = useGiyaPayAnalytics()

  if (isLoading) {
    return (
      <Container className="p-0">
        <div className="flex items-center justify-between p-6">
          <Heading level="h2">GiyaPay Sales Analytics</Heading>
        </div>
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border bg-ui-bg-subtle p-4">
              <div className="h-4 w-24 rounded bg-ui-bg-disabled mb-2"></div>
              <div className="h-6 w-32 rounded bg-ui-bg-disabled"></div>
            </div>
          ))}
        </div>
      </Container>
    )
  }

  if (isError || !analytics) {
    return (
      <Container className="p-0">
        <div className="flex items-center justify-between p-6">
          <Heading level="h2">GiyaPay Sales Analytics</Heading>
        </div>
        <div className="p-6">
          <Text className="text-ui-fg-subtle">
            Unable to load analytics data at the moment.
          </Text>
        </div>
      </Container>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: analytics.currency || 'PHP',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const analyticsCards = [
    {
      title: "Total Captured (Gross)",
      value: formatCurrency(analytics.total_captured),
      description: `${analytics.transaction_count} transactions`,
      icon: CheckCircle,
      color: "text-ui-tag-green-text bg-ui-tag-green-bg",
      subtitle: analytics.payment_processing_fees ? `Processing fees: ${formatCurrency(analytics.payment_processing_fees)} (${(analytics.payment_processing_fee_rate * 100).toFixed(1)}%)` : "",
    },
    {
      title: "Net Revenue",
      value: formatCurrency(analytics.net_amount || analytics.total_captured),
      description: "After all fees",
      icon: CurrencyDollar,
      color: "text-ui-tag-blue-text bg-ui-tag-blue-bg",
      subtitle: analytics.average_transaction_value ? `Avg: ${formatCurrency(analytics.average_transaction_value)}` : "",
    },
    {
      title: "Available Balance",
      value: formatCurrency(analytics.available_balance),
      description: "Ready for payout",
      icon: CreditCard,
      color: "text-ui-tag-purple-text bg-ui-tag-purple-bg",
      subtitle: analytics.total_requested ? `Requested: ${formatCurrency(analytics.total_requested)}` : "",
    },
    {
      title: "Monthly Subscription",
      value: formatCurrency(analytics.subscription_fee_monthly || 0),
      description: analytics.billing_info ? `${analytics.billing_info.days_elapsed}/${analytics.billing_info.current_month_days} days` : "Monthly plan",
      icon: Spinner,
      color: "text-ui-tag-orange-text bg-ui-tag-orange-bg",
      subtitle: analytics.subscription_fee_prorated ? `Prorated: ${formatCurrency(analytics.subscription_fee_prorated)}` : "",
    },
  ]

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between p-6">
        <div>
          <Heading level="h2">GiyaPay Sales Analytics</Heading>
          {analytics.last_transaction_date && (
            <Text className="text-ui-fg-subtle text-sm">
              Last transaction: {formatDate(analytics.last_transaction_date)}
            </Text>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
        {analyticsCards.map((card) => {
          const IconComponent = card.icon
          return (
            <div
              key={card.title}
              className="rounded-lg border bg-ui-bg-base p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Text className="text-ui-fg-subtle text-sm font-medium">
                    {card.title}
                  </Text>
                  <Text className="text-lg font-semibold text-ui-fg-base mt-1">
                    {card.value}
                  </Text>
                  <Text className="text-ui-fg-muted text-xs mt-1">
                    {card.description}
                  </Text>
                  {card.subtitle && (
                    <Text className="text-ui-fg-subtle text-xs mt-1">
                      {card.subtitle}
                    </Text>
                  )}
                </div>
                <div className={`rounded-full p-2 ${card.color}`}>
                  <IconComponent className="h-4 w-4" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Performance */}
      {(analytics.weekly_amount || analytics.monthly_amount) && (
        <div className="border-t border-ui-border-base p-6">
          <Heading level="h3" className="mb-4">Recent Performance</Heading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-ui-bg-subtle p-4">
              <Text className="text-ui-fg-subtle text-sm font-medium">
                Last 7 Days
              </Text>
              <Text className="text-lg font-semibold text-ui-fg-base mt-1">
                {formatCurrency(analytics.weekly_amount || 0)}
              </Text>
              <Text className="text-ui-fg-muted text-xs mt-1">
                {analytics.weekly_transaction_count || 0} transactions
              </Text>
            </div>
            
            <div className="rounded-lg bg-ui-bg-subtle p-4">
              <Text className="text-ui-fg-subtle text-sm font-medium">
                Last 30 Days
              </Text>
              <Text className="text-lg font-semibold text-ui-fg-base mt-1">
                {formatCurrency(analytics.monthly_amount || 0)}
              </Text>
              <Text className="text-ui-fg-muted text-xs mt-1">
                {analytics.monthly_transaction_count || 0} transactions
              </Text>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Information */}
      {analytics.billing_info && (
        <div className="border-t border-ui-border-base p-6">
          <Heading level="h3" className="mb-4">Subscription Information</Heading>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border bg-ui-bg-subtle">
              <Text className="font-semibold text-sm">Monthly Plan</Text>
              <Text className="text-2xl font-bold text-ui-fg-base">
                {formatCurrency(analytics.subscription_fee_monthly)}
              </Text>
              <Text className="text-xs text-ui-fg-muted">Per month</Text>
            </div>
            
            <div className="p-4 rounded-lg border bg-ui-bg-subtle">
              <Text className="font-semibold text-sm">This Month Usage</Text>
              <Text className="text-lg font-bold text-ui-fg-base">
                {analytics.billing_info.days_elapsed}/{analytics.billing_info.current_month_days} days
              </Text>
              <Text className="text-xs text-ui-fg-muted">
                Prorated: {formatCurrency(analytics.subscription_fee_prorated)}
              </Text>
            </div>
            
            <div className="p-4 rounded-lg border bg-ui-bg-subtle">
              <Text className="font-semibold text-sm">Next Billing</Text>
              <Text className="text-sm font-bold text-ui-fg-base">
                {formatDate(analytics.billing_info.next_billing_date)}
              </Text>
              <Text className="text-xs text-ui-fg-muted">
                Status: {analytics.billing_info.subscription_status}
              </Text>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Breakdown */}
      {analytics.breakdown && (
        <div className="border-t border-ui-border-base p-6">
          <Heading level="h3" className="mb-4">Revenue Breakdown</Heading>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-ui-border-base">
              <Text className="text-ui-fg-subtle text-sm">Gross Revenue</Text>
              <Text className="font-semibold text-ui-fg-base">{formatCurrency(analytics.breakdown.gross_revenue)}</Text>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-ui-border-base">
              <Text className="text-ui-fg-subtle text-sm">Payment Processing ({(analytics.payment_processing_fee_rate * 100).toFixed(1)}%)</Text>
              <Text className="font-semibold text-red-600">-{formatCurrency(analytics.breakdown.payment_processing_fees)}</Text>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-ui-border-base">
              <Text className="text-ui-fg-subtle text-sm">Monthly Subscription (Prorated)</Text>
              <Text className="font-semibold text-red-600">-{formatCurrency(analytics.breakdown.subscription_fee_prorated)}</Text>
            </div>
            {analytics.breakdown.transaction_fees > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-ui-border-base">
                <Text className="text-ui-fg-subtle text-sm">
                  Transaction Fees ({analytics.transaction_count} × {formatCurrency(analytics.subscription_fee_per_transaction || 0)})
                </Text>
                <Text className="font-semibold text-red-600">-{formatCurrency(analytics.breakdown.transaction_fees)}</Text>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-ui-border-base">
              <Text className="text-ui-fg-subtle text-sm font-medium">Total Maretinda Fees</Text>
              <Text className="font-bold text-red-600">-{formatCurrency(analytics.breakdown.total_maretinda_fees)}</Text>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-ui-border-base">
              <Text className="text-ui-fg-subtle text-sm font-medium">Total All Fees</Text>
              <Text className="font-bold text-red-600">-{formatCurrency(analytics.breakdown.total_all_fees)}</Text>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-ui-border-base">
              <Text className="text-ui-fg-subtle text-sm font-medium">Net Revenue</Text>
              <Text className="font-bold text-ui-fg-base">{formatCurrency(analytics.breakdown.net_revenue)}</Text>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-ui-border-base">
              <Text className="text-ui-fg-subtle text-sm">Already Paid Out</Text>
              <Text className="font-semibold text-green-600">{formatCurrency(analytics.breakdown.paid_out)}</Text>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-ui-border-base">
              <Text className="text-ui-fg-subtle text-sm">Pending Payouts</Text>
              <Text className="font-semibold text-orange-600">{formatCurrency(analytics.breakdown.pending_payouts)}</Text>
            </div>
            <div className="flex justify-between items-center py-2 bg-ui-bg-subtle rounded px-3">
              <Text className="text-ui-fg-base text-sm font-bold">Available for Payout</Text>
              <Text className="font-bold text-lg text-blue-600">{formatCurrency(analytics.breakdown.available_for_payout)}</Text>
            </div>
          </div>
        </div>
      )}

      {/* Top Transactions */}
      {analytics.top_transactions && analytics.top_transactions.length > 0 && (
        <div className="border-t border-ui-border-base p-6">
          <Heading level="h3" className="mb-4">Top Transactions</Heading>
          <div className="space-y-3">
            {analytics.top_transactions.map((txn: any, index: number) => (
              <div key={txn.id} className="flex justify-between items-center py-2 border-b border-ui-border-base last:border-b-0">
                <div>
                  <Text className="text-ui-fg-base text-sm font-medium">#{index + 1} {txn.reference_number}</Text>
                  <Text className="text-ui-fg-muted text-xs">
                    {txn.gateway} • {formatDate(txn.created_at)}
                  </Text>
                </div>
                <Text className="font-semibold text-ui-fg-base">{formatCurrency(txn.amount)}</Text>
              </div>
            ))}
          </div>
        </div>
      )}
    </Container>
  )
}
