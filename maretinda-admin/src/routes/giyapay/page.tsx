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

const STATUSES = ['SUCCESS', 'PENDING', 'FAILED', 'CANCELLED'];
const GATEWAYS = ['MASTERCARD/VISA', 'GCASH', 'INSTAPAY', 'UNIONPAY', 'GRAB', 'GRABPAY', 'QRPH', 'WECHATPAY'];

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
  const src = GATEWAY_LOGOS[(gateway || '').toUpperCase()];
  if (src) return (
    <div style={{ background: '#fff', borderRadius: 4, padding: '2px 6px', display: 'inline-flex', alignItems: 'center', border: '1px solid #e5e7eb' }}>
      <img src={src} alt={gateway} style={{ height: 18, width: 'auto', objectFit: 'contain' }} />
    </div>
  );
  return <span className="text-sm text-ui-fg-base">{gateway || '-'}</span>;
};
import { useGiyaPayConfig, useUpdateGiyaPayConfig, useGiyaPayTransactions, useGiyaPayMethods, useUpdateGiyaPayMethods } from "../../hooks/api/giyapay";

export const GiyaPay = () => {
  const [merchantId, setMerchantId] = useState("");
  const [merchantSecret, setMerchantSecret] = useState("");
  const [sandboxMode, setSandboxMode] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingMethods, setIsEditingMethods] = useState(false);
  const [enabledMethods, setEnabledMethods] = useState<string[]>([]);

  // Filter state (pending / committed)
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [gatewayFilter, setGatewayFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [appliedQuery, setAppliedQuery] = useState<Record<string, string | number>>({ page: 1, limit: 20 });

  const { config, isLoading: configLoading, refetch: refetchConfig } = useGiyaPayConfig();
  const { transactions, summary, count, isLoading: transactionsLoading, refetch: refetchTransactions } = useGiyaPayTransactions(appliedQuery) as any;
  const { enabledMethods: methods, isLoading: methodsLoading, refetch: refetchMethods } = useGiyaPayMethods();

  const totalPages = Math.ceil(((count as number) || 0) / 20);

  const applyFilters = () => {
    const q: Record<string, string | number> = { page: 1, limit: 20 };
    if (search.trim()) q.search = search.trim();
    if (statusFilter) q.status = statusFilter;
    if (gatewayFilter) q.gateway = gatewayFilter;
    if (dateFrom) q.date_from = dateFrom;
    if (dateTo) q.date_to = dateTo;
    setPage(1);
    setAppliedQuery(q);
  };

  const clearFilters = () => {
    setSearch(""); setStatusFilter(""); setGatewayFilter(""); setDateFrom(""); setDateTo("");
    setPage(1);
    setAppliedQuery({ page: 1, limit: 20 });
  };

  const goToPage = (p: number) => {
    setPage(p);
    setAppliedQuery(prev => ({ ...prev, page: p }));
  };

  const activeFilterCount = [appliedQuery.search, appliedQuery.status, appliedQuery.gateway, appliedQuery.date_from, appliedQuery.date_to].filter(Boolean).length;
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
                    Accept payments via InstaPay interbank fund transfer
                  </Text>
                </div>
                <div style={{ background: '#fff', borderRadius: 4, padding: '2px 6px', border: '1px solid #e5e7eb', display: 'inline-flex', alignItems: 'center' }}><img src="https://pay.giyapay.com/images/select-instapay.png" alt="InstaPay" style={{ height: 18, width: 'auto', objectFit: 'contain' }} /></div>
              </div>

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
                <div style={{ background: '#fff', borderRadius: 4, padding: '2px 6px', border: '1px solid #e5e7eb', display: 'inline-flex', alignItems: 'center' }}><img src="https://pay.giyapay.com/images/select-mastercard-visa.png" alt="Visa/Mastercard" style={{ height: 18, width: 'auto', objectFit: 'contain' }} /></div>
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
                <div style={{ background: '#fff', borderRadius: 4, padding: '2px 6px', border: '1px solid #e5e7eb', display: 'inline-flex', alignItems: 'center' }}><img src="https://pay.giyapay.com/images/select-gcash.png" alt="GCash" style={{ height: 18, width: 'auto', objectFit: 'contain' }} /></div>
              </div>

              {/* WeChat Pay */}
              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <Switch
                  id="wechatpay"
                  checked={enabledMethods.includes('WECHATPAY')}
                  onCheckedChange={() => toggleMethod('WECHATPAY')}
                  disabled={!isEditingMethods}
                />
                <div className="flex-1">
                  <Label htmlFor="wechatpay" className="font-medium">
                    WeChat Pay
                  </Label>
                  <Text className="text-ui-fg-subtle" size="small">
                    Accept payments via WeChat Pay
                  </Text>
                </div>
                <div style={{ background: '#fff', borderRadius: 4, padding: '2px 6px', border: '1px solid #e5e7eb', display: 'inline-flex', alignItems: 'center' }}><img src="https://pay.giyapay.com/images/select-wechatpay.png" alt="WeChat Pay" style={{ height: 18, width: 'auto', objectFit: 'contain' }} /></div>
              </div>

              {/* UnionPay */}
              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <Switch
                  id="unionpay"
                  checked={enabledMethods.includes('UNIONPAY')}
                  onCheckedChange={() => toggleMethod('UNIONPAY')}
                  disabled={!isEditingMethods}
                />
                <div className="flex-1">
                  <Label htmlFor="unionpay" className="font-medium">
                    UnionPay
                  </Label>
                  <Text className="text-ui-fg-subtle" size="small">
                    Accept payments via UnionPay
                  </Text>
                </div>
                <div style={{ background: '#fff', borderRadius: 4, padding: '2px 6px', border: '1px solid #e5e7eb', display: 'inline-flex', alignItems: 'center' }}><img src="https://pay.giyapay.com/images/select-unionpay.png" alt="UnionPay" style={{ height: 18, width: 'auto', objectFit: 'contain' }} /></div>
              </div>

              {/* QR Ph */}
              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <Switch
                  id="qrph"
                  checked={enabledMethods.includes('QRPH')}
                  onCheckedChange={() => toggleMethod('QRPH')}
                  disabled={!isEditingMethods}
                />
                <div className="flex-1">
                  <Label htmlFor="qrph" className="font-medium">
                    QR Ph
                  </Label>
                  <Text className="text-ui-fg-subtle" size="small">
                    Accept payments via QR Ph
                  </Text>
                </div>
                <div style={{ background: '#fff', borderRadius: 4, padding: '2px 6px', border: '1px solid #e5e7eb', display: 'inline-flex', alignItems: 'center' }}><img src="https://pay.giyapay.com/images/select-qrph.png" alt="QR Ph" style={{ height: 18, width: 'auto', objectFit: 'contain' }} /></div>
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
        <Container className="p-0 divide-y">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4">
            <Heading level="h2">Transaction History</Heading>
            <Button variant="secondary" size="small" onClick={() => refetchTransactions()} isLoading={transactionsLoading}>
              Refresh
            </Button>
          </div>

          {/* Summary bar */}
          {summary && (
            <div className="px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle px-4 py-2">
                <Text className="text-xs text-ui-fg-muted">Total</Text>
                <Text className="font-semibold text-ui-fg-base">{formatAmount(summary.total_amount)}</Text>
                <Text className="text-xs text-ui-fg-muted">{summary.total_count} transactions</Text>
              </div>
              <div className="rounded-lg border border-ui-tag-green-border bg-ui-tag-green-bg px-4 py-2">
                <Text className="text-xs text-ui-tag-green-text">Success</Text>
                <Text className="font-semibold text-ui-fg-base">{summary.success_count}</Text>
              </div>
              <div className="rounded-lg border border-ui-tag-orange-border bg-ui-tag-orange-bg px-4 py-2">
                <Text className="text-xs text-ui-tag-orange-text">Pending</Text>
                <Text className="font-semibold text-ui-fg-base">{summary.pending_count}</Text>
              </div>
              <div className="rounded-lg border border-ui-tag-red-border bg-ui-tag-red-bg px-4 py-2">
                <Text className="text-xs text-ui-tag-red-text">Failed</Text>
                <Text className="font-semibold text-ui-fg-base">{summary.failed_count}</Text>
              </div>
            </div>
          )}

          {/* Filter bar */}
          <div className="px-6 py-4 flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[180px]">
              <Input
                placeholder="Search ref # or order ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              />
            </div>

            <Select value={statusFilter || '_all'} onValueChange={(v) => setStatusFilter(v === '_all' ? '' : v)}>
              <Select.Trigger className="w-36">
                <Select.Value placeholder="All statuses" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="_all">All statuses</Select.Item>
                {STATUSES.map(s => (
                  <Select.Item key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</Select.Item>
                ))}
              </Select.Content>
            </Select>

            <Select value={gatewayFilter || '_all'} onValueChange={(v) => setGatewayFilter(v === '_all' ? '' : v)}>
              <Select.Trigger className="w-40">
                <Select.Value placeholder="All methods" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="_all">All methods</Select.Item>
                {GATEWAYS.map(g => (
                  <Select.Item key={g} value={g}>{g}</Select.Item>
                ))}
              </Select.Content>
            </Select>

            <div className="flex items-center gap-1">
              <input
                type="date"
                className="rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm text-ui-fg-base focus:outline-none focus:ring-1 focus:ring-ui-border-interactive"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <Text className="text-ui-fg-muted text-xs">to</Text>
              <input
                type="date"
                className="rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm text-ui-fg-base focus:outline-none focus:ring-1 focus:ring-ui-border-interactive"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button size="small" onClick={applyFilters}>
                Filter{activeFilterCount > 0 && ` (${activeFilterCount})`}
              </Button>
              {activeFilterCount > 0 && (
                <Button size="small" variant="secondary" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="px-6 py-4">
            {transactionsLoading ? (
              <div className="space-y-2">
                {[1,2,3,4,5].map(i => <div key={i} className="h-10 rounded bg-ui-bg-subtle animate-pulse" />)}
              </div>
            ) : transactions && transactions.length > 0 ? (
              <>
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
                        <Table.Cell><span className="font-mono text-sm">{transaction.reference_number || '-'}</span></Table.Cell>
                        <Table.Cell><span className="font-mono text-sm">{transaction.order_id || '-'}</span></Table.Cell>
                        <Table.Cell><span className="font-semibold">{formatAmount(transaction.amount, transaction.currency)}</span></Table.Cell>
                        <Table.Cell>{getStatusBadge(transaction.status)}</Table.Cell>
                        <Table.Cell><GatewayLogo gateway={transaction.gateway} /></Table.Cell>
                        <Table.Cell>{formatDate(transaction.created_at)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <Text className="text-xs text-ui-fg-muted">
                      Page {page} of {totalPages} · {count} total
                    </Text>
                    <div className="flex gap-2">
                      <Button size="small" variant="secondary" onClick={() => goToPage(page - 1)} disabled={page <= 1}>Previous</Button>
                      <Button size="small" variant="secondary" onClick={() => goToPage(page + 1)} disabled={page >= totalPages}>Next</Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Text className="text-ui-fg-subtle">
                  {activeFilterCount > 0
                    ? 'No transactions match your filters. Try adjusting or clearing them.'
                    : 'No transactions found. Configure GiyaPay and start processing payments.'}
                </Text>
                {activeFilterCount > 0 && (
                  <Button size="small" variant="secondary" className="mt-3" onClick={clearFilters}>Clear filters</Button>
                )}
              </div>
            )}
          </div>
        </Container>
      </div>
    </Container>
  );
};





