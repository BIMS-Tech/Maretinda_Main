import React from 'react'
import { Container, Heading, StatusBadge, Table, Text } from "@medusajs/ui"
import { useGiyaPayTransactions } from "../../hooks/api/giyapay"

const getStatus = (status: string) => {
  switch (status) {
    case 'SUCCESS':
      return <StatusBadge color="green">Success</StatusBadge>
    case 'PENDING':
      return <StatusBadge color="orange">Pending</StatusBadge>
    case 'FAILED':
      return <StatusBadge color="red">Failed</StatusBadge>
    case 'CANCELLED':
      return <StatusBadge color="grey">Cancelled</StatusBadge>
    default:
      return <StatusBadge color="grey">Unknown</StatusBadge>
  }
}

const formatAmount = (amount: number, currency: string = 'PHP') => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: currency,
  }).format(amount)
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

export const GiyaPay: React.FC = () => {
  const { data, isLoading, error } = useGiyaPayTransactions()
  const transactions = data?.transactions || []

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading>GiyaPay Transactions</Heading>
            <Text className="text-ui-fg-subtle" size="small">
              Loading your transaction history...
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
          <Heading>GiyaPay Transactions</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            View your payment transactions processed through GiyaPay
          </Text>
        </div>
        <div className="text-right">
          <Text size="small" className="text-ui-fg-subtle">
            Total transactions: {transactions?.length || 0}
          </Text>
        </div>
      </div>
      
      <div className="px-6 py-4">
        {transactions && transactions.length > 0 ? (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Transaction ID</Table.HeaderCell>
                <Table.HeaderCell>Order ID</Table.HeaderCell>
                <Table.HeaderCell>Amount</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Payment Method</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Description</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {transactions.map((transaction: any) => (
                <Table.Row key={transaction.id}>
                  <Table.Cell>
                    <Text className="font-mono text-sm">
                      {transaction.reference_number}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    {transaction.order_id ? (
                      <Text className="font-mono text-sm">
                        {transaction.order_id}
                      </Text>
                    ) : (
                      <Text className="text-ui-fg-subtle">-</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Text className="font-semibold">
                      {formatAmount(transaction.amount, transaction.currency)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    {getStatus(transaction.status)}
                  </Table.Cell>
                  <Table.Cell>
                    <Text>{transaction.gateway}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text className="text-sm">
                      {formatDate(transaction.created_at)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text className="text-sm">
                      {transaction.description || '-'}
                    </Text>
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
              No transactions yet
            </Heading>
            <Text className="text-ui-fg-subtle" size="small">
              Your GiyaPay transactions will appear here once customers start making payments for your products.
            </Text>
          </div>
        )}
      </div>
    </Container>
  )
} 