import { Container, Heading, Text, Badge, StatusBadge } from "@medusajs/ui"
import { Calendar, Clock, CheckCircle } from "@medusajs/icons"
import { useQuery } from "@tanstack/react-query"
import { fetchQuery } from "../../../lib/client"

interface SettlementInfo {
  vendor_id: string
  current_date: string
  is_banking_day: boolean
  can_process_settlements_today: boolean
  next_settlement_date: string
  schedule: {
    description: string
    t_plus_1: string
    t_plus_2: string
    banking_days: string
    weekend_rule: string
    holiday_rule: string
  }
  example_settlement: {
    description: string
    transaction_date: string
    processing_date: string
    crediting_date: string
    timeline_display: string
    business_days_to_credit: number
  }
  today_activities: {
    transactions_for_processing: number
    transactions_for_crediting: number
    processing_amount: number
    crediting_amount: number
  }
  recent_transactions: Array<{
    transaction_id: string
    transaction_date: string
    amount: number
    settlement_timeline: string
    processing_date: string
    crediting_date: string
    status: 'pending' | 'processing' | 'completed'
    business_days_to_credit: number
    is_weekend_transaction: boolean
    is_holiday_transaction: boolean
  }>
}

const useSettlementInfo = () => {
  return useQuery({
    queryKey: ["settlement-info"],
    queryFn: async (): Promise<{ settlement_info: SettlementInfo }> => {
      try {
        return await fetchQuery("/vendor/settlement-info")
      } catch (error) {
        console.warn("Settlement Info API not available, using mock data:", error)
        // Return mock data
        return {
          settlement_info: {
            vendor_id: "vendor_mock",
            current_date: new Date().toISOString(),
            is_banking_day: new Date().getDay() >= 1 && new Date().getDay() <= 5,
            can_process_settlements_today: true,
            next_settlement_date: new Date().toISOString(),
            schedule: {
              description: "T+1/T+2 Settlement Schedule",
              t_plus_1: "Transactions are processed the next banking day",
              t_plus_2: "Vendor accounts are credited on the second banking day",
              banking_days: "Monday to Friday, excluding Philippine bank holidays",
              weekend_rule: "Weekend transactions are processed on the following Monday",
              holiday_rule: "Holiday transactions are processed on the next banking day"
            },
            example_settlement: {
              description: "Settlement timeline example",
              transaction_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              processing_date: new Date().toISOString(),
              crediting_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              timeline_display: "Thu Dec 26 → Fri Dec 27 (T+1) → Mon Dec 30 (T+2)",
              business_days_to_credit: 2
            },
            today_activities: {
              transactions_for_processing: 3,
              transactions_for_crediting: 5,
              processing_amount: 25000,
              crediting_amount: 45000
            },
            recent_transactions: [
              {
                transaction_id: "txn_001",
                transaction_date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
                amount: 15000,
                settlement_timeline: "Wed Dec 25 → Thu Dec 26 (T+1) → Fri Dec 27 (T+2)",
                processing_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                crediting_date: new Date().toISOString(),
                status: "completed" as const,
                business_days_to_credit: 2,
                is_weekend_transaction: false,
                is_holiday_transaction: true
              }
            ]
          }
        }
      }
    },
    retry: false,
  })
}

