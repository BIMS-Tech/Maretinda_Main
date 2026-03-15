import { Container, Heading, Text, Button, Badge, StatusBadge, Table } from "@medusajs/ui"
import { PencilSquare, Plus, CurrencyDollar } from "@medusajs/icons"
import { useNavigate } from "react-router-dom"
import { usePayouts, usePayoutAccount } from "../../../hooks/api/payouts"

export const PayoutsList = () => {
  const navigate = useNavigate()
  const { payouts, isPending: payoutsLoading, count } = usePayouts()
  const { payout_account, isPending: accountLoading } = usePayoutAccount()

  // Debug payout account status
  console.log("🔍 Current payout account:", {
    payout_account,
    accountLoading,
    status: payout_account?.status
  })

  const getPayoutStatusColor = (status: string): "green" | "orange" | "red" | "blue" | "grey" => {
    switch (status) {
      case "paid":
        return "green"
      case "pending":
        return "orange"
      case "failed":
        return "red"
      case "processing":
        return "blue"
      default:
        return "grey"
    }
  }

  const getAccountStatusColor = (status: string): "green" | "orange" | "red" | "blue" | "grey" => {
    switch (status) {
      case "active":
        return "green"
      case "pending":
        return "orange"
      case "restricted":
        return "red"
      default:
        return "grey"
    }
  }

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Payout History</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Automated payouts via DFT • T+1 settlement • {payouts.length} total payouts
          </Text>
        </div>
        <div className="flex items-center gap-x-2">
          <Button
            variant="secondary"
            size="small"
            onClick={() => navigate("/payouts/account")}
          >
            <PencilSquare />
            Bank Setup
          </Button>
        </div>
      </div>

      {/* Payout Summary */}
      <div className="px-6 py-4 bg-ui-bg-subtle">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <Text size="small" className="text-ui-fg-subtle">Total Paid Out</Text>
            <Text size="large" weight="plus" className="text-green-600">
              ₱{payouts
                .filter(p => p.status === 'completed' || p.status === 'paid')
                .reduce((sum, p) => sum + (p.amount / 100), 0)
                .toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </Text>
          </div>
          <div className="flex flex-col gap-1">
            <Text size="small" className="text-ui-fg-subtle">Processing</Text>
            <Text size="large" weight="plus" className="text-blue-600">
              ₱{payouts
                .filter(p => p.status === 'processing')
                .reduce((sum, p) => sum + (p.amount / 100), 0)
                .toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </Text>
          </div>
          <div className="flex flex-col gap-1">
            <Text size="small" className="text-ui-fg-subtle">Total Orders</Text>
            <Text size="large" weight="plus">
              {payouts.reduce((sum, p) => sum + (p.metadata?.order_count || 0), 0)}
            </Text>
          </div>
          <div className="flex flex-col gap-1">
            <Text size="small" className="text-ui-fg-subtle">Account Status</Text>
            <div className="flex items-center gap-2">
              <StatusBadge color={getAccountStatusColor(payout_account?.status || 'inactive')}>
                {payout_account?.status === 'active' ? 'Ready' : 
                 payout_account?.status === 'pending' ? 'Pending' : 'Setup Required'}
              </StatusBadge>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Account Status */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ui-bg-component">
              <CurrencyDollar className="text-ui-fg-subtle" />
            </div>
            <div>
              <Text weight="plus" size="small">
                Payout Account Status
              </Text>
              <Text className="text-ui-fg-subtle" size="xsmall">
                {payout_account ? "Connected" : "Not connected"}
              </Text>
            </div>
          </div>
          <div className="flex items-center gap-x-2">
            {payout_account && typeof payout_account === 'object' && payout_account.status ? (
              <StatusBadge color={getAccountStatusColor(payout_account.status)}>
                {payout_account.status}
              </StatusBadge>
            ) : (
              <StatusBadge color="red">Not Connected</StatusBadge>
            )}
          </div>
        </div>
        
        {(!payout_account || typeof payout_account !== 'object') && (
          <div className="mt-4 p-4 bg-ui-bg-subtle rounded-lg">
            <Text size="small" className="text-ui-fg-subtle">
              You need to set up a payout account to receive automated daily payouts. 
              This account will be used to receive your vendor earnings.
            </Text>
            <Button
              variant="primary"
              size="small"
              className="mt-3"
              onClick={() => navigate("/payouts/account")}
            >
              Set Up Payout Account
            </Button>
          </div>
        )}

        {payout_account && typeof payout_account === 'object' && payout_account.status !== "active" && (
          <div className="mt-4 p-4 bg-ui-bg-subtle rounded-lg">
            <Text size="small" className="text-ui-fg-subtle">
              Your payout account is not active yet. Please complete the setup process 
              to receive automated daily payouts.
            </Text>
          </div>
        )}

        {payout_account && typeof payout_account === 'object' && payout_account.status === "active" && (
          <div className="mt-4 p-4 bg-ui-bg-subtle rounded-lg">
            <Text size="small" className="text-ui-fg-subtle">
              ✅ Your payout account is active. Daily payouts are automatically processed by the admin 
              and credited to your account based on the T+2 settlement schedule.
            </Text>
          </div>
        )}
      </div>

      {/* Payouts Table */}
      <div className="px-6 py-4">
        {payoutsLoading || accountLoading ? (
          <div className="text-center py-12">
            <Text className="text-ui-fg-subtle">Loading payouts...</Text>
          </div>
        ) : !payouts || payouts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-ui-fg-muted">
              <p className="text-lg font-medium mb-2">No payouts yet</p>
              <p className="text-sm mb-4">
                Payouts are automatically processed daily by the admin once you have sales
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Reference</Table.HeaderCell>
                <Table.HeaderCell>Amount</Table.HeaderCell>
                <Table.HeaderCell>Details</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {payouts.map((payout: any) => (
                <Table.Row key={payout.id}>
                  <Table.Cell>
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-xs font-medium">
                        {payout.metadata?.reference || payout.id?.slice(-8)}
                      </span>
                      <span className="text-xs text-ui-fg-subtle">
                        {payout.metadata?.processing_type === 'automated_weekly' ? 'Weekly Batch' : 
                         payout.metadata?.processing_type === 'automated_daily' ? 'Daily Batch' : 
                         'Manual'}
                      </span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">
                        ₱{(payout.amount / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>
                      <Badge size="2xsmall" className="w-fit">{payout.currency?.toUpperCase()}</Badge>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col gap-1 text-xs">
                      {payout.metadata?.order_count > 0 && (
                        <span className="text-ui-fg-subtle">
                          {payout.metadata.order_count} order{payout.metadata.order_count !== 1 ? 's' : ''}
                        </span>
                      )}
                      {payout.metadata?.gross_amount && (
                        <span className="text-ui-fg-subtle">
                          Gross: ₱{(payout.metadata.gross_amount / 100).toFixed(2)}
                        </span>
                      )}
                      {payout.metadata?.platform_fee && (
                        <span className="text-ui-fg-subtle">
                          Fee: ₱{(payout.metadata.platform_fee / 100).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <StatusBadge color={getPayoutStatusColor(payout.status)}>
                      {payout.status === 'completed' ? 'Paid' : 
                       payout.status === 'processing' ? 'Processing' : 
                       payout.status}
                    </StatusBadge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col gap-1">
                      <span className="text-ui-fg-subtle text-sm">
                        {new Date(payout.created_at).toLocaleDateString('en-PH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      {payout.metadata?.week_start && (
                        <span className="text-xs text-ui-fg-muted">
                          Week of {new Date(payout.metadata.week_start).toLocaleDateString('en-PH', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      )}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>
    </Container>
  )
}
