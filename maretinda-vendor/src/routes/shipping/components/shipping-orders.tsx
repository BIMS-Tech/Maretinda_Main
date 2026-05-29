'use client'

import {
  Container,
  Heading,
  Text,
  Button,
  StatusBadge,
  Input,
  Label,
  toast,
  Badge,
} from '@medusajs/ui'
import {
  TruckFast,
  Plus,
  XCircle,
  ArrowDownTray,
  MagnifyingGlass,
  XMark,
} from '@medusajs/icons'
import { useState } from 'react'
import {
  useShippingOrders,
  useCreateShippingOrder,
  useShippingProviders,
} from '../../../hooks/api/shipping'
import { backendUrl, publishableApiKey } from '../../../lib/client'

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, 'grey' | 'orange' | 'blue' | 'green' | 'red' | 'purple'> = {
  pending_pickup: 'orange',
  pending: 'orange',
  processing: 'blue',
  picked_up: 'blue',
  in_transit: 'blue',
  out_for_delivery: 'purple',
  delivered: 'green',
  failed: 'red',
  exception: 'red',
  cancelled: 'grey',
  returned: 'orange',
}

const STATUS_LABELS: Record<string, string> = {
  pending_pickup: 'Pending Pickup',
  pending: 'Pending',
  processing: 'Processing',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  failed: 'Failed',
  exception: 'Exception',
  cancelled: 'Cancelled',
  returned: 'Returned',
}

const PROVIDER_LABELS: Record<string, string> = {
  ninjavan: 'Ninja Van',
  jnt: 'J&T Express',
  lalamove: 'Lalamove',
}

const SERVICE_LEVELS = ['Standard', 'Express', 'Sameday', 'Nextday']
const TERMINAL_STATUSES = ['delivered', 'cancelled', 'failed', 'returned']

// ── Create Shipment Form state ────────────────────────────────────────────────

interface ShipmentForm {
  medusa_order_id: string
  provider: string
  service_level: string
  pickup_date: string
  from_name: string
  from_phone: string
  from_address: string
  from_city: string
  from_state: string
  from_postcode: string
  to_name: string
  to_phone: string
  to_address: string
  to_city: string
  to_state: string
  to_postcode: string
  weight: string
  length: string
  width: string
  height: string
  description: string
}

const EMPTY_FORM: ShipmentForm = {
  medusa_order_id: '',
  provider: '',
  service_level: 'Standard',
  pickup_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  from_name: '',
  from_phone: '',
  from_address: '',
  from_city: '',
  from_state: '',
  from_postcode: '',
  to_name: '',
  to_phone: '',
  to_address: '',
  to_city: '',
  to_state: '',
  to_postcode: '',
  weight: '',
  length: '',
  width: '',
  height: '',
  description: 'Marketplace goods',
}

// ── Waybill download (needs raw fetch because response is PDF binary) ─────────