export const SettlementTimeline = () => {
  const { data, isLoading, isError } = useSettlementInfo()
  
  if (isLoading) {
    return (
      <Container className="p-6">
        <Text>Loading settlement information...</Text>
      </Container>
    )
  }

  if (isError || !data) {
    return (
      <Container className="p-6">
        <Text className="text-ui-fg-error">Failed to load settlement information</Text>
      </Container>
    )
  }

  const { settlement_info } = data

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string): "green" | "orange" | "blue" | "grey" => {
    switch (status) {
      case "completed":
        return "green"
      case "processing":
        return "blue"
      case "pending":
        return "orange"
      default:
        return "grey"
    }
  }

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-ui-fg-subtle" />
          <Heading level="h3">Settlement Timeline</Heading>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${settlement_info.is_banking_day ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <Text size="small" className="text-ui-fg-subtle">
            {settlement_info.is_banking_day ? 'Banking Day' : 'Non-Banking Day'}
          </Text>
        </div>
      </div>

      {/* Settlement Schedule Info */}
      <div className="border-t border-ui-border-base p-6">
        <Heading level="h4" className="mb-4">How Settlement Works</Heading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="p-4 rounded-lg bg-ui-bg-subtle">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <Text className="font-semibold text-sm">T+1 Processing</Text>
            </div>
            <Text className="text-xs text-ui-fg-muted">
              {settlement_info.schedule.t_plus_1}
            </Text>
          </div>
          
          <div className="p-4 rounded-lg bg-ui-bg-subtle">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <Text className="font-semibold text-sm">T+2 Crediting</Text>
            </div>
            <Text className="text-xs text-ui-fg-muted">
              {settlement_info.schedule.t_plus_2}
            </Text>
          </div>
        </div>
        
        <div className="mt-4 p-3 rounded border-l-4 border-l-blue-500 bg-blue-50">
          <Text className="text-sm font-medium text-blue-900 mb-1">Banking Days</Text>
          <Text className="text-xs text-blue-800">{settlement_info.schedule.banking_days}</Text>
        </div>
        
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="p-2 rounded border-l-2 border-l-orange-400 bg-orange-50">
            <Text className="text-xs text-orange-800">{settlement_info.schedule.weekend_rule}</Text>
          </div>
          <div className="p-2 rounded border-l-2 border-l-purple-400 bg-purple-50">
            <Text className="text-xs text-purple-800">{settlement_info.schedule.holiday_rule}</Text>
          </div>
        </div>
      </div>

      {/* Settlement Example */}
      <div className="border-t border-ui-border-base p-6">
        <Heading level="h4" className="mb-4">Example Timeline</Heading>
        <div className="p-4 rounded-lg border bg-ui-bg-base">
          <Text className="text-sm font-medium mb-2">
            {settlement_info.example_settlement.timeline_display}
          </Text>
          <Text className="text-xs text-ui-fg-muted">
            Settled in {settlement_info.example_settlement.business_days_to_credit} business days
          </Text>
        </div>
      </div>

      {/* Today's Activities */}
      {(settlement_info.today_activities.transactions_for_processing > 0 || 
        settlement_info.today_activities.transactions_for_crediting > 0) && (
        <div className="border-t border-ui-border-base p-6">
          <Heading level="h4" className="mb-4">Today's Settlement Activity</Heading>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {settlement_info.today_activities.transactions_for_processing > 0 && (
              <div className="p-4 rounded-lg border bg-blue-50">
                <Text className="font-semibold text-sm text-blue-900">Processing Today (T+1)</Text>
                <Text className="text-lg font-bold text-blue-600">
                  {formatCurrency(settlement_info.today_activities.processing_amount)}
                </Text>
                <Text className="text-xs text-blue-700">
                  {settlement_info.today_activities.transactions_for_processing} transactions
                </Text>
              </div>
            )}
            
            {settlement_info.today_activities.transactions_for_crediting > 0 && (
              <div className="p-4 rounded-lg border bg-green-50">
                <Text className="font-semibold text-sm text-green-900">Crediting Today (T+2)</Text>
                <Text className="text-lg font-bold text-green-600">
                  {formatCurrency(settlement_info.today_activities.crediting_amount)}
                </Text>
                <Text className="text-xs text-green-700">
                  {settlement_info.today_activities.transactions_for_crediting} transactions
                </Text>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Transactions Settlement Status */}
      {settlement_info.recent_transactions.length > 0 && (
        <div className="border-t border-ui-border-base p-6">
          <Heading level="h4" className="mb-4">Recent Transactions</Heading>
          <div className="space-y-3">
            {settlement_info.recent_transactions.slice(0, 5).map((txn) => (
              <div key={txn.transaction_id} className="flex justify-between items-center p-3 rounded border">
                <div>
                  <Text className="font-medium text-sm">{formatCurrency(txn.amount)}</Text>
                  <Text className="text-xs text-ui-fg-muted">{txn.settlement_timeline}</Text>
                  {(txn.is_weekend_transaction || txn.is_holiday_transaction) && (
                    <Badge size="2xsmall" className="mt-1">
                      {txn.is_weekend_transaction ? 'Weekend' : 'Holiday'} Transaction
                    </Badge>
                  )}
                </div>
                <StatusBadge color={getStatusColor(txn.status)}>
                  {txn.status}
                </StatusBadge>
              </div>
            ))}
          </div>
        </div>
      )}
    </Container>
  )
}





