import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  StatusBadge,
  Table,
  Text,
  Switch,
  toast,
} from "@medusajs/ui";
import { useState, useEffect } from "react";
import { useGiyaPayConfig, useUpdateGiyaPayConfig, useGiyaPayTransactions } from "../../hooks/api/giyapay";

const GiyaPayConfigPage = () => {
  const [merchantId, setMerchantId] = useState("");
  const [merchantSecret, setMerchantSecret] = useState("");
  const [sandboxMode, setSandboxMode] = useState(false); // Default to live mode
  const [isEnabled, setIsEnabled] = useState(true); // Always enabled
  const [isEditing, setIsEditing] = useState(false);

  const { config, isLoading: configLoading, refetch: refetchConfig } = useGiyaPayConfig();
  const { transactions, isLoading: transactionsLoading, refetch: refetchTransactions } = useGiyaPayTransactions();
  const { mutateAsync: updateConfig, isPending: isUpdating } = useUpdateGiyaPayConfig();

  useEffect(() => {
    if (config) {
      setMerchantId(config.merchantId || "");
      setMerchantSecret(config.merchantSecret || "");
      setSandboxMode(config.sandboxMode ?? false); // Respect saved value or default to false
      setIsEnabled(config.isEnabled ?? true); // Always enabled
    }
  }, [config]);

  const handleSave = async () => {
    try {
      await updateConfig({
        merchantId,
        merchantSecret,
        sandboxMode,
        isEnabled,
      });
      toast.success("GiyaPay configuration updated successfully!");
      setIsEditing(false);
      refetchConfig();
    } catch (error) {
      toast.error("Failed to update configuration");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <StatusBadge color="green">Success</StatusBadge>;
      case 'PENDING':
        return <StatusBadge color="orange">Pending</StatusBadge>;
      case 'FAILED':
        return <StatusBadge color="red">Failed</StatusBadge>;
      case 'CANCELLED':
        return <StatusBadge color="grey">Cancelled</StatusBadge>;
      default:
        return <StatusBadge color="grey">Unknown</StatusBadge>;
    }
  };

  const formatAmount = (amount: number, currency: string = 'PHP') => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (configLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading>GiyaPay Configuration</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Configure GiyaPay payment gateway settings and view transaction history
          </Text>
        </div>
      </div>

      {/* Configuration Section */}
      <div className="mb-8">
        <Container className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Heading level="h2">Payment Gateway Settings</Heading>
            <Button
              variant={isEditing ? "secondary" : "primary"}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Cancel" : "Edit"}
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="merchantId">Merchant ID</Label>
              <Input
                id="merchantId"
                type="text"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                disabled={!isEditing}
                placeholder="Enter your GiyaPay Merchant ID"
              />
            </div>

            <div>
              <Label htmlFor="merchantSecret">Merchant Secret</Label>
              <Input
                id="merchantSecret"
                type="password"
                value={merchantSecret}
                onChange={(e) => setMerchantSecret(e.target.value)}
                disabled={!isEditing}
                placeholder="Enter your GiyaPay Merchant Secret"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="sandboxMode"
                checked={sandboxMode}
                onCheckedChange={setSandboxMode}
                disabled={!isEditing}
              />
              <Label htmlFor="sandboxMode">Sandbox Mode</Label>
              <Text className="text-ui-fg-subtle" size="small">
                {sandboxMode ? "Currently using sandbox environment for testing" : "Currently using live environment for production"}
              </Text>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isEnabled"
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
                disabled={!isEditing}
              />
              <Label htmlFor="isEnabled">Enable GiyaPay</Label>
              <Text className="text-ui-fg-subtle" size="small">
                {isEnabled ? "GiyaPay is enabled and will be available at checkout" : "GiyaPay is disabled and will not be available"}
              </Text>
            </div>

            {isEditing && (
              <div className="flex space-x-2">
                <Button
                  onClick={handleSave}
                  isLoading={isUpdating}
                  disabled={!merchantId || !merchantSecret}
                >
                  Save Configuration
                </Button>
              </div>
            )}
          </div>
        </Container>
      </div>

      {/* Transactions Section */}
      <div>
        <Container className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Heading level="h2">Transaction History</Heading>
            <Button
              variant="secondary"
              onClick={() => refetchTransactions()}
              isLoading={transactionsLoading}
            >
              Refresh
            </Button>
          </div>

          {transactionsLoading ? (
            <div>Loading transactions...</div>
          ) : transactions && transactions.length > 0 ? (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Transaction Ref</Table.HeaderCell>
                  <Table.HeaderCell>Order ID</Table.HeaderCell>
                  
                  <Table.HeaderCell>Vendor</Table.HeaderCell>
                  <Table.HeaderCell>Amount</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell>Payment Method</Table.HeaderCell>
                  <Table.HeaderCell>Date</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {transactions.map((transaction: any) => (
                  <Table.Row key={transaction.id}>
                    <Table.Cell>{transaction.reference_number || '-'}</Table.Cell>
                    <Table.Cell>{transaction.order_id || '-'}</Table.Cell>
                    
                    <Table.Cell>
                      {transaction.vendor_name ? (
                        <Text>{transaction.vendor_name}</Text>
                      ) : (
                        <Text className="text-ui-fg-subtle">-</Text>
                      )}
                    </Table.Cell>
                    <Table.Cell>{formatAmount(transaction.amount, transaction.currency)}</Table.Cell>
                    <Table.Cell>{getStatusBadge(transaction.status)}</Table.Cell>
                    <Table.Cell>{transaction.gateway}</Table.Cell>
                    <Table.Cell>{formatDate(transaction.created_at)}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Text className="text-ui-fg-subtle">
                No transactions found. Configure GiyaPay and start processing payments.
              </Text>
            </div>
          )}
        </Container>
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "GiyaPay",
});

export default GiyaPayConfigPage; 