async function downloadWaybill(orderId: string, trackingNumber: string) {
  const bearer = window.localStorage.getItem('medusa_auth_token') || ''
  const response = await fetch(`${backendUrl}/vendor/shipping-orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bearer}`,
      'Content-Type': 'application/json',
      'x-publishable-api-key': publishableApiKey,
    },
    body: JSON.stringify({ action: 'get-waybill', orderId }),
  })
  if (!response.ok) throw new Error('Failed to get waybill')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `waybill-${trackingNumber}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Field helper ─────────────────────────────────────────────────────────────

function FormField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-sm font-medium text-ui-fg-base">
        {label}
        {required && <span className="text-ui-fg-error ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-ui-fg-base text-ui-bg-base text-xs font-bold">
        {step}
      </span>
      <Text className="font-semibold text-ui-fg-base">{title}</Text>
    </div>
  )
}

// ── Create Shipment Drawer ────────────────────────────────────────────────────

function CreateShipmentDrawer({
  enabledProviders,
  onClose,
  onCreated,
}: {
  enabledProviders: any[]
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState<ShipmentForm>({
    ...EMPTY_FORM,
    provider: enabledProviders[0]?.providerId ?? '',
  })

  const { mutateAsync: createOrder, isPending } = useCreateShippingOrder()

  const set = (key: keyof ShipmentForm, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const handleSubmit = async () => {
    if (!form.provider) return toast.error('Select a shipping provider')
    if (!form.from_name || !form.from_phone || !form.from_address || !form.from_city)
      return toast.error('Fill in all required sender fields')
    if (!form.to_name || !form.to_phone || !form.to_address || !form.to_city)
      return toast.error('Fill in all required recipient fields')
    if (!form.weight) return toast.error('Parcel weight is required')

    try {
      await createOrder({
        action: 'create-order',
        providerId: form.provider,
        orderData: {
          medusa_order_id: form.medusa_order_id || undefined,
          service_level: form.service_level,
          pickup_date: form.pickup_date,
          from: {
            name: form.from_name,
            phone: form.from_phone,
            address: form.from_address,
            city: form.from_city,
            state: form.from_state || undefined,
            postcode: form.from_postcode,
            country: 'PH',
          },
          to: {
            name: form.to_name,
            phone: form.to_phone,
            address: form.to_address,
            city: form.to_city,
            state: form.to_state || undefined,
            postcode: form.to_postcode,
            country: 'PH',
          },
          parcel: {
            weight: parseFloat(form.weight),
            length: form.length ? parseFloat(form.length) : undefined,
            width: form.width ? parseFloat(form.width) : undefined,
            height: form.height ? parseFloat(form.height) : undefined,
            description: form.description,
          },
        },
      })
      toast.success('Shipment created! Tracking number assigned.')
      onCreated()
      onClose()
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to create shipment')
    }
  }

  const selectedProvider = enabledProviders.find((p) => p.providerId === form.provider)

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-lg bg-ui-bg-base shadow-xl flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-ui-border-base bg-ui-bg-base">
          <div>
            <Heading level="h3">Create Shipment</Heading>
            <Text className="text-xs text-ui-fg-muted">
              Fill in the details to book a courier pickup
            </Text>
          </div>
          <button
            className="text-ui-fg-muted hover:text-ui-fg-base"
            onClick={onClose}
          >
            <XMark className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-6">
          {/* Step 1 – Provider & Basic Info */}
          <section className="flex flex-col gap-4">
            <SectionHeading step={1} title="Shipment basics" />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Medusa Order ID" required={false}>
                <Input
                  placeholder="order_..."
                  value={form.medusa_order_id}
                  onChange={(e) => set('medusa_order_id', e.target.value)}
                />
              </FormField>
              <FormField label="Pickup Date" required>
                <Input
                  type="date"
                  value={form.pickup_date}
                  onChange={(e) => set('pickup_date', e.target.value)}
                />
              </FormField>
            </div>

            <FormField label="Provider" required>
              {enabledProviders.length === 0 ? (
                <p className="text-sm text-ui-tag-red-text bg-ui-tag-red-bg border border-ui-tag-red-border rounded px-3 py-2">
                  No enabled providers. Go to the Providers tab to set one up first.
                </p>
              ) : (
                <select
                  className="w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm text-ui-fg-base focus:outline-none focus:ring-1 focus:ring-ui-border-interactive"
                  value={form.provider}
                  onChange={(e) => set('provider', e.target.value)}
                >
                  {enabledProviders.map((p) => (
                    <option key={p.providerId} value={p.providerId}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </FormField>

            {selectedProvider?.providerId === 'ninjavan' && (
              <FormField label="Service Level" required>
                <select
                  className="w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm text-ui-fg-base focus:outline-none focus:ring-1 focus:ring-ui-border-interactive"
                  value={form.service_level}
                  onChange={(e) => set('service_level', e.target.value)}
                >
                  {SERVICE_LEVELS.map((sl) => (
                    <option key={sl} value={sl}>{sl}</option>
                  ))}
                </select>
              </FormField>
            )}
          </section>

          <div className="border-t border-ui-border-base" />

          {/* Step 2 – Sender */}
          <section className="flex flex-col gap-3">
            <SectionHeading step={2} title="Sender (pickup address)" />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Name" required>
                <Input
                  placeholder="Store / Seller name"
                  value={form.from_name}
                  onChange={(e) => set('from_name', e.target.value)}
                />
              </FormField>
              <FormField label="Phone" required>
                <Input
                  placeholder="+63 9XX XXX XXXX"
                  value={form.from_phone}
                  onChange={(e) => set('from_phone', e.target.value)}
                />
              </FormField>
            </div>
            <FormField label="Street Address" required>
              <Input
                placeholder="Unit / Bldg / Street"
                value={form.from_address}
                onChange={(e) => set('from_address', e.target.value)}
              />
            </FormField>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="City" required>
                <Input
                  placeholder="City"
                  value={form.from_city}
                  onChange={(e) => set('from_city', e.target.value)}
                />
              </FormField>
              <FormField label="Province">
                <Input
                  placeholder="Province"
                  value={form.from_state}
                  onChange={(e) => set('from_state', e.target.value)}
                />
              </FormField>
              <FormField label="Postcode">
                <Input
                  placeholder="1234"
                  value={form.from_postcode}
                  onChange={(e) => set('from_postcode', e.target.value)}
                />
              </FormField>
            </div>
          </section>

          <div className="border-t border-ui-border-base" />

          {/* Step 3 – Recipient */}
          <section className="flex flex-col gap-3">
            <SectionHeading step={3} title="Recipient (delivery address)" />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Name" required>
                <Input
                  placeholder="Customer name"
                  value={form.to_name}
                  onChange={(e) => set('to_name', e.target.value)}
                />
              </FormField>
              <FormField label="Phone" required>
                <Input
                  placeholder="+63 9XX XXX XXXX"
                  value={form.to_phone}
                  onChange={(e) => set('to_phone', e.target.value)}
                />
              </FormField>
            </div>
            <FormField label="Street Address" required>
              <Input
                placeholder="Unit / Bldg / Street"
                value={form.to_address}
                onChange={(e) => set('to_address', e.target.value)}
              />
            </FormField>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="City" required>
                <Input
                  placeholder="City"
                  value={form.to_city}
                  onChange={(e) => set('to_city', e.target.value)}
                />
              </FormField>
              <FormField label="Province">
                <Input
                  placeholder="Province"
                  value={form.to_state}
                  onChange={(e) => set('to_state', e.target.value)}
                />
              </FormField>
              <FormField label="Postcode">
                <Input
                  placeholder="1234"
                  value={form.to_postcode}
                  onChange={(e) => set('to_postcode', e.target.value)}
                />
              </FormField>
            </div>
          </section>

          <div className="border-t border-ui-border-base" />

          {/* Step 4 – Parcel */}
          <section className="flex flex-col gap-3">
            <SectionHeading step={4} title="Parcel details" />
            <FormField label="Description">
              <Input
                placeholder="e.g. Clothing, Electronics"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </FormField>
            <div className="grid grid-cols-4 gap-3">
              <FormField label="Weight (kg)" required>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="1.0"
                  value={form.weight}
                  onChange={(e) => set('weight', e.target.value)}
                />
              </FormField>
              <FormField label="L (cm)">
                <Input
                  type="number"
                  min="1"
                  placeholder="30"
                  value={form.length}
                  onChange={(e) => set('length', e.target.value)}
                />
              </FormField>
              <FormField label="W (cm)">
                <Input
                  type="number"
                  min="1"
                  placeholder="20"
                  value={form.width}
                  onChange={(e) => set('width', e.target.value)}
                />
              </FormField>
              <FormField label="H (cm)">
                <Input
                  type="number"
                  min="1"
                  placeholder="10"
                  value={form.height}
                  onChange={(e) => set('height', e.target.value)}
                />
              </FormField>
            </div>
          </section>
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-ui-bg-base border-t border-ui-border-base px-6 py-4 flex gap-3">
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleSubmit}
            isLoading={isPending}
            disabled={enabledProviders.length === 0}
          >
            Book Shipment
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main ShippingOrders component ─────────────────────────────────────────────

export const ShippingOrders = () => {
  const [statusFilter, setStatusFilter] = useState('')
  const [providerFilter, setProviderFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const filters: Record<string, string> = {}
  if (statusFilter) filters.status = statusFilter
  if (providerFilter) filters.provider = providerFilter

  const { data, isLoading, refetch } = useShippingOrders(filters)
  const { data: providersData } = useShippingProviders()
  const { mutateAsync: createOrder } = useCreateShippingOrder()

  const orders = data?.orders ?? []
  const summary = data?.summary ?? {}
  const enabledProviders = (providersData?.providers ?? []).filter((p: any) => p.isEnabled)

  const handleCancel = async (orderId: string, trackingNumber: string) => {
    if (!window.confirm(`Cancel shipment ${trackingNumber}? This action cannot be undone.`)) return
    setCancellingId(orderId)
    try {
      await createOrder({ action: 'cancel-order', orderId })
      toast.success('Shipment cancelled')
      refetch()
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to cancel')
    } finally {
      setCancellingId(null)
    }
  }

  const handleWaybill = async (orderId: string, trackingNumber: string) => {
    setDownloadingId(orderId)
    try {
      await downloadWaybill(orderId, trackingNumber)
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to download waybill')
    } finally {
      setDownloadingId(null)
    }
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

  const formatCurrency = (amount: number, currency = 'PHP') =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency }).format(amount)

  return (
    <>
      <Container className="p-0">
        {/* Header */}
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Heading level="h2">Shipments</Heading>
            <Text className="text-ui-fg-muted text-sm mt-0.5">
              Track and manage all your courier bookings
            </Text>
          </div>

          <div className="flex items-center gap-3">
            {/* Summary pills */}
            {summary.totalOrders > 0 && (
              <div className="flex gap-2">
                <div className="text-center px-3 py-1.5 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
                  <p className="text-sm font-bold text-ui-fg-base">{summary.totalOrders}</p>
                  <p className="text-xs text-ui-fg-muted">Total</p>
                </div>
                <div className="text-center px-3 py-1.5 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
                  <p className="text-sm font-bold text-ui-tag-green-text">{summary.successfulDeliveries}</p>
                  <p className="text-xs text-ui-fg-muted">Delivered</p>
                </div>
                <div className="text-center px-3 py-1.5 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
                  <p className="text-sm font-bold text-ui-fg-base">{summary.pendingOrders}</p>
                  <p className="text-xs text-ui-fg-muted">Pending</p>
                </div>
              </div>
            )}

            <Button
              variant="primary"
              size="small"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-4 w-4" />
              Create Shipment
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 pb-4 flex flex-wrap gap-3 border-b border-ui-border-base">
          <div className="flex items-center gap-2">
            <MagnifyingGlass className="h-4 w-4 text-ui-fg-muted" />
            <select
              className="rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-1.5 text-sm text-ui-fg-base focus:outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <select
            className="rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-1.5 text-sm text-ui-fg-base focus:outline-none"
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
          >
            <option value="">All Providers</option>
            <option value="ninjavan">Ninja Van</option>
            <option value="jnt">J&amp;T Express</option>
            <option value="lalamove">Lalamove</option>
          </select>

          {(statusFilter || providerFilter) && (
            <button
              className="flex items-center gap-1 text-xs text-ui-fg-muted hover:text-ui-fg-base"
              onClick={() => { setStatusFilter(''); setProviderFilter('') }}
            >
              <XCircle className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-lg bg-ui-bg-subtle animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <TruckFast className="h-10 w-10 text-ui-fg-muted" />
              <Text className="font-medium text-ui-fg-base">No shipments yet</Text>
              <Text className="text-sm text-ui-fg-muted max-w-xs">
                {statusFilter || providerFilter
                  ? 'No shipments match your filters.'
                  : 'Create your first shipment to book a courier pickup for an order.'}
              </Text>
              {!statusFilter && !providerFilter && (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setShowCreate(true)}
                >
                  <Plus className="h-4 w-4" />
                  Create First Shipment
                </Button>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ui-border-base bg-ui-bg-subtle">
                  <th className="px-6 py-3 text-left font-medium text-ui-fg-subtle">Tracking #</th>
                  <th className="px-6 py-3 text-left font-medium text-ui-fg-subtle">Provider</th>
                  <th className="px-6 py-3 text-left font-medium text-ui-fg-subtle">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-ui-fg-subtle">Order</th>
                  <th className="px-6 py-3 text-left font-medium text-ui-fg-subtle">Cost</th>
                  <th className="px-6 py-3 text-left font-medium text-ui-fg-subtle">Date</th>
                  <th className="px-6 py-3 text-right font-medium text-ui-fg-subtle">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any) => {
                  const isTerminal = TERMINAL_STATUSES.includes(order.status)
                  const isNinjavan = order.provider === 'ninjavan'
                  const isCancelling = cancellingId === order.id
                  const isDownloading = downloadingId === order.id

                  return (
                    <tr
                      key={order.id}
                      className="border-b border-ui-border-base hover:bg-ui-bg-subtle transition-colors"
                    >
                      <td className="px-6 py-4">
                        {order.tracking_number ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono font-medium text-ui-fg-base">
                              {order.tracking_number}
                            </span>
                            {order.tracking_url && (
                              <a
                                href={order.tracking_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-ui-fg-interactive hover:underline"
                              >
                                Track online
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-ui-fg-muted text-xs">Pending</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <Badge size="2xsmall" color="blue">
                          {PROVIDER_LABELS[order.provider] ?? order.provider}
                        </Badge>
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge color={STATUS_COLORS[order.status] ?? 'grey'}>
                          {STATUS_LABELS[order.status] ?? order.status}
                        </StatusBadge>
                      </td>

                      <td className="px-6 py-4">
                        {order.medusa_order_id ? (
                          <span className="font-mono text-xs text-ui-fg-subtle">
                            {order.medusa_order_id}
                          </span>
                        ) : (
                          <span className="text-ui-fg-muted text-xs">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {order.amount ? (
                          <span className="text-ui-fg-base">
                            {formatCurrency(parseFloat(order.amount), order.currency ?? 'PHP')}
                          </span>
                        ) : (
                          <span className="text-ui-fg-muted text-xs">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-ui-fg-subtle text-xs">
                          {formatDate(order.created_at)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {isNinjavan && order.tracking_number && (
                            <Button
                              variant="secondary"
                              size="small"
                              onClick={() => handleWaybill(order.id, order.tracking_number)}
                              isLoading={isDownloading}
                              title="Download waybill PDF"
                            >
                              <ArrowDownTray className="h-3.5 w-3.5" />
                              Waybill
                            </Button>
                          )}

                          {!isTerminal && (
                            <Button
                              variant="secondary"
                              size="small"
                              onClick={() => handleCancel(order.id, order.tracking_number ?? order.id)}
                              isLoading={isCancelling}
                              className="text-ui-tag-red-text hover:bg-ui-tag-red-bg"
                              title="Cancel shipment"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </Container>

      {/* Create Shipment Drawer */}
      {showCreate && (
        <CreateShipmentDrawer
          enabledProviders={enabledProviders}
          onClose={() => setShowCreate(false)}
          onCreated={() => refetch()}
        />
      )}
    </>
  )
}
