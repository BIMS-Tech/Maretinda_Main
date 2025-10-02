import { Button, Container, Heading, StatusBadge, Text, toast, Badge, Tabs } from "@medusajs/ui"
import { useState, useEffect } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { 
  MapPin, 
  Phone, 
  CalendarMini, 
  XMark as ViewIcon,
  XMark,
  Plus,
  CogSixTooth,
  TruckFast,
  Bolt,
  ChartBar
} from "@medusajs/icons"

interface UnifiedShippingOrder {
  orderId: string
  providerId: string
  providerOrderId: string
  quotationId: string
  status: string
  trackingNumber?: string
  trackingUrl?: string
  shareLink?: string
  priceBreakdown: {
    base: string
    taxes: string
    fees: string
    total: string
    currency: string
  }
  estimatedDelivery?: string
  driverInfo?: {
    id?: string
    name?: string
    phone?: string
    vehicle?: string
  }
  proofOfDelivery?: {
    status: string
    images?: string[]
    deliveredAt?: string
  }
  metadata?: Record<string, any>
}

interface TrackingUpdate {
  orderId: string
  providerId: string
  status: string
  message: string
  timestamp: string
  location?: {
    address?: string
  }
  driverInfo?: any
}

interface ProviderConfig {
  providerId: string
  name: string
  type: string
  enabled: boolean
  priority: number
  supportedMarkets: string[]
  supportedServiceTypes: string[]
}

interface QuotationComparison {
  providerId: string
  quotation: any
  score: number
  reasoning: string[]
  available: boolean
}

const statusColors = {
  PENDING: "grey",
  CONFIRMED: "blue",
  ASSIGNING_DRIVER: "orange",
  DRIVER_ASSIGNED: "purple",
  PICKED_UP: "purple",
  IN_TRANSIT: "blue",
  OUT_FOR_DELIVERY: "orange",
  DELIVERED: "green",
  FAILED: "red",
  CANCELLED: "red",
  RETURNED: "orange",
  EXPIRED: "grey"
} as const

const providerColors = {
  lalamove: "blue",
  dhl: "orange",
  fedex: "purple",
  ups: "green"
} as const

