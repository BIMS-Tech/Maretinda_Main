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
import { useGiyaPayConfig, useUpdateGiyaPayConfig, useGiyaPayTransactions, useGiyaPayMethods, useUpdateGiyaPayMethods } from "../../hooks/api/giyapay";

export const GiyaPay = () => {
  const [merchantId, setMerchantId] = useState("");
  const [merchantSecret, setMerchantSecret] = useState("");
  const [sandboxMode, setSandboxMode] = useState(false); // Default to live mode
  const [isEnabled, setIsEnabled] = useState(true); // Always enabled
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingMethods, setIsEditingMethods] = useState(false);
  const [enabledMethods, setEnabledMethods] = useState<string[]>([]);

  const { config, isLoading: configLoading, refetch: refetchConfig } = useGiyaPayConfig();
  const { transactions, isLoading: transactionsLoading, refetch: refetchTransactions } = useGiyaPayTransactions();
  const { enabledMethods: methods, isLoading: methodsLoading, refetch: refetchMethods } = useGiyaPayMethods();
  const { mutateAsync: updateConfig, isPending: isUpdating } = useUpdateGiyaPayConfig();
  const { mutateAsync: updateMethods, isPending: isUpdatingMethods } = useUpdateGiyaPayMethods();

  useEffect(() => {
    if (config) {
      setMerchantId(config.merchantId || "");
      setMerchantSecret(config.merchantSecret || "");
      setSandboxMode(config.sandboxMode ?? false); // Respect saved value or default to false
      setIsEnabled(config.isEnabled ?? true); // Always enabled
    }
  }, [config]);

  useEffect(() => {
    if (methods) {
      setEnabledMethods(methods);
    }
  }, [methods]);

  const handleSave = async () => {
    try {
      const result = await updateConfig({
        merchantId,
        merchantSecret,
        sandboxMode,
        isEnabled,
      });
      console.log('[GiyaPay Admin] Config update result:', result);
      toast.success("GiyaPay configuration updated successfully!");
      setIsEditing(false);
      refetchConfig();
    } catch (error) {
      console.error('[GiyaPay Admin] Config update error:', error);
      toast.error(`Failed to update configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSaveMethods = async () => {
    try {
      const result = await updateMethods({ enabledMethods });
      console.log('[GiyaPay Admin] Methods update result:', result);
      toast.success("Payment methods updated successfully!");
      setIsEditingMethods(false);
      refetchMethods();
    } catch (error) {
      console.error('[GiyaPay Admin] Methods update error:', error);
      toast.error(`Failed to update payment methods: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const toggleMethod = (method: string) => {
    setEnabledMethods(prev => 
      prev.includes(method)
        ? prev.filter(m => m !== method)
        : [...prev, method]
    );
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
    return (
      <div className="flex items-center justify-center h-screen">
        <Text>Loading GiyaPay configuration...</Text>
      </div>
    );
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

      {/* Payment Methods Section */}
      <div className="mb-8">
        <Container className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Heading level="h2">Payment Methods</Heading>
              <Text className="text-ui-fg-subtle" size="small">
                Select which GiyaPay payment methods to enable on checkout
              </Text>
            </div>
            <Button
              variant={isEditingMethods ? "secondary" : "primary"}
              onClick={() => setIsEditingMethods(!isEditingMethods)}
            >
              {isEditingMethods ? "Cancel" : "Edit"}
            </Button>
          </div>

          {methodsLoading ? (
            <div>Loading payment methods...</div>
          ) : (
            <div className="space-y-4">
              {/* Visa/Mastercard */}
              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <Switch
                  id="visa-mastercard"
                  checked={enabledMethods.includes('MASTERCARD/VISA')}
                  onCheckedChange={() => toggleMethod('MASTERCARD/VISA')}
                  disabled={!isEditingMethods}
                />
                <div className="flex-1">
                  <Label htmlFor="visa-mastercard" className="font-medium">
                    Visa & Mastercard
                  </Label>
                  <Text className="text-ui-fg-subtle" size="small">
                    Accept payments via credit and debit cards
                  </Text>
                </div>
                <div className="flex gap-2">
                  <div className="w-12 h-8 flex items-center justify-center bg-blue-600 rounded text-white text-xs font-bold">
                    VISA
                  </div>
                  <div className="w-12 h-8 flex items-center justify-center bg-red-600 rounded text-white text-xs font-bold">
                    MC
                  </div>
                </div>
              </div>

              {/* GCash */}
              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <Switch
                  id="gcash"
                  checked={enabledMethods.includes('GCASH')}
                  onCheckedChange={() => toggleMethod('GCASH')}
                  disabled={!isEditingMethods}
                />
                <div className="flex-1">
                  <Label htmlFor="gcash" className="font-medium">
                    GCash
                  </Label>
                  <Text className="text-ui-fg-subtle" size="small">
                    Accept payments via GCash e-wallet
                  </Text>
                </div>
                <div className="w-12 h-8 flex items-center justify-center bg-blue-500 rounded text-white text-xs font-bold">
                  G
                </div>
              </div>

              {/* InstaPay */}
              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <Switch
                  id="instapay"
                  checked={enabledMethods.includes('INSTAPAY')}
                  onCheckedChange={() => toggleMethod('INSTAPAY')}
                  disabled={!isEditingMethods}
                />
                <div className="flex-1">
                  <Label htmlFor="instapay" className="font-medium">
                    InstaPay
                  </Label>
                  <Text className="text-ui-fg-subtle" size="small">
                    Accept payments via InstaPay bank transfers
                  </Text>
                </div>
                <div className="w-12 h-8 flex items-center justify-center bg-green-600 rounded text-white text-xs font-bold">
                  IP
                </div>
              </div>

              {/* PayMaya */}
              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <Switch
                  id="paymaya"
                  checked={enabledMethods.includes('PAYMAYA')}
                  onCheckedChange={() => toggleMethod('PAYMAYA')}
                  disabled={!isEditingMethods}
                />
                <div className="flex-1">
                  <Label htmlFor="paymaya" className="font-medium">
                    PayMaya
                  </Label>
                  <Text className="text-ui-fg-subtle" size="small">
                    Accept payments via PayMaya e-wallet
                  </Text>
                </div>
                <div className="w-12 h-8 flex items-center justify-center bg-green-500 rounded text-white text-xs font-bold">
                  PM
                </div>
              </div>

              {isEditingMethods && (
                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={handleSaveMethods}
                    isLoading={isUpdatingMethods}
                    disabled={enabledMethods.length === 0}
                  >
                    Save Payment Methods
                  </Button>
                  {enabledMethods.length === 0 && (
                    <Text className="text-ui-fg-subtle text-sm self-center">
                      Select at least one payment method
                    </Text>
                  )}
                </div>
              )}
            </div>
          )}
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





