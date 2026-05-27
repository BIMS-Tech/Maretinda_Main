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
  useAdminSubscriptionPlans,
  useUpdateSubscriptionPlan,
} from "../../hooks/api/subscriptions"
import type { SubscriptionPlan } from "../../hooks/api/subscriptions"

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
// Plan edit row (inline editing)
// ---------------------------------------------------------------------------
function PlanRow({ plan }: { plan: SubscriptionPlan }) {
  const update = useUpdateSubscriptionPlan()
  const [editing, setEditing] = useState(false)
  const [price, setPrice] = useState(String(plan.price))
  const [yearlyPrice, setYearlyPrice] = useState(String(plan.yearly_price ?? ""))
  const [status, setStatus] = useState<"active" | "inactive">(plan.status)

  const handleSave = async () => {
    try {
      await update.mutateAsync({
        plan_id: plan.id,
        price: Number(price),
        yearly_price: yearlyPrice !== "" ? Number(yearlyPrice) : undefined,
        status,
      })
      toast.success(`Plan "${plan.name}" updated`)
      setEditing(false)
    } catch (err: any) {
      toast.error(err?.message || "Failed to update plan")
    }
  }

  const handleCancel = () => {
    setPrice(String(plan.price))
    setYearlyPrice(String(plan.yearly_price ?? ""))
    setStatus(plan.status)
    setEditing(false)
  }

  return (
    <Table.Row>
      <Table.Cell className="font-medium">{plan.name}</Table.Cell>
      <Table.Cell>
        {editing ? (
          <Input
            className="w-28"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min={0}
          />
        ) : (
          <span>₱{Number(plan.price).toLocaleString()}</span>
        )}
      </Table.Cell>
      <Table.Cell>
        {editing ? (
          <Input
            className="w-28"
            type="number"
            value={yearlyPrice}
            onChange={(e) => setYearlyPrice(e.target.value)}
            placeholder="e.g. 9990"
            min={0}
          />
        ) : (
          <span>{plan.yearly_price ? `₱${Number(plan.yearly_price).toLocaleString()}` : "—"}</span>
        )}
      </Table.Cell>
      <Table.Cell>
        {editing ? (
          <Select value={status} onValueChange={(v) => setStatus(v as "active" | "inactive")}>
            <Select.Trigger className="w-28">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="active">Active</Select.Item>
              <Select.Item value="inactive">Inactive</Select.Item>
            </Select.Content>
          </Select>
        ) : (
          <StatusBadge color={plan.status === "active" ? "green" : "grey"} className="capitalize">
            {plan.status}
          </StatusBadge>
        )}
      </Table.Cell>
      <Table.Cell>
        {editing ? (
          <div className="flex gap-2">
            <Button size="small" onClick={handleSave} isLoading={update.isPending}>Save</Button>
            <Button size="small" variant="secondary" onClick={handleCancel}>Cancel</Button>
          </div>
        ) : (
          <Button size="small" variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
        )}
      </Table.Cell>
    </Table.Row>
  )
}

// ---------------------------------------------------------------------------
// Plans management tab
// ---------------------------------------------------------------------------
function PlansTab() {
  const { plans, isLoading } = useAdminSubscriptionPlans()

  return (
    <Container className="divide-y divide-ui-border-base p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Subscription Plans</Heading>
        <Text className="text-ui-fg-subtle" size="small">
          Edit monthly/yearly prices and toggle plan visibility.
        </Text>
      </div>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Plan</Table.HeaderCell>
            <Table.HeaderCell>Monthly Price</Table.HeaderCell>
            <Table.HeaderCell>Yearly Price</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {isLoading ? (
            <Table.Row>
              <Table.Cell colSpan={5} className="text-center py-8 text-ui-fg-subtle">Loading…</Table.Cell>
            </Table.Row>
          ) : plans.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={5} className="text-center py-8 text-ui-fg-subtle">No plans found.</Table.Cell>
            </Table.Row>
          ) : (
            plans.map((plan) => <PlanRow key={plan.id} plan={plan} />)
          )}
        </Table.Body>
      </Table>
    </Container>
  )
}

// ---------------------------------------------------------------------------
// Manual assign modal — loads plans from API
// ---------------------------------------------------------------------------
function AssignModal({ onClose }: { onClose: () => void }) {
  const assign = useAdminAssignSubscription()
  const { plans, isLoading: plansLoading } = useAdminSubscriptionPlans()
  const [vendorId, setVendorId] = useState("")
  const [planName, setPlanName] = useState("")
  const [durationDays, setDurationDays] = useState(30)

  useEffect(() => {
    if (plans.length > 0 && !planName) {
      setPlanName(plans[0].name)
    }
  }, [plans, planName])

  const handleSubmit = async () => {
    if (!vendorId) { toast.error("Vendor ID is required"); return }
    if (!planName) { toast.error("Select a plan"); return }
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
            {plansLoading ? (
              <p className="text-sm text-ui-fg-subtle">Loading plans…</p>
            ) : (
              <Select value={planName} onValueChange={setPlanName}>
                <Select.Trigger id="assign-plan">
                  <Select.Value placeholder="Select a plan" />
                </Select.Trigger>
                <Select.Content>
                  {plans.map((p) => (
                    <Select.Item key={p.id} value={p.name}>
                      {p.name} — ₱{Number(p.price).toLocaleString()}/mo
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            )}
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
type Tab = "subscriptions" | "plans"

export const SubscriptionsPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("subscriptions")
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
      await updateStatus.mutateAsync({ id, status: newStatus as "active" | "cancelled" })
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
        <div className="flex gap-2">
          {activeTab === "subscriptions" && (
            <Button size="small" onClick={() => setShowAssign(true)}>
              Assign Plan
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-ui-border-base">
        {(["subscriptions", "plans"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              "px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors",
              activeTab === tab
                ? "border-ui-fg-base text-ui-fg-base"
                : "border-transparent text-ui-fg-subtle hover:text-ui-fg-base",
            ].join(" ")}
          >
            {tab === "subscriptions" ? "Vendor Subscriptions" : "Plan Management"}
          </button>
        ))}
      </div>

      {activeTab === "plans" ? (
        <>
          <PlansTab />
          <SubscriptionPaymentConfig />
        </>
      ) : (
        <>
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
                  <Table.HeaderCell>Vendor</Table.HeaderCell>
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
                  subscriptions.map((sub: any) => (
                    <Table.Row key={sub.id}>
                      <Table.Cell>
                        <div className="flex flex-col">
                          {sub.seller_name ? (
                            <span className="font-medium text-sm">{sub.seller_name}</span>
                          ) : null}
                          {sub.seller_email ? (
                            <span className="text-xs text-ui-fg-subtle">{sub.seller_email}</span>
                          ) : null}
                          <span className="font-mono text-xs text-ui-fg-muted">{sub.vendor_id}</span>
                        </div>
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
        </>
      )}
    </div>
  )
}

export default SubscriptionsPage
