"use client"

import { Button, Container, Heading, StatusBadge, Text, toast } from "@medusajs/ui"
import { useState, useEffect } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { mercurQuery } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-keys-factory"
import { 
  MapPin, 
  Phone, 
  Calendar, 
  Eye,
  XMark,
  Plus
} from "@medusajs/icons"

interface ShippingOrder {
  id: string
  order_id: string
  lalamove_order_id: string
  lalamove_quotation_id: string
  status: string
  pickup_address: string
  pickup_coordinates: { lat: string; lng: string }
  delivery_address: string
  delivery_coordinates: { lat: string; lng: string }
  sender_name: string
  sender_phone: string
  recipient_name: string
  recipient_phone: string
  price: number
  currency: string
  driver_id?: string
  driver_name?: string
  driver_phone?: string
  share_link?: string
  tracking_url?: string
  estimated_delivery?: string
  actual_delivery?: string
  pod_status?: string
  pod_image?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

interface QuotationRequest {
  serviceType: string
  specialRequests?: string[]
  language: string
  stops: {
    coordinates: { lat: string; lng: string }
    address: string
  }[]
  scheduleAt?: string
  isRouteOptimized?: boolean
  item?: {
    quantity?: string
    weight?: string
    categories?: string[]
    handlingInstructions?: string[]
  }
}

interface OrderRequest {
  quotationId: string
  sender: {
    stopId: string
    name: string
    phone: string
  }
  recipients: {
    stopId: string
    name: string
    phone: string
    remarks?: string
  }[]
  isPODEnabled?: boolean
  partner?: string
  metadata?: Record<string, any>
}

const statusColors = {
  ASSIGNING_DRIVER: "orange",
  ON_GOING: "blue",
  PICKED_UP: "purple",
  COMPLETED: "green",
  CANCELED: "red",
  REJECTED: "red",
  EXPIRED: "grey"
} as const

const shippingQueryKeys = queryKeysFactory('shipping')

export default function ShippingDashboard() {
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [quotationData, setQuotationData] = useState<QuotationRequest | null>(null)
  const [orderData, setOrderData] = useState<OrderRequest | null>(null)

  const { data: shippingData, refetch } = useQuery({
    queryKey: shippingQueryKeys.list(['orders', { limit: 100, status: selectedStatus || undefined }]),
    queryFn: () =>
      mercurQuery('/admin/shipping', {
        method: 'GET',
        query: {
          limit: 100,
          ...(selectedStatus && { status: selectedStatus })
        }
      }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const createQuotationMutation = useMutation({
    mutationFn: (data: QuotationRequest) =>
      mercurQuery('/admin/shipping', {
        method: 'POST',
        body: {
          action: "get-quotation",
          data
        }
      }),
    onSuccess: (result: any, data: QuotationRequest) => {
      setQuotationData(data)
      setOrderData({
        quotationId: result.quotation.quotationId,
        sender: {
          stopId: result.quotation.stops[0].stopId,
          name: "Sender",
          phone: "+60123456789"
        },
        recipients: [{
          stopId: result.quotation.stops[1].stopId,
          name: "Recipient",
          phone: "+60123456789"
        }],
        isPODEnabled: true,
        metadata: { order_id: "test-order-123" }
      })
      toast.success("Quotation created successfully")
    },
    onError: (error) => {
      toast.error("Failed to create quotation")
      console.error(error)
    }
  })

  const placeOrderMutation = useMutation({
    mutationFn: (data: OrderRequest) =>
      mercurQuery('/admin/shipping', {
        method: 'POST',
        body: {
          action: "place-order",
          data
        }
      }),
    onSuccess: () => {
      setShowCreateForm(false)
      setQuotationData(null)
      setOrderData(null)
      refetch()
      toast.success("Order placed successfully")
    },
    onError: (error) => {
      toast.error("Failed to place order")
      console.error(error)
    }
  })

  const cancelOrderMutation = useMutation({
    mutationFn: (data: { orderId: string; shippingOrderId: string }) =>
      mercurQuery('/admin/shipping', {
        method: 'POST',
        body: {
          action: "cancel-order",
          data
        }
      }),
    onSuccess: () => {
      refetch()
      toast.success("Order cancelled successfully")
    },
    onError: (error) => {
      toast.error("Failed to cancel order")
      console.error(error)
    }
  })

  const getQuotation = async (data: QuotationRequest) => {
    await createQuotationMutation.mutateAsync(data)
  }

  const placeOrder = async (data: OrderRequest) => {
    await placeOrderMutation.mutateAsync(data)
  }

  const cancelOrder = async (orderId: string, shippingOrderId: string) => {
    await cancelOrderMutation.mutateAsync({ orderId, shippingOrderId })
  }

  const shippingOrders = shippingData?.orders || []

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>Shipping Management</Heading>
          <Text className="text-ui-fg-subtle">
            Manage Lalamove deliveries and track orders
          </Text>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="small"
            onClick={() => refetch()}
            disabled={false}
          >
            <Plus className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4" />
            Create Delivery
          </Button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={selectedStatus === "" ? "primary" : "secondary"}
          onClick={() => setSelectedStatus("")}
        >
          All ({shippingData?.total || 0})
        </Button>
        {Object.keys(statusColors).map((status) => (
          <Button
            key={status}
            variant={selectedStatus === status ? "primary" : "secondary"}
            onClick={() => setSelectedStatus(status)}
          >
            {status.replace("_", " ")} (
            {shippingOrders.filter((order: ShippingOrder) => order.status === status).length})
          </Button>
        ))}
      </div>

      {/* Shipping Orders Table */}
      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-ui-bg-subtle">
                <th className="text-left p-4">Order ID</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Pickup</th>
                <th className="text-left p-4">Delivery</th>
                <th className="text-left p-4">Driver</th>
                <th className="text-left p-4">Price</th>
                <th className="text-left p-4">Created</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shippingOrders.map((order: ShippingOrder) => (
                <tr key={order.id} className="border-b hover:bg-ui-bg-subtle">
                  <td className="p-4">
                    <div>
                      <Text className="font-medium">{order.order_id}</Text>
                      <Text className="text-xs text-ui-fg-subtle">
                        {order.lalamove_order_id}
                      </Text>
                    </div>
                  </td>
                  <td className="p-4">
                    <StatusBadge color={statusColors[order.status as keyof typeof statusColors]}>
                      {order.status.replace("_", " ")}
                    </StatusBadge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-ui-fg-subtle" />
                      <div>
                        <Text className="text-sm">{order.sender_name}</Text>
                        <Text className="text-xs text-ui-fg-subtle">
                          {order.pickup_address}
                        </Text>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-ui-fg-subtle" />
                      <div>
                        <Text className="text-sm">{order.recipient_name}</Text>
                        <Text className="text-xs text-ui-fg-subtle">
                          {order.delivery_address}
                        </Text>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {order.driver_name ? (
                      <div>
                        <Text className="text-sm">{order.driver_name}</Text>
                        <Text className="text-xs text-ui-fg-subtle">
                          {order.driver_phone}
                        </Text>
                      </div>
                    ) : (
                      <Text className="text-sm text-ui-fg-subtle">Not assigned</Text>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Price:</span>
                      <span className="text-sm">
                        {order.currency} {order.price}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <Text className="text-sm">
                      {new Date(order.created_at).toLocaleDateString()}
                    </Text>
                    <Text className="text-xs text-ui-fg-subtle">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </Text>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {order.share_link && (
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => window.open(order.share_link, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                          Track
                        </Button>
                      )}
                      {order.status === 'ASSIGNING_DRIVER' && (
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => cancelOrder(order.lalamove_order_id, order.id)}
                        >
                          <XMark className="w-4 h-4" />
                          Cancel
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

      {/* Create Delivery Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <Heading>Create New Delivery</Heading>
              <Button
                variant="secondary"
                size="small"
                onClick={() => {
                  setShowCreateForm(false)
                  setQuotationData(null)
                  setOrderData(null)
                }}
              >
                <XMark className="w-4 h-4" />
              </Button>
            </div>

            {!quotationData ? (
              <QuotationForm onSubmit={getQuotation} />
            ) : (
              <OrderForm
                quotationData={quotationData}
                orderData={orderData}
                onSubmit={placeOrder}
                onBack={() => {
                  setQuotationData(null)
                  setOrderData(null)
                }}
              />
            )}
          </div>
        </div>
      )}
    </Container>
  )
}

function QuotationForm({ onSubmit }: { onSubmit: (data: QuotationRequest) => void }) {
  const [formData, setFormData] = useState<QuotationRequest>({
    serviceType: "MOTORCYCLE",
    language: "en_MY",
    stops: [
      {
        coordinates: { lat: "3.1390", lng: "101.6869" },
        address: "Kuala Lumpur, Malaysia"
      },
      {
        coordinates: { lat: "3.0738", lng: "101.5183" },
        address: "Petaling Jaya, Malaysia"
      }
    ]
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Service Type</label>
        <select
          value={formData.serviceType}
          onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
          className="w-full p-2 border rounded"
        >
          <option value="MOTORCYCLE">Motorcycle</option>
          <option value="CAR">Car</option>
          <option value="VAN">Van</option>
          <option value="TRUCK">Truck</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Pickup Location</label>
        <input
          type="text"
          value={formData.stops[0]?.address || ""}
          onChange={(e) => setFormData({
            ...formData,
            stops: [
              { ...formData.stops[0], address: e.target.value },
              formData.stops[1]
            ]
          })}
          placeholder="Pickup address"
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Delivery Location</label>
        <input
          type="text"
          value={formData.stops[1]?.address || ""}
          onChange={(e) => setFormData({
            ...formData,
            stops: [
              formData.stops[0],
              { ...formData.stops[1], address: e.target.value }
            ]
          })}
          placeholder="Delivery address"
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Get Quotation
        </Button>
      </div>
    </form>
  )
}

function OrderForm({
  quotationData,
  orderData,
  onSubmit,
  onBack
}: {
  quotationData: QuotationRequest
  orderData: OrderRequest | null
  onSubmit: (data: OrderRequest) => void
  onBack: () => void
}) {
  const [formData, setFormData] = useState<OrderRequest>(orderData || {
    quotationId: "",
    sender: { stopId: "", name: "", phone: "" },
    recipients: [{ stopId: "", name: "", phone: "" }],
    isPODEnabled: true,
    metadata: { order_id: "test-order-123" }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Sender Name</label>
        <input
          type="text"
          value={formData.sender.name}
          onChange={(e) => setFormData({
            ...formData,
            sender: { ...formData.sender, name: e.target.value }
          })}
          placeholder="Sender name"
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Sender Phone</label>
        <input
          type="text"
          value={formData.sender.phone}
          onChange={(e) => setFormData({
            ...formData,
            sender: { ...formData.sender, phone: e.target.value }
          })}
          placeholder="+60123456789"
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Recipient Name</label>
        <input
          type="text"
          value={formData.recipients[0]?.name || ""}
          onChange={(e) => setFormData({
            ...formData,
            recipients: [{ ...formData.recipients[0], name: e.target.value }]
          })}
          placeholder="Recipient name"
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Recipient Phone</label>
        <input
          type="text"
          value={formData.recipients[0]?.phone || ""}
          onChange={(e) => setFormData({
            ...formData,
            recipients: [{ ...formData.recipients[0], phone: e.target.value }]
          })}
          placeholder="+60123456789"
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button type="submit" className="flex-1">
          Place Order
        </Button>
      </div>
    </form>
  )
}


