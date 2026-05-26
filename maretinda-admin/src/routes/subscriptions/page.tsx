import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  StatusBadge,
  Table,
  Text,
  Switch,
  toast,
} from "@medusajs/ui"
import { useState, useEffect } from "react"
import {
  useAdminSubscriptions,
  useUpdateSubscriptionStatus,
  useAdminAssignSubscription,
  useSubscriptionGiyaPayConfig,
  useUpdateSubscriptionGiyaPayConfig,
} from "../../hooks/api/subscriptions"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function statusColor(status: string): "green" | "red" | "grey" | "orange" {
  if (status === "active") return "green"
  if (status === "expired") return "red"
  if (status === "cancelled") return "grey"
  return "orange"
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff <= 0) return "Expired"
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Today"
  return `${days}d`
}

// ---------------------------------------------------------------------------
// GiyaPay Subscription Config section
// ---------------------------------------------------------------------------
function SubscriptionPaymentConfig() {
  const { config, isLoading } = useSubscriptionGiyaPayConfig()
  const update = useUpdateSubscriptionGiyaPayConfig()

  const [merchantId, setMerchantId] = useState("")
  const [merchantSecret, setMerchantSecret] = useState("")
  const [sandboxMode, setSandboxMode] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (config) {
      setMerchantId(config.merchant_id || "")
      setSandboxMode(config.sandbox_mode)
      setIsEnabled(config.is_enabled)
    }
  }, [config])

  const handleSave = async () => {
    if (!merchantId || !merchantSecret) {
      toast.error("Merchant ID and Secret are required")
      return
    }
    try {
      await update.mutateAsync({ merchantId, merchantSecret, sandboxMode, isEnabled })
      toast.success("Subscription payment config saved")
      setEditing(false)
      setMerchantSecret("")
    } catch (err: any) {
      toast.error(err?.message || "Failed to save config")
    }
  }

  return (
    <Container className="divide-y divide-ui-border-base p-0 mt-6">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Subscription Payment Gateway</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            GiyaPay credentials used specifically for vendor subscription payments.
          </Text>
        </div>
        {!editing && (
          <Button variant="secondary" size="small" onClick={() => setEditing(true)}>
            {config ? "Edit" : "Configure"}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="px-6 py-4 text-sm text-ui-fg-subtle">Loading…</div>
      ) : editing ? (
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="sub-merchant-id">Merchant ID</Label>
              <Input
                id="sub-merchant-id"
                placeholder="Enter Merchant ID"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="sub-merchant-secret">Merchant Secret</Label>
              <Input
                id="sub-merchant-secret"
                type="password"
                placeholder="Enter new secret (leave blank to keep existing)"
                value={merchantSecret}
                onChange={(e) => setMerchantSecret(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={sandboxMode} onCheckedChange={setSandboxMode} id="sub-sandbox" />
              <Label htmlFor="sub-sandbox">Sandbox Mode</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isEnabled} onCheckedChange={setIsEnabled} id="sub-enabled" />
              <Label htmlFor="sub-enabled">Enabled</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} isLoading={update.isPending} size="small">
              Save Config
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={() => { setEditing(false); setMerchantSecret("") }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : config ? (
        <div className="px-6 py-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <p className="text-ui-fg-subtle text-xs">Merchant ID</p>
            <p className="font-medium">{config.merchant_id.substring(0, 8)}…</p>
          </div>
          <div>
            <p className="text-ui-fg-subtle text-xs">Sandbox</p>
            <p className="font-medium">{config.sandbox_mode ? "Yes" : "No"}</p>
          </div>
          <div>
            <p className="text-ui-fg-subtle text-xs">Status</p>
            <StatusBadge color={config.is_enabled ? "green" : "grey"}>
              {config.is_enabled ? "Enabled" : "Disabled"}
            </StatusBadge>
          </div>
        </div>
      ) : (
        <div className="px-6 py-4 text-sm text-ui-fg-subtle">
          No subscription payment config set. Click Configure to add one.
        </div>
      )}
    </Container>
  )
}

// ---------------------------------------------------------------------------
// Manual assign modal
// ---------------------------------------------------------------------------
function AssignModal({ onClose }: { onClose: () => void }) {
  const assign = useAdminAssignSubscription()
  const [vendorId, setVendorId] = useState("")
  const [planName, setPlanName] = useState("Foundation")
  const [durationDays, setDurationDays] = useState(30)

  const handleSubmit = async () => {
    if (!vendorId) { toast.error("Vendor ID is required"); return }
    try {
      await assign.mutateAsync({ vendor_id: vendorId, plan_name: planName, duration_days: durationDays })
      toast.success("Subscription assigned")
      onClose()
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign subscription")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <Heading level="h2" className="mb-4">Manually Assign Subscription</Heading>
        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="assign-vid">Vendor ID (seller_…)</Label>
            <Input id="assign-vid" value={vendorId} onChange={(e) => setVendorId(e.target.value)} placeholder="seller_..." />
          </div>
          <div>
            <Label htmlFor="assign-plan">Plan</Label>
            <Select value={planName} onValueChange={setPlanName}>
              <Select.Trigger id="assign-plan">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                {["Foundation", "Boost", "Managed"].map((p) => (
                  <Select.Item key={p} value={p}>{p}</Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
          <div>
            <Label htmlFor="assign-days">Duration (days)</Label>
            <Input
              id="assign-days"
              type="number"
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              min={1}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <Button onClick={handleSubmit} isLoading={assign.isPending} size="small">Assign</Button>
          <Button variant="secondary" size="small" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const STATUS_OPTIONS = ["", "active", "expired", "cancelled"]

export const SubscriptionsPage = () => {
  const [statusFilter, setStatusFilter] = useState("")
  const [vendorSearch, setVendorSearch] = useState("")
  const [page, setPage] = useState(0)
  const [showAssign, setShowAssign] = useState(false)
  const [appliedVendorId, setAppliedVendorId] = useState("")
  const limit = 20

  const { data, isLoading, refetch } = useAdminSubscriptions({
    status: statusFilter || undefined,
    vendor_id: appliedVendorId || undefined,
    limit,
    offset: page * limit,
  })
  const updateStatus = useUpdateSubscriptionStatus()

  const subscriptions = data?.subscriptions || []
  const total = data?.count || 0

  const handleToggle = async (id: string, current: string) => {
    const newStatus = current === "active" ? "cancelled" : "active"
    try {
      await updateStatus.mutateAsync({ id, status: newStatus })
      toast.success(`Subscription ${newStatus === "active" ? "activated" : "deactivated"}`)
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status")
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      {showAssign && <AssignModal onClose={() => { setShowAssign(false); refetch() }} />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Heading>Vendor Subscriptions</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Manage vendor subscription plans and status.
          </Text>
        </div>
        <Button size="small" onClick={() => setShowAssign(true)}>
          Assign Plan
        </Button>
      </div>

      {/* Filters */}
      <Container className="p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <Label htmlFor="status-filter">Status</Label>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(0) }}>
            <Select.Trigger id="status-filter" className="w-36">
              <Select.Value placeholder="All statuses" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">All</Select.Item>
              {STATUS_OPTIONS.filter(Boolean).map((s) => (
                <Select.Item key={s} value={s} className="capitalize">{s}</Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="vendor-search">Vendor ID</Label>
          <div className="flex gap-2">
            <Input
              id="vendor-search"
              placeholder="seller_..."
              value={vendorSearch}
              onChange={(e) => setVendorSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setAppliedVendorId(vendorSearch); setPage(0) } }}
              className="w-52"
            />
            <Button
              size="small"
              variant="secondary"
              onClick={() => { setAppliedVendorId(vendorSearch); setPage(0) }}
            >
              Search
            </Button>
            {appliedVendorId && (
              <Button
                size="small"
                variant="secondary"
                onClick={() => { setVendorSearch(""); setAppliedVendorId(""); setPage(0) }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </Container>

      {/* Table */}
      <Container className="divide-y divide-ui-border-base p-0 overflow-x-auto">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Vendor ID</Table.HeaderCell>
              <Table.HeaderCell>Plan</Table.HeaderCell>
              <Table.HeaderCell>Billing</Table.HeaderCell>
              <Table.HeaderCell>Price</Table.HeaderCell>
              <Table.HeaderCell>Start</Table.HeaderCell>
              <Table.HeaderCell>Expires</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading ? (
              <Table.Row>
                <Table.Cell colSpan={8} className="text-center py-8 text-ui-fg-subtle">
                  Loading…
                </Table.Cell>
              </Table.Row>
            ) : subscriptions.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={8} className="text-center py-8 text-ui-fg-subtle">
                  No subscriptions found.
                </Table.Cell>
              </Table.Row>
            ) : (
              subscriptions.map((sub) => (
                <Table.Row key={sub.id}>
                  <Table.Cell>
                    <span className="font-mono text-xs text-ui-fg-subtle">{sub.vendor_id}</span>
                  </Table.Cell>
                  <Table.Cell className="font-medium">{sub.plan_name}</Table.Cell>
                  <Table.Cell className="capitalize">{sub.billing_period || "monthly"}</Table.Cell>
                  <Table.Cell>₱{Number(sub.price).toLocaleString()}</Table.Cell>
                  <Table.Cell>{formatDate(sub.start_date)}</Table.Cell>
                  <Table.Cell>
                    <span className={new Date(sub.end_date).getTime() < Date.now() + 7 * 86400000 ? "text-red-600 font-semibold" : ""}>
                      {formatDate(sub.end_date)}
                      <span className="ml-1 text-xs text-ui-fg-muted">({daysUntil(sub.end_date)})</span>
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <StatusBadge color={statusColor(sub.status)} className="capitalize">
                      {sub.status}
                    </StatusBadge>
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      size="small"
                      variant={sub.status === "active" ? "danger" : "secondary"}
                      isLoading={updateStatus.isPending}
                      onClick={() => handleToggle(sub.id, sub.status)}
                    >
                      {sub.status === "active" ? "Deactivate" : "Activate"}
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-ui-fg-subtle">
              {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
            </span>
            <div className="flex gap-2">
              <Button size="small" variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button
                size="small"
                variant="secondary"
                disabled={(page + 1) * limit >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Container>

      {/* GiyaPay subscription config */}
      <SubscriptionPaymentConfig />
    </div>
  )
}

export default SubscriptionsPage
