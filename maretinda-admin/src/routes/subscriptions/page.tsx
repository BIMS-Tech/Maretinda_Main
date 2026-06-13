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
  useAdminEndTrial,
  useAdminExtendTrial,
} from "../../hooks/api/subscriptions"
import type { SubscriptionPlan, sellersubscription } from "../../hooks/api/subscriptions"

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
            GiyaPay credentials used specifically for seller subscription payments.
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
              <Input id="sub-merchant-id" placeholder="Enter Merchant ID" value={merchantId} onChange={(e) => setMerchantId(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="sub-merchant-secret">Merchant Secret</Label>
              <Input id="sub-merchant-secret" type="password" placeholder="Enter new secret (leave blank to keep existing)" value={merchantSecret} onChange={(e) => setMerchantSecret(e.target.value)} />
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
            <Button onClick={handleSave} isLoading={update.isPending} size="small">Save Config</Button>
            <Button variant="secondary" size="small" onClick={() => { setEditing(false); setMerchantSecret("") }}>Cancel</Button>
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
        <div className="px-6 py-4 text-sm text-ui-fg-subtle">No subscription payment config set. Click Configure to add one.</div>
      )}
    </Container>
  )
}

// ---------------------------------------------------------------------------
// Plan edit row (inline editing with trial days + discount)
// ---------------------------------------------------------------------------
function PlanRow({ plan }: { plan: SubscriptionPlan }) {
  const update = useUpdateSubscriptionPlan()
  const [editing, setEditing] = useState(false)
  const [price, setPrice] = useState(String(plan.price))
  const [yearlyPrice, setYearlyPrice] = useState(String(plan.yearly_price ?? ""))
  const [discountPct, setDiscountPct] = useState(String(plan.yearly_discount_percent ?? ""))
  const [trialDays, setTrialDays] = useState(String(plan.trial_days ?? 0))
  const [status, setStatus] = useState<"active" | "inactive">(plan.status)

  // Auto-compute yearly price from discount when monthly price or discount changes
  const handleDiscountChange = (val: string) => {
    setDiscountPct(val)
    const discount = parseFloat(val)
    const monthly = parseFloat(price)
    if (!isNaN(discount) && !isNaN(monthly) && discount >= 0 && discount < 100) {
      setYearlyPrice(String(Math.round(monthly * 12 * (1 - discount / 100))))
    }
  }

  // Auto-compute discount from yearly price
  const handleYearlyPriceChange = (val: string) => {
    setYearlyPrice(val)
    const annual = parseFloat(val)
    const monthly = parseFloat(price)
    if (!isNaN(annual) && !isNaN(monthly) && monthly > 0) {
      setDiscountPct(String(Math.round((1 - annual / (monthly * 12)) * 100)))
    }
  }

  const handleSave = async () => {
    try {
      await update.mutateAsync({
        plan_id: plan.id,
        price: Number(price),
        yearly_price: yearlyPrice !== "" ? Number(yearlyPrice) : undefined,
        yearly_discount_percent: discountPct !== "" ? Number(discountPct) : undefined,
        trial_days: Number(trialDays),
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
    setDiscountPct(String(plan.yearly_discount_percent ?? ""))
    setTrialDays(String(plan.trial_days ?? 0))
    setStatus(plan.status)
    setEditing(false)
  }

  return (
    <Table.Row>
      <Table.Cell className="font-medium">{plan.name}</Table.Cell>
      <Table.Cell>
        {editing ? (
          <Input className="w-28" type="number" value={price} onChange={(e) => setPrice(e.target.value)} min={0} />
        ) : (
          <span>₱{Number(plan.price).toLocaleString()}</span>
        )}
      </Table.Cell>
      <Table.Cell>
        {editing ? (
          <div className="flex gap-2 items-center">
            <Input className="w-28" type="number" value={yearlyPrice} onChange={(e) => handleYearlyPriceChange(e.target.value)} placeholder="e.g. 4990" min={0} />
            <span className="text-xs text-ui-fg-subtle">or</span>
            <div className="flex items-center gap-1">
              <Input className="w-16" type="number" value={discountPct} onChange={(e) => handleDiscountChange(e.target.value)} placeholder="%" min={0} max={99} />
              <span className="text-xs text-ui-fg-subtle">% off</span>
            </div>
          </div>
        ) : (
          <span>
            {plan.yearly_price ? `₱${Number(plan.yearly_price).toLocaleString()}` : "—"}
            {plan.yearly_discount_percent ? (
              <span className="ml-1 text-xs text-green-600">({plan.yearly_discount_percent}% off)</span>
            ) : null}
          </span>
        )}
      </Table.Cell>
      <Table.Cell>
        {editing ? (
          <div className="flex items-center gap-1">
            <Input className="w-20" type="number" value={trialDays} onChange={(e) => setTrialDays(e.target.value)} min={0} />
            <span className="text-xs text-ui-fg-subtle">days</span>
          </div>
        ) : (
          <span>{plan.trial_days > 0 ? `${plan.trial_days} days` : "None"}</span>
        )}
      </Table.Cell>
      <Table.Cell>
        {editing ? (
          <Select value={status} onValueChange={(v) => setStatus(v as "active" | "inactive")}>
            <Select.Trigger className="w-28"><Select.Value /></Select.Trigger>
            <Select.Content>
              <Select.Item value="active">Active</Select.Item>
              <Select.Item value="inactive">Inactive</Select.Item>
            </Select.Content>
          </Select>
        ) : (
          <StatusBadge color={plan.status === "active" ? "green" : "grey"} className="capitalize">{plan.status}</StatusBadge>
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
          Edit monthly/yearly prices, yearly discount %, trial period, and plan visibility.
        </Text>
      </div>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Plan</Table.HeaderCell>
            <Table.HeaderCell>Monthly Price</Table.HeaderCell>
            <Table.HeaderCell>Yearly Price / Discount</Table.HeaderCell>
            <Table.HeaderCell>Free Trial</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {isLoading ? (
            <Table.Row><Table.Cell colSpan={6} className="text-center py-8 text-ui-fg-subtle">Loading…</Table.Cell></Table.Row>
          ) : plans.length === 0 ? (
            <Table.Row><Table.Cell colSpan={6} className="text-center py-8 text-ui-fg-subtle">No plans found.</Table.Cell></Table.Row>
          ) : (
            plans.map((plan) => <PlanRow key={plan.id} plan={plan} />)
          )}
        </Table.Body>
      </Table>
    </Container>
  )
}

// ---------------------------------------------------------------------------
// Trial management modal
// ---------------------------------------------------------------------------
function TrialModal({ sub, onClose }: { sub: sellersubscription; onClose: () => void }) {
  const endTrial = useAdminEndTrial()
  const extendTrial = useAdminExtendTrial()
  const [extendDays, setExtendDays] = useState(7)

  const handleEnd = async () => {
    try {
      await endTrial.mutateAsync({ id: sub.id })
      toast.success("Trial ended")
      onClose()
    } catch (err: any) {
      toast.error(err?.message || "Failed to end trial")
    }
  }

  const handleExtend = async () => {
    try {
      await extendTrial.mutateAsync({ id: sub.id, days: extendDays })
      toast.success(`Trial extended by ${extendDays} days`)
      onClose()
    } catch (err: any) {
      toast.error(err?.message || "Failed to extend trial")
    }
  }

  const trialEnd = sub.trial_ends_at ? new Date(sub.trial_ends_at) : new Date(sub.end_date)
  const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <Heading level="h2" className="mb-1">Manage Trial</Heading>
        <Text className="text-ui-fg-subtle mb-4" size="small">
          {sub.seller_name || sub.seller_id} — {sub.plan_name} plan
        </Text>

        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-4 text-sm">
          <p className="font-semibold text-amber-800">Trial Status</p>
          <p className="text-amber-700 mt-0.5">
            Ends: {trialEnd.toLocaleDateString()} ({daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining)
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <Label>Extend trial by</Label>
            <div className="flex gap-2 mt-1">
              <Input type="number" value={extendDays} onChange={(e) => setExtendDays(Number(e.target.value))} min={1} className="w-24" />
              <span className="self-center text-sm text-ui-fg-subtle">days</span>
              <Button size="small" onClick={handleExtend} isLoading={extendTrial.isPending}>Extend</Button>
            </div>
          </div>

          <div className="border-t border-ui-border-base pt-3">
            <Button variant="danger" size="small" onClick={handleEnd} isLoading={endTrial.isPending}>
              End Trial Now
            </Button>
            <Text className="text-ui-fg-subtle mt-1" size="xsmall">
              This will immediately expire the seller's trial access.
            </Text>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <Button variant="secondary" size="small" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Manual assign modal
// ---------------------------------------------------------------------------
function AssignModal({ onClose }: { onClose: () => void }) {
  const assign = useAdminAssignSubscription()
  const { plans, isLoading: plansLoading } = useAdminSubscriptionPlans()
  const [sellerId, setSellerId] = useState("")
  const [planName, setPlanName] = useState("")
  const [durationDays, setDurationDays] = useState(30)
  const [isTrial, setIsTrial] = useState(false)

  useEffect(() => {
    if (plans.length > 0 && !planName) setPlanName(plans[0].name)
  }, [plans, planName])

  const handleSubmit = async () => {
    if (!sellerId) { toast.error("Seller ID is required"); return }
    if (!planName) { toast.error("Select a plan"); return }
    try {
      await assign.mutateAsync({ seller_id: sellerId, plan_name: planName, duration_days: durationDays, is_trial: isTrial })
      toast.success(isTrial ? "Trial subscription assigned" : "Subscription assigned")
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
            <Label htmlFor="assign-vid">Seller ID</Label>
            <Input id="assign-vid" value={sellerId} onChange={(e) => setSellerId(e.target.value)} placeholder="seller_..." />
          </div>
          <div>
            <Label htmlFor="assign-plan">Plan</Label>
            {plansLoading ? (
              <p className="text-sm text-ui-fg-subtle">Loading plans…</p>
            ) : (
              <Select value={planName} onValueChange={setPlanName}>
                <Select.Trigger id="assign-plan"><Select.Value placeholder="Select a plan" /></Select.Trigger>
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
            <Input id="assign-days" type="number" value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))} min={1} />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isTrial} onCheckedChange={setIsTrial} id="assign-trial" />
            <Label htmlFor="assign-trial">Assign as Free Trial</Label>
          </div>
          {isTrial && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
              Trial subscriptions have ₱0 price and are marked as trial for tracking. The seller will see a trial banner.
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-5">
          <Button onClick={handleSubmit} isLoading={assign.isPending} size="small">
            {isTrial ? "Assign Trial" : "Assign"}
          </Button>
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
  const [sellerSearch, setSellerSearch] = useState("")
  const [page, setPage] = useState(0)
  const [showAssign, setShowAssign] = useState(false)
  const [appliedSellerId, setAppliedSellerId] = useState("")
  const [trialModal, setTrialModal] = useState<sellersubscription | null>(null)
  const limit = 20

  const { data, isLoading, refetch } = useAdminSubscriptions({
    status: statusFilter || undefined,
    seller_id: appliedSellerId || undefined,
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
      {trialModal && <TrialModal sub={trialModal} onClose={() => { setTrialModal(null); refetch() }} />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Heading>Seller Subscriptions</Heading>
          <Text className="text-ui-fg-subtle" size="small">Manage seller subscription plans and status.</Text>
        </div>
        <div className="flex gap-2">
          {activeTab === "subscriptions" && (
            <Button size="small" onClick={() => setShowAssign(true)}>Assign Plan</Button>
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
            {tab === "subscriptions" ? "Seller Subscriptions" : "Plan Management"}
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
                <Select.Trigger id="status-filter" className="w-36"><Select.Value placeholder="All statuses" /></Select.Trigger>
                <Select.Content>
                  <Select.Item value="all">All</Select.Item>
                  {STATUS_OPTIONS.filter(Boolean).map((s) => (
                    <Select.Item key={s} value={s} className="capitalize">{s}</Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="seller-search">Seller ID</Label>
              <div className="flex gap-2">
                <Input
                  id="seller-search"
                  placeholder="seller_..."
                  value={sellerSearch}
                  onChange={(e) => setSellerSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { setAppliedSellerId(sellerSearch); setPage(0) } }}
                  className="w-52"
                />
                <Button size="small" variant="secondary" onClick={() => { setAppliedSellerId(sellerSearch); setPage(0) }}>Search</Button>
                {appliedSellerId && (
                  <Button size="small" variant="secondary" onClick={() => { setSellerSearch(""); setAppliedSellerId(""); setPage(0) }}>Clear</Button>
                )}
              </div>
            </div>
          </Container>

          {/* Table */}
          <Container className="divide-y divide-ui-border-base p-0 overflow-x-auto">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Seller</Table.HeaderCell>
                  <Table.HeaderCell>Plan</Table.HeaderCell>
                  <Table.HeaderCell>Billing</Table.HeaderCell>
                  <Table.HeaderCell>Price</Table.HeaderCell>
                  <Table.HeaderCell>Start</Table.HeaderCell>
                  <Table.HeaderCell>Expires</Table.HeaderCell>
                  <Table.HeaderCell>Type</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell>Actions</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {isLoading ? (
                  <Table.Row>
                    <Table.Cell colSpan={9} className="text-center py-8 text-ui-fg-subtle">Loading…</Table.Cell>
                  </Table.Row>
                ) : subscriptions.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={9} className="text-center py-8 text-ui-fg-subtle">No subscriptions found.</Table.Cell>
                  </Table.Row>
                ) : (
                  subscriptions.map((sub: sellersubscription) => (
                    <Table.Row key={sub.id}>
                      <Table.Cell>
                        <div className="flex flex-col">
                          {sub.seller_name && <span className="font-medium text-sm">{sub.seller_name}</span>}
                          {(sub as any).seller_email && <span className="text-xs text-ui-fg-subtle">{(sub as any).seller_email}</span>}
                          <span className="font-mono text-xs text-ui-fg-muted">{sub.seller_id}</span>
                        </div>
                      </Table.Cell>
                      <Table.Cell className="font-medium">{sub.plan_name}</Table.Cell>
                      <Table.Cell className="capitalize">{sub.billing_period || "monthly"}</Table.Cell>
                      <Table.Cell>
                        {sub.is_trial ? (
                          <span className="text-amber-600 font-medium">Free Trial</span>
                        ) : (
                          `₱${Number(sub.price).toLocaleString()}`
                        )}
                      </Table.Cell>
                      <Table.Cell>{formatDate(sub.start_date)}</Table.Cell>
                      <Table.Cell>
                        <span className={new Date(sub.end_date).getTime() < Date.now() + 7 * 86400000 ? "text-red-600 font-semibold" : ""}>
                          {formatDate(sub.end_date)}
                          <span className="ml-1 text-xs text-ui-fg-muted">({daysUntil(sub.end_date)})</span>
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        {sub.is_trial ? (
                          <StatusBadge color="orange">Trial</StatusBadge>
                        ) : (
                          <StatusBadge color="grey">Paid</StatusBadge>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <StatusBadge color={statusColor(sub.status)} className="capitalize">{sub.status}</StatusBadge>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex gap-2">
                          {sub.is_trial && sub.status === "active" && (
                            <Button size="small" variant="secondary" onClick={() => setTrialModal(sub)}>
                              Manage Trial
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant={sub.status === "active" ? "danger" : "secondary"}
                            isLoading={updateStatus.isPending}
                            onClick={() => handleToggle(sub.id, sub.status)}
                          >
                            {sub.status === "active" ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
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
                  <Button size="small" variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                  <Button size="small" variant="secondary" disabled={(page + 1) * limit >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </Container>

          <SubscriptionPaymentConfig />
        </>
      )}
    </div>
  )
}

export default SubscriptionsPage
