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
            View your automated daily payouts processed by the admin
          </Text>
        </div>
        <div className="flex items-center gap-x-2">
          <Button
            variant="secondary"
            size="small"
            onClick={() => navigate("/payouts/account")}
          >
            <PencilSquare />
            Payout Account
          </Button>
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
                <Table.HeaderCell>ID</Table.HeaderCell>
                <Table.HeaderCell>Amount</Table.HeaderCell>
                <Table.HeaderCell>Currency</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {payouts.map((payout: any) => (
                <Table.Row key={payout.id}>
                  <Table.Cell>
                    <span className="font-mono text-xs">{payout.id?.slice(-8)}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="font-medium">
                      ₱{(payout.amount / 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="2xsmall">{payout.currency?.toUpperCase()}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <StatusBadge color={getPayoutStatusColor(payout.status)}>
                      {payout.status}
                    </StatusBadge>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-ui-fg-subtle">
                      {new Date(payout.created_at).toLocaleDateString('en-PH')}
                    </span>
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
