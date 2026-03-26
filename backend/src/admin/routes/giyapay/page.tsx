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
  Select,
  toast,
} from "@medusajs/ui";
import { useState, useEffect } from "react";

// Mock hooks - replace with actual API calls
const useGiyaPayConfig = () => {
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const refetch = async () => {
    try {
      const response = await fetch('/admin/giyapay');
      const data = await response.json();
      setConfig(data.config);
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return { config, isLoading, refetch };
};

const useUpdateGiyaPayConfig = () => {
  const [isPending, setIsPending] = useState(false);
  
  const mutateAsync = async (data: any) => {
    setIsPending(true);
    try {
      const response = await fetch('/admin/giyapay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
};

const useGiyaPayMethods = () => {
  const [methods, setMethods] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const refetch = async () => {
    try {
      const response = await fetch('/admin/giyapay/payment-methods');
      const data = await response.json();
      setMethods(data.enabledMethods || []);
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return { methods, isLoading, refetch };
};

const useUpdateGiyaPayMethods = () => {
  const [isPending, setIsPending] = useState(false);
  
  const mutateAsync = async (enabledMethods: string[]) => {
    setIsPending(true);
    try {
      const response = await fetch('/admin/giyapay/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabledMethods })
      });
      return await response.json();
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
};

const STATUSES = ['SUCCESS', 'PENDING', 'FAILED', 'CANCELLED'];
const GATEWAYS = ['MASTERCARD/VISA', 'GCASH', 'INSTAPAY', 'PAYMAYA', 'UNIONPAY', 'GRAB', 'GRABPAY', 'QRPH', 'WECHATPAY'];

const GATEWAY_LOGOS: Record<string, string> = {
  'MASTERCARD/VISA': 'https://pay.giyapay.com/images/select-mastercard-visa.png',
  'VISA':            'https://pay.giyapay.com/images/select-mastercard-visa.png',
  'MASTERCARD':      'https://pay.giyapay.com/images/select-mastercard-visa.png',
  'GCASH':           'https://pay.giyapay.com/images/select-gcash.png',
  'QRPH':            'https://pay.giyapay.com/images/select-qrph.png',
  'UNIONPAY':        'https://pay.giyapay.com/images/select-unionpay.png',
  'WECHATPAY':       'https://pay.giyapay.com/images/select-wechatpay.png',
  'GRAB':            'https://pay.giyapay.com/images/select-grabpay.png',
  'GRABPAY':         'https://pay.giyapay.com/images/select-grabpay.png',
};

const GatewayLogo = ({ gateway }: { gateway: string }) => {
  const key = (gateway || '').toUpperCase();
  const src = GATEWAY_LOGOS[key];
  if (src) {
    return <img src={src} alt={gateway} style={{ height: 24, width: 'auto', objectFit: 'contain' }} />;
  }
  return <span>{gateway || '-'}</span>;
};

const useGiyaPayTransactions = (filters: Record<string, string> = {}) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      );
      const response = await fetch(`/admin/giyapay/transactions?${params.toString()}`);
      const data = await response.json();
      setTransactions(data.transactions || []);
      setSummary(data.summary || null);
      setCount(data.count || 0);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { refetch(); }, [JSON.stringify(filters)]);

  return { transactions, summary, count, isLoading, refetch };
};

const GiyaPayConfigPage = () => {
  const [merchantId, setMerchantId] = useState("");
  const [merchantSecret, setMerchantSecret] = useState("");
  const [sandboxMode, setSandboxMode] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingMethods, setIsEditingMethods] = useState(false);
  const [enabledMethods, setEnabledMethods] = useState<string[]>([]);

  // Transaction filters
  const [txSearch, setTxSearch] = useState("");
  const [txStatus, setTxStatus] = useState("");
  const [txGateway, setTxGateway] = useState("");
  const [txDateFrom, setTxDateFrom] = useState("");
  const [txDateTo, setTxDateTo] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});

  const applyTxFilters = () => {
    const f: Record<string, string> = {};
    if (txSearch.trim()) f.search = txSearch.trim();
    if (txStatus) f.status = txStatus;
    if (txGateway) f.gateway = txGateway;
    if (txDateFrom) f.date_from = txDateFrom;
    if (txDateTo) f.date_to = txDateTo;
    setAppliedFilters(f);
  };

  const clearTxFilters = () => {
    setTxSearch(""); setTxStatus(""); setTxGateway("");
    setTxDateFrom(""); setTxDateTo("");
    setAppliedFilters({});
  };

  const activeFilterCount = Object.keys(appliedFilters).length;

  const { config, isLoading: configLoading, refetch: refetchConfig } = useGiyaPayConfig();
  const { transactions, summary: txSummary, count: txCount, isLoading: transactionsLoading, refetch: refetchTransactions } = useGiyaPayTransactions(appliedFilters);
  const { methods, isLoading: methodsLoading, refetch: refetchMethods } = useGiyaPayMethods();
  const { mutateAsync: updateConfig, isPending: isUpdating } = useUpdateGiyaPayConfig();
  const { mutateAsync: updateMethods, isPending: isUpdatingMethods } = useUpdateGiyaPayMethods();

  useEffect(() => {
    if (config) {
      setMerchantId(config.merchantId || "");
      setMerchantSecret(config.merchantSecret || "");
      setSandboxMode(config.sandboxMode ?? false);
      setIsEnabled(config.isEnabled ?? true);
    }
  }, [config]);

  useEffect(() => {
    if (methods) {
      setEnabledMethods(methods);
    }
  }, [methods]);

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

  const handleSaveMethods = async () => {
    try {
      await updateMethods(enabledMethods);
      toast.success("Payment methods updated successfully!");
      setIsEditingMethods(false);
      refetchMethods();
    } catch (error) {
      toast.error("Failed to update payment methods");
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
    }).format(amount); // Amount is already in pesos
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

              {isEditingMethods && (
                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={handleSaveMethods}
                    isLoading={isUpdatingMethods}
                    disabled={enabledMethods.length === 0}
                  >
                    Save Payment Methods
                  </Button>
                  <Text className="text-ui-fg-subtle text-sm self-center">
                    {enabledMethods.length === 0 && "Select at least one payment method"}
                  </Text>
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
            <div>
              <Heading level="h2">Transaction History</Heading>
              <Text className="text-ui-fg-subtle" size="small">
                All GiyaPay transactions across the marketplace.
              </Text>
            </div>
            <Button variant="secondary" onClick={() => refetchTransactions()} isLoading={transactionsLoading}>
              Refresh
            </Button>
          </div>

          {/* Summary */}
          {txSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="rounded-lg border px-4 py-2 bg-ui-bg-subtle">
                <Text className="text-xs text-ui-fg-muted">Total</Text>
                <Text className="font-semibold">{formatAmount(txSummary.total_amount)}</Text>
                <Text className="text-xs text-ui-fg-muted">{txSummary.total_count} transactions</Text>
              </div>
              <div className="rounded-lg border px-4 py-2 bg-green-50">
                <Text className="text-xs text-green-700">Success</Text>
                <Text className="font-semibold">{txSummary.success_count}</Text>
              </div>
              <div className="rounded-lg border px-4 py-2 bg-orange-50">
                <Text className="text-xs text-orange-700">Pending</Text>
                <Text className="font-semibold">{txSummary.pending_count}</Text>
              </div>
              <div className="rounded-lg border px-4 py-2 bg-red-50">
                <Text className="text-xs text-red-700">Failed</Text>
                <Text className="font-semibold">{txSummary.failed_count}</Text>
              </div>
            </div>
          )}

          {/* Filter bar */}
          <div className="flex flex-wrap gap-2 items-end mb-4">
            <Input
              placeholder="Search ref # / order ID / vendor"
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyTxFilters()}
              className="flex-1 min-w-[200px]"
            />

            <Select value={txStatus || '_all'} onValueChange={(v) => setTxStatus(v === '_all' ? '' : v)}>
              <Select.Trigger className="w-36">
                <Select.Value placeholder="All statuses" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="_all">All statuses</Select.Item>
                {STATUSES.map((s) => (
                  <Select.Item key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</Select.Item>
                ))}
              </Select.Content>
            </Select>

            <Select value={txGateway || '_all'} onValueChange={(v) => setTxGateway(v === '_all' ? '' : v)}>
              <Select.Trigger className="w-40">
                <Select.Value placeholder="All methods" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="_all">All methods</Select.Item>
                {GATEWAYS.map((g) => (
                  <Select.Item key={g} value={g}>{g}</Select.Item>
                ))}
              </Select.Content>
            </Select>

            <div className="flex items-center gap-1">
              <input
                type="date"
                className="rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm focus:outline-none"
                value={txDateFrom}
                onChange={(e) => setTxDateFrom(e.target.value)}
              />
              <Text className="text-ui-fg-muted text-xs">to</Text>
              <input
                type="date"
                className="rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm focus:outline-none"
                value={txDateTo}
                onChange={(e) => setTxDateTo(e.target.value)}
              />
            </div>

            <Button size="small" onClick={applyTxFilters}>
              Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
            {activeFilterCount > 0 && (
              <Button size="small" variant="secondary" onClick={clearTxFilters}>
                Clear
              </Button>
            )}
          </div>

          {transactionsLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-10 rounded bg-ui-bg-subtle animate-pulse" />)}
            </div>
          ) : transactions && transactions.length > 0 ? (
            <>
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
                      <Table.Cell>{transaction.vendor_name || '-'}</Table.Cell>
                      <Table.Cell>{formatAmount(transaction.amount, transaction.currency)}</Table.Cell>
                      <Table.Cell>{getStatusBadge(transaction.status)}</Table.Cell>
                      <Table.Cell><GatewayLogo gateway={transaction.gateway} /></Table.Cell>
                      <Table.Cell>{formatDate(transaction.created_at)}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
              {txCount > 20 && (
                <Text className="text-xs text-ui-fg-muted mt-2">
                  Showing {transactions.length} of {txCount} transactions
                </Text>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Text className="text-ui-fg-subtle">
                {activeFilterCount > 0
                  ? 'No transactions match the current filters.'
                  : 'No transactions found.'}
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