export function MultiVendorShippingDashboard() {
  const [activeTab, setActiveTab] = useState("orders")
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [selectedProvider, setSelectedProvider] = useState<string>("")
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Fetch shipping orders
  const { data: ordersData, refetch: refetchOrders } = useQuery({
    queryKey: ['multi-vendor-shipping-orders', { status: selectedStatus, provider: selectedProvider }],
    queryFn: () =>
      fetch('/api/vendor/shipping', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      }).then(res => res.json()),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

  // Fetch provider configurations
  const { data: providersData, refetch: refetchProviders } = useQuery({
    queryKey: ['shipping-providers'],
    queryFn: () =>
      fetch('/api/admin/shipping/providers', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      }).then(res => res.json()),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })

  // Get quotations from multiple providers
  const getQuotationsMutation = useMutation({
    mutationFn: (request: any) =>
      fetch('/api/vendor/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: "get-quotations",
          data: request,
          criteria: { priority: "cost", maxCost: "500.00" }
        })
      }).then(res => res.json()),
    onSuccess: (result) => {
      toast.success(`Received ${result.quotations?.length || 0} quotations`)
    },
    onError: (error) => {
      toast.error("Failed to get quotations")
      console.error(error)
    }
  })

  // Place order
  const placeOrderMutation = useMutation({
    mutationFn: ({ orderRequest, providerId }: { orderRequest: any, providerId: string }) =>
      fetch('/api/vendor/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: "place-order",
          data: orderRequest,
          providerId
        })
      }).then(res => res.json()),
    onSuccess: () => {
      setShowCreateForm(false)
      refetchOrders()
      toast.success("Order placed successfully")
    },
    onError: (error) => {
      toast.error("Failed to place order")
      console.error(error)
    }
  })

  // Track order
  const trackOrderMutation = useMutation({
    mutationFn: (orderId: string) =>
      fetch('/api/vendor/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: "track-order",
          data: { orderId }
        })
      }).then(res => res.json()),
    onSuccess: (result) => {
      console.log('Tracking updates:', result.tracking)
    }
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatPrice = (priceBreakdown: any) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: priceBreakdown.currency || 'USD',
    }).format(parseFloat(priceBreakdown.total))
  }

  const orders = ordersData?.orders || []
  const providers = providersData?.configuredProviders || []

  const OrdersTab = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-ui-border-base rounded-md"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="DRIVER_ASSIGNED">Driver Assigned</option>
          <option value="PICKED_UP">Picked Up</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="DELIVERED">Delivered</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value)}
          className="px-3 py-2 border border-ui-border-base rounded-md"
        >
          <option value="">All Providers</option>
          {providers.map((provider: ProviderConfig) => (
            <option key={provider.providerId} value={provider.providerId}>
              {provider.name}
            </option>
          ))}
        </select>

        <Button
          variant="secondary"
          size="small"
          onClick={() => refetchOrders()}
        >
          Refresh
        </Button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-ui-bg-subtle">
              <tr>
                <th className="p-4 text-left font-medium">Order ID</th>
                <th className="p-4 text-left font-medium">Provider</th>
                <th className="p-4 text-left font-medium">Status</th>
                <th className="p-4 text-left font-medium">Price</th>
                <th className="p-4 text-left font-medium">Tracking</th>
                <th className="p-4 text-left font-medium">Driver</th>
                <th className="p-4 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: UnifiedShippingOrder) => (
                <tr key={order.orderId} className="border-t border-ui-border-base">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <Text className="font-medium">{order.orderId}</Text>
                      <Text className="text-sm text-ui-fg-subtle">
                        {order.trackingNumber}
                      </Text>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge color={providerColors[order.providerId as keyof typeof providerColors] || "grey"}>
                      {order.providerId.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <StatusBadge color={statusColors[order.status as keyof typeof statusColors] || "grey"}>
                      {order.status.replace('_', ' ')}
                    </StatusBadge>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <Text className="font-medium">{formatPrice(order.priceBreakdown)}</Text>
                      <Text className="text-xs text-ui-fg-subtle">
                        Base: {order.priceBreakdown.base} {order.priceBreakdown.currency}
                      </Text>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      {order.trackingUrl && (
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => window.open(order.trackingUrl, '_blank')}
                        >
                          <ViewIcon className="w-4 h-4 mr-1" />
                          Track
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => trackOrderMutation.mutate(order.orderId)}
                      >
                        <Bolt className="w-4 h-4 mr-1" />
                        Updates
                      </Button>
                    </div>
                  </td>
                  <td className="p-4">
                    {order.driverInfo ? (
                      <div className="flex flex-col">
                        <Text className="text-sm font-medium">{order.driverInfo.name}</Text>
                        <Text className="text-xs text-ui-fg-subtle">{order.driverInfo.phone}</Text>
                        <Text className="text-xs text-ui-fg-subtle">{order.driverInfo.vehicle}</Text>
                      </div>
                    ) : (
                      <Text className="text-sm text-ui-fg-subtle">Not assigned</Text>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {order.shareLink && (
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => window.open(order.shareLink, '_blank')}
                        >
                          <ViewIcon className="w-4 h-4" />
                        </Button>
                      )}
                      {!['DELIVERED', 'CANCELLED', 'FAILED'].includes(order.status) && (
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => {
                            // Cancel order logic
                          }}
                        >
                          <XMark className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <TruckFast className="w-12 h-12 mx-auto mb-4 text-ui-fg-subtle" />
          <Text className="text-ui-fg-subtle">No shipping orders found</Text>
          <Text className="text-sm text-ui-fg-subtle mt-2">
            Create your first delivery to get started
          </Text>
        </div>
      )}
    </div>
  )

  const ProvidersTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((provider: ProviderConfig) => (
          <div key={provider.providerId} className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Badge color={providerColors[provider.providerId as keyof typeof providerColors] || "grey"}>
                  {provider.name}
                </Badge>
                <StatusBadge color={provider.enabled ? "green" : "red"}>
                  {provider.enabled ? "Active" : "Inactive"}
                </StatusBadge>
              </div>
              <Button variant="secondary" size="small">
                <CogSixTooth className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <div>
                <Text className="text-sm font-medium">Type:</Text>
                <Text className="text-sm text-ui-fg-subtle">{provider.type.replace('_', ' ')}</Text>
              </div>
              <div>
                <Text className="text-sm font-medium">Priority:</Text>
                <Text className="text-sm text-ui-fg-subtle">{provider.priority}</Text>
              </div>
              <div>
                <Text className="text-sm font-medium">Markets:</Text>
                <div className="flex flex-wrap gap-1 mt-1">
                  {provider.supportedMarkets.slice(0, 3).map(market => (
                    <Badge key={market} variant="secondary" size="small">
                      {market}
                    </Badge>
                  ))}
                  {provider.supportedMarkets.length > 3 && (
                    <Badge variant="secondary" size="small">
                      +{provider.supportedMarkets.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <Text className="text-sm font-medium">Services:</Text>
                <Text className="text-sm text-ui-fg-subtle">
                  {provider.supportedServiceTypes.length} types
                </Text>
              </div>
            </div>
          </div>
        ))}
      </div>

      {providers.length === 0 && (
        <div className="text-center py-12">
          <CogSixTooth className="w-12 h-12 mx-auto mb-4 text-ui-fg-subtle" />
          <Text className="text-ui-fg-subtle">No shipping providers configured</Text>
          <Text className="text-sm text-ui-fg-subtle mt-2">
            Contact your administrator to set up shipping providers
          </Text>
        </div>
      )}
    </div>
  )

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Multi-Vendor Shipping</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Manage deliveries across multiple shipping providers
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="small"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Delivery
          </Button>
        </div>
      </div>

      {/* Quick Help Section for New Users */}
      {(!ordersData?.orders || ordersData.orders.length === 0) && activeTab === 'orders' && (
        <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded">
              <TruckFast className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <Text className="font-medium text-blue-900 mb-2">🚀 Setup Your Shipping Providers</Text>
              <Text className="text-sm text-blue-800 mb-3">
                Connect your shipping provider accounts (Lalamove, J&T Express, Ninja Van) to get the best rates and delivery options.
                We'll guide you through the credential setup process.
              </Text>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setActiveTab('providers')}
                  className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <CogSixTooth className="w-4 h-4 mr-1" />
                  Configure Providers
                </Button>
                <Text className="text-xs text-blue-600 self-center">
                  Direct links to provider dashboards included
                </Text>
              </div>
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Trigger value="orders">
            <TruckFast className="w-4 h-4 mr-2" />
            Orders
          </Tabs.Trigger>
          <Tabs.Trigger value="providers">
            <CogSixTooth className="w-4 h-4 mr-2" />
            Providers
          </Tabs.Trigger>
          <Tabs.Trigger value="analytics">
            <ChartBar className="w-4 h-4 mr-2" />
            Analytics
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="orders" className="mt-6">
          <OrdersTab />
        </Tabs.Content>

        <Tabs.Content value="providers" className="mt-6">
          <ProvidersTab />
        </Tabs.Content>

        <Tabs.Content value="analytics" className="mt-6">
          <div className="text-center py-12">
            <ChartBar className="w-12 h-12 mx-auto mb-4 text-ui-fg-subtle" />
            <Text className="text-ui-fg-subtle">Analytics Coming Soon</Text>
            <Text className="text-sm text-ui-fg-subtle mt-2">
              Track delivery performance and provider metrics
            </Text>
          </div>
        </Tabs.Content>
      </Tabs>
    </Container>
  )
}
