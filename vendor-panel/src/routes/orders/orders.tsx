import React, { useState, useEffect } from 'react'
import { Container, Heading, StatusBadge, Table, Text } from "@medusajs/ui"
import { useOrders } from "../../hooks/api/orders"

interface OrderWithPayment {
  id: string
  display_id: number
  customer_id: string
  customer: {
    first_name: string
    last_name: string
    email: string
  }
  total: number
  currency_code: string
  status: string
  payment_status: string
  fulfillment_status: string
  created_at: string
  metadata: {
    giyapay_payment?: boolean
    payment_reference?: string
    payment_timestamp?: string
  }
}

const getStatus = (status: string) => {
  switch (status) {
    case 'pending':
      return <StatusBadge color="orange">Pending</StatusBadge>
    case 'confirmed':
      return <StatusBadge color="green">Confirmed</StatusBadge>
    case 'canceled':
      return <StatusBadge color="red">Canceled</StatusBadge>
    default:
      return <StatusBadge color="grey">Unknown</StatusBadge>
  }
}

const getPaymentStatus = (status: string) => {
  switch (status) {
    case 'paid':
      return <StatusBadge color="green">Paid</StatusBadge>
    case 'awaiting':
      return <StatusBadge color="orange">Awaiting</StatusBadge>
    case 'canceled':
      return <StatusBadge color="red">Canceled</StatusBadge>
    default:
      return <StatusBadge color="grey">Unknown</StatusBadge>
  }
}

const getFulfillmentStatus = (status: string) => {
  switch (status) {
    case 'fulfilled':
      return <StatusBadge color="green">Fulfilled</StatusBadge>
    case 'not_fulfilled':
      return <StatusBadge color="orange">Not Fulfilled</StatusBadge>
    case 'partially_fulfilled':
      return <StatusBadge color="yellow">Partially Fulfilled</StatusBadge>
    default:
      return <StatusBadge color="grey">Unknown</StatusBadge>
  }
}

const formatAmount = (amount: number, currency: string = 'PHP') => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<OrderWithPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      // In a real implementation, this would fetch vendor-specific orders
      // For now, we'll use mock data
      const mockOrders: OrderWithPayment[] = [
        {
          id: "order_01H1VKQR2H7B9P1QXVZ6K3J8M4",
          display_id: 1001,
          customer_id: "cus_01H1VKR1M3N2B5C6X7Y8Z9A0B1",
          customer: {
            first_name: "John",
            last_name: "Doe",
            email: "john.doe@example.com"
          },
          total: 125000, // 1250.00 PHP
          currency_code: "PHP",
          status: "confirmed",
          payment_status: "paid",
          fulfillment_status: "not_fulfilled",
          created_at: new Date().toISOString(),
          metadata: {
            giyapay_payment: true,
            payment_reference: "GP123456789",
            payment_timestamp: new Date().toISOString()
          }
        },
        {
          id: "order_01H1VKQR2H7B9P1QXVZ6K3J8M5",
          display_id: 1002,
          customer_id: "cus_01H1VKR1M3N2B5C6X7Y8Z9A0B2",
          customer: {
            first_name: "Jane",
            last_name: "Smith",
            email: "jane.smith@example.com"
          },
          total: 85000, // 850.00 PHP
          currency_code: "PHP",
          status: "pending",
          payment_status: "paid",
          fulfillment_status: "not_fulfilled",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          metadata: {
            giyapay_payment: true,
            payment_reference: "GP987654321",
            payment_timestamp: new Date(Date.now() - 86400000).toISOString()
          }
        }
      ]
      
      setOrders(mockOrders)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    if (filter === 'giyapay') return order.metadata?.giyapay_payment
    if (filter === 'paid') return order.payment_status === 'paid'
    if (filter === 'pending') return order.status === 'pending'
    return true
  })

  if (loading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading>Orders</Heading>
            <Text className="text-ui-fg-subtle" size="small">
              Loading your orders...
            </Text>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Orders</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            View orders with GiyaPay payments and manage fulfillment
          </Text>
        </div>
        <div className="text-right">
          <Text size="small" className="text-ui-fg-subtle">
            Total orders: {orders?.length || 0}
          </Text>
        </div>
      </div>
      
      <div className="px-6 py-4">
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-sm ${filter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}
          >
            All Orders
          </button>
          <button
            onClick={() => setFilter('giyapay')}
            className={`px-3 py-1 rounded text-sm ${filter === 'giyapay' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}
          >
            GiyaPay Orders
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-3 py-1 rounded text-sm ${filter === 'paid' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}
          >
            Paid Orders
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded text-sm ${filter === 'pending' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}
          >
            Pending Orders
          </button>
        </div>

        {filteredOrders && filteredOrders.length > 0 ? (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Order ID</Table.HeaderCell>
                <Table.HeaderCell>Customer</Table.HeaderCell>
                <Table.HeaderCell>Amount</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Payment</Table.HeaderCell>
                <Table.HeaderCell>Fulfillment</Table.HeaderCell>
                <Table.HeaderCell>Payment Method</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredOrders.map((order: any) => (
                <Table.Row key={order.id}>
                  <Table.Cell>
                    <Text className="font-mono text-sm">
                      #{order.display_id}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <div>
                      <Text className="font-semibold">
                        {order.customer.first_name} {order.customer.last_name}
                      </Text>
                      <Text className="text-sm text-ui-fg-subtle">
                        {order.customer.email}
                      </Text>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Text className="font-semibold">
                      {formatAmount(order.total, order.currency_code)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    {getStatus(order.status)}
                  </Table.Cell>
                  <Table.Cell>
                    {getPaymentStatus(order.payment_status)}
                  </Table.Cell>
                  <Table.Cell>
                    {getFulfillmentStatus(order.fulfillment_status)}
                  </Table.Cell>
                  <Table.Cell>
                    {order.metadata?.giyapay_payment ? (
                      <div className="flex items-center gap-2">
                        <Text className="text-sm">GiyaPay</Text>
                        {order.metadata?.payment_reference && (
                          <Text className="text-xs text-ui-fg-subtle font-mono">
                            {order.metadata.payment_reference}
                          </Text>
                        )}
                      </div>
                    ) : (
                      <Text className="text-sm">Other</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Text className="text-sm">
                      {formatDate(order.created_at)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <button className="text-sm text-blue-600 hover:text-blue-800">
                        View Details
                      </button>
                      {order.fulfillment_status === 'not_fulfilled' && (
                        <button className="text-sm text-green-600 hover:text-green-800">
                          Fulfill
                        </button>
                      )}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        ) : (
          <div className="flex items-center justify-center text-center my-32 flex-col">
            <div className="mb-4">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="text-ui-fg-muted">
                <path
                  d="M2 4C2 2.89543 2.89543 2 4 2H20C21.1046 2 22 2.89543 22 4V20C22 21.1046 21.1046 22 20 22H4C2.89543 22 2 21.1046 2 20V4Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path
                  d="M7 12L10 15L17 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <Heading level="h2" className="mt-4">
              No orders found
            </Heading>
            <Text className="text-ui-fg-subtle" size="small">
              Orders with GiyaPay payments will appear here once customers start making purchases.
            </Text>
          </div>
        )}
      </div>
    </Container>
  )
} 