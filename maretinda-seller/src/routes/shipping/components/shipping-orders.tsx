'use client'

import {
  Container,
  Heading,
  Text,
  Button,
  StatusBadge,
  Input,
  Label,
  Switch,
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
  CheckCircle,
} from '@medusajs/icons'
import { useState, useEffect } from 'react'
import {
  useShippingOrders,
  useCreateShippingOrder,
  useShippingProviders,
} from '../../../hooks/api/shipping'
import { useOrders } from '../../../hooks/api/orders'
import { useStockLocations } from '../../../hooks/api/stock-locations'
import { useMe } from '../../../hooks/api/users'
import { backendUrl, publishableApiKey, fetchQuery } from '../../../lib/client'

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
  flyingtigers: 'Flying Tigers Express',
}

const SERVICE_LEVELS = ['Standard', 'Express', 'Sameday', 'Nextday']
const TERMINAL_STATUSES = ['delivered', 'cancelled', 'failed', 'returned']

// ── Waybill download ──────────────────────────────────────────────────────────

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

// ── UI helpers ────────────────────────────────────────────────────────────────

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
  // Order picker
  const [orderSearch, setOrderSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)

  // Carrier
  const [provider, setProvider] = useState(enabledProviders[0]?.providerId ?? '')
  const [serviceLevel, setServiceLevel] = useState('Standard')
  const [pickupDate, setPickupDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  )

  // Sender (pre-filled from location, editable)
  const [fromName, setFromName] = useState('')
  const [fromPhone, setFromPhone] = useState('')
  const [fromAddress, setFromAddress] = useState('')
  const [fromCity, setFromCity] = useState('')
  const [fromState, setFromState] = useState('')
  const [fromPostcode, setFromPostcode] = useState('')

  // Recipient (pre-filled from order, editable)
  const [toName, setToName] = useState('')
  const [toPhone, setToPhone] = useState('')
  const [toAddress, setToAddress] = useState('')
  const [toCity, setToCity] = useState('')
  const [toState, setToState] = useState('')
  const [toPostcode, setToPostcode] = useState('')

  // Parcel
  const [weight, setWeight] = useState('')
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [description, setDescription] = useState('Marketplace goods')
  const [isCod, setIsCod] = useState(false)
  const [codAmount, setCodAmount] = useState('')

  const { mutateAsync: createOrder, isPending } = useCreateShippingOrder()

  // Fetch seller's orders for picker
  const { orders: vendorOrders = [] } = useOrders(
    { limit: 50, fields: 'id,display_id,email,*shipping_address,*items,total,currency_code,payment_status,*shipping_methods' } as any
  )

  // Seller profile — provides the sender's business name + phone.
  const { seller } = useMe()

  // Fetch seller's locations for sender auto-fill
  const { stock_locations: locations = [] } = useStockLocations(
    { fields: 'name,*address', limit: 1 } as any
  )

  // Auto-fill sender identity (name + phone) from the seller's profile.
  // Phone stays empty if the profile has none. Don't clobber manual edits.
  useEffect(() => {
    if (!seller) return
    setFromName((prev) => prev || (seller as any).name || '')
    setFromPhone((prev) => prev || (seller as any).phone || '')
  }, [seller])

  // Auto-fill sender address from the first warehouse location, falling back to
  // the seller profile's address when no location is configured.
  useEffect(() => {
    const loc = (locations as any[])[0]
    const locAddr = loc?.address
    if (!fromAddress && (locAddr || seller)) {
      setFromAddress(locAddr?.address_1 ?? (seller as any)?.address_line ?? '')
      setFromCity(locAddr?.city ?? (seller as any)?.city ?? '')
      setFromState(locAddr?.province ?? '')
      setFromPostcode(locAddr?.postal_code ?? (seller as any)?.postal_code ?? '')
    }
  }, [locations, seller])

  // Derive carrier service level from the customer's chosen shipping option name
  const deriveServiceLevel = (shippingOptionName: string): string => {
    const name = (shippingOptionName ?? '').toLowerCase()
    if (name.includes('same') || name.includes('sameday')) return 'Sameday'
    if (name.includes('next') || name.includes('nextday')) return 'Nextday'
    if (name.includes('express')) return 'Express'
    return 'Standard'
  }

  // Auto-fill recipient + service level when order is selected
  const handleOrderSelect = async (order: any) => {
    setSelectedOrder(order)

    // The /vendor/orders LIST endpoint doesn't reliably expand shipping_address,
    // so fetch the full order detail (which does) and fill the recipient from it.
    let addr = order.shipping_address
    let items = order.items ?? []
    try {
      const res: any = await fetchQuery(`/vendor/orders/${order.id}`, {
        method: 'GET',
        query: { fields: 'id,*shipping_address,*items' },
      })
      if (res?.order) {
        addr = res.order.shipping_address ?? addr
        items = res.order.items ?? items
      }
    } catch {
      // Fall back to whatever the list provided.
    }

    if (addr) {
      setToName(`${addr.first_name ?? ''} ${addr.last_name ?? ''}`.trim())
      setToPhone(addr.phone ?? '')
      setToAddress([addr.address_1, addr.address_2].filter(Boolean).join(', '))
      setToCity(addr.city ?? '')
      setToState(addr.province ?? '')
      setToPostcode(addr.postal_code ?? '')
    }
    if (items.length > 0) {
      setDescription(
        items.slice(0, 2).map((i: any) => i.title ?? 'Item').join(', ')
      )
    }
    // Auto-derive service level from customer's chosen shipping option
    const chosenOption = order.shipping_methods?.[0]?.name ?? ''
    if (chosenOption) setServiceLevel(deriveServiceLevel(chosenOption))

    // If order is unpaid, suggest COD
    if (order.payment_status === 'not_paid') {
      setIsCod(true)
      setCodAmount(String(Math.round((order.total ?? 0) / 100)))
    }
  }

  const filteredOrders = (vendorOrders as any[]).filter((o) => {
    if (!orderSearch) return true
    const q = orderSearch.toLowerCase()
    return (
      String(o.display_id).includes(q) ||
      (o.email ?? '').toLowerCase().includes(q) ||
      `${o.shipping_address?.first_name} ${o.shipping_address?.last_name}`
        .toLowerCase()
        .includes(q)
    )
  })

  const handleSubmit = async () => {
    if (!provider) return toast.error('Select a carrier')
    if (!fromName || !fromPhone || !fromAddress || !fromCity)
      return toast.error('Fill in all sender fields')
    if (!toName || !toAddress || !toCity)
      return toast.error('Recipient address is incomplete — select an order or fill manually')
    if (!weight) return toast.error('Parcel weight is required')

    try {
      await createOrder({
        action: 'create-order',
        providerId: provider,
        orderData: {
          medusa_order_id: selectedOrder?.id,
          service_level: serviceLevel,
          pickup_date: pickupDate,
          from: {
            name: fromName,
            phone: fromPhone,
            address: fromAddress,
            city: fromCity,
            state: fromState || undefined,
            postcode: fromPostcode,
            country: 'PH',
          },
          to: {
            name: toName,
            phone: toPhone,
            address: toAddress,
            city: toCity,
            state: toState || undefined,
            postcode: toPostcode,
            country: 'PH',
          },
          parcel: {
            weight: parseFloat(weight),
            length: length ? parseFloat(length) : undefined,
            width: width ? parseFloat(width) : undefined,
            height: height ? parseFloat(height) : undefined,
            description,
            is_cod: isCod,
            cod_amount: isCod && codAmount ? parseFloat(codAmount) : undefined,
          },
        },
      })
      toast.success('Shipment booked! Tracking number assigned.')
      onCreated()
      onClose()
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to create shipment')
    }
  }

  const hasLocation = (locations as any[]).length > 0
  const senderPrefilled = !!(fromName || fromAddress)

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-lg bg-ui-bg-base shadow-xl flex flex-col overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-ui-border-base bg-ui-bg-base">
          <div>
            <Heading level="h3">Create Shipment</Heading>
            <Text className="text-xs text-ui-fg-muted">
              Select an order — address details fill automatically
            </Text>
          </div>
          <button className="text-ui-fg-muted hover:text-ui-fg-base" onClick={onClose}>
            <XMark className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-6">

          {/* Step 1 — Select Order */}
          <section className="flex flex-col gap-3">
            <SectionHeading step={1} title="Select Order" />

            {selectedOrder ? (
              <div className="flex items-start justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-start gap-2">
                  <CheckCircle className="text-green-500 w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <Text size="small" weight="plus" className="text-green-700 dark:text-green-400">
                      Order #{selectedOrder.display_id}
                    </Text>
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      {selectedOrder.shipping_address?.first_name} {selectedOrder.shipping_address?.last_name}
                      {selectedOrder.email ? ` · ${selectedOrder.email}` : ''}
                    </Text>
                    {selectedOrder.shipping_methods?.[0]?.name && (
                      <Text size="xsmall" className="text-ui-fg-muted">
                        Customer chose: <strong>{selectedOrder.shipping_methods[0].name}</strong>
                        {' · '}service level auto-set to <strong>{serviceLevel}</strong>
                      </Text>
                    )}
                  </div>
                </div>
                <button
                  className="text-xs text-ui-fg-muted hover:text-ui-fg-base ml-3 flex-shrink-0"
                  onClick={() => {
                    setSelectedOrder(null)
                    setOrderSearch('')
                    setToName(''); setToPhone(''); setToAddress('')
                    setToCity(''); setToState(''); setToPostcode('')
                    setIsCod(false); setCodAmount('')
                    setDescription('Marketplace goods')
                  }}
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ui-fg-muted pointer-events-none" />
                  <Input
                    className="pl-9"
                    placeholder="Search by order # or customer name..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-52 overflow-y-auto rounded-lg border border-ui-border-base divide-y divide-ui-border-base bg-ui-bg-subtle">
                  {filteredOrders.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Text size="small" className="text-ui-fg-muted">No orders found</Text>
                    </div>
                  ) : (
                    filteredOrders.slice(0, 20).map((order: any) => {
                      const chosenShipping = order.shipping_methods?.[0]?.name
                      return (
                        <button
                          key={order.id}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-ui-bg-base text-left transition-colors"
                          onClick={() => handleOrderSelect(order)}
                        >
                          <div>
                            <Text size="small" weight="plus">Order #{order.display_id}</Text>
                            <Text size="xsmall" className="text-ui-fg-subtle">
                              {order.shipping_address?.first_name} {order.shipping_address?.last_name}
                              {order.email ? ` · ${order.email}` : ''}
                            </Text>
                            {chosenShipping && (
                              <Text size="xsmall" className="text-ui-fg-muted">
                                🚚 {chosenShipping}
                              </Text>
                            )}
                          </div>
                          <Text size="xsmall" className="text-ui-fg-muted flex-shrink-0 ml-3">
                            {order.currency_code?.toUpperCase()}{' '}
                            {Math.round((order.total ?? 0) / 100).toLocaleString()}
                          </Text>
                        </button>
                      )
                    })
                  )}
                </div>
                <Text size="xsmall" className="text-ui-fg-muted">
                  Or fill addresses manually below to ship without linking an order.
                </Text>
              </>
            )}
          </section>

          <div className="border-t border-ui-border-base" />

          {/* Step 2 — Carrier */}
          <section className="flex flex-col gap-3">
            <SectionHeading step={2} title="Carrier & Service" />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Carrier" required>
                {enabledProviders.length === 0 ? (
                  <p className="text-sm text-ui-tag-red-text bg-ui-tag-red-bg border border-ui-tag-red-border rounded px-3 py-2">
                    No carriers active yet. Admin must activate a carrier in the platform settings.
                  </p>
                ) : (
                  <select
                    className="w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm text-ui-fg-base focus:outline-none focus:ring-1 focus:ring-ui-border-interactive"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                  >
                    {enabledProviders.map((p) => (
                      <option key={p.providerId} value={p.providerId}>{p.name}</option>
                    ))}
                  </select>
                )}
              </FormField>
              <FormField label="Service Level" required>
                <select
                  className="w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm text-ui-fg-base focus:outline-none"
                  value={serviceLevel}
                  onChange={(e) => setServiceLevel(e.target.value)}
                >
                  {SERVICE_LEVELS.map((sl) => (
                    <option key={sl} value={sl}>{sl}</option>
                  ))}
                </select>
              </FormField>
            </div>
            <FormField label="Pickup Date" required>
              <Input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-48"
              />
            </FormField>
          </section>

          <div className="border-t border-ui-border-base" />

          {/* Step 3 — Sender */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <SectionHeading step={3} title="Sender (your warehouse)" />
              {senderPrefilled && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  <Text size="xsmall" className="text-ui-fg-muted">Pre-filled from your location</Text>
                </div>
              )}
            </div>
            {!hasLocation && !fromAddress && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Text size="xsmall" className="text-amber-600 dark:text-amber-400">
                  No warehouse location found. Go to Settings → Locations to add one, then it auto-fills here.
                </Text>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Name" required>
                <Input
                  placeholder="Your store / business name"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                />
              </FormField>
              <FormField label="Phone" required>
                <Input
                  placeholder="+63 9XX XXX XXXX"
                  value={fromPhone}
                  onChange={(e) => setFromPhone(e.target.value)}
                />
              </FormField>
            </div>
            <FormField label="Street Address" required>
              <Input
                placeholder="Unit / Bldg / Street"
                value={fromAddress}
                onChange={(e) => setFromAddress(e.target.value)}
              />
            </FormField>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="City" required>
                <Input placeholder="City" value={fromCity} onChange={(e) => setFromCity(e.target.value)} />
              </FormField>
              <FormField label="Province">
                <Input placeholder="Province" value={fromState} onChange={(e) => setFromState(e.target.value)} />
              </FormField>
              <FormField label="Postcode">
                <Input placeholder="1234" value={fromPostcode} onChange={(e) => setFromPostcode(e.target.value)} />
              </FormField>
            </div>
          </section>

          <div className="border-t border-ui-border-base" />

          {/* Step 4 — Recipient */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <SectionHeading step={4} title="Recipient (customer)" />
              {selectedOrder && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  <Text size="xsmall" className="text-ui-fg-muted">Pre-filled from order</Text>
                </div>
              )}
            </div>
            {!selectedOrder && (
              <div className="p-3 rounded-lg bg-ui-bg-subtle border border-ui-border-base">
                <Text size="xsmall" className="text-ui-fg-muted">
                  Select an order above to auto-fill the customer's delivery address. Or enter manually.
                </Text>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Name" required>
                <Input
                  placeholder="Customer name"
                  value={toName}
                  onChange={(e) => setToName(e.target.value)}
                />
              </FormField>
              <FormField label="Phone">
                <Input
                  placeholder="+63 9XX XXX XXXX"
                  value={toPhone}
                  onChange={(e) => setToPhone(e.target.value)}
                />
              </FormField>
            </div>
            <FormField label="Street Address" required>
              <Input
                placeholder="Unit / Bldg / Street"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
              />
            </FormField>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="City" required>
                <Input placeholder="City" value={toCity} onChange={(e) => setToCity(e.target.value)} />
              </FormField>
              <FormField label="Province">
                <Input placeholder="Province" value={toState} onChange={(e) => setToState(e.target.value)} />
              </FormField>
              <FormField label="Postcode">
                <Input placeholder="1234" value={toPostcode} onChange={(e) => setToPostcode(e.target.value)} />
              </FormField>
            </div>
          </section>

          <div className="border-t border-ui-border-base" />

          {/* Step 5 — Parcel */}
          <section className="flex flex-col gap-3">
            <SectionHeading step={5} title="Parcel details" />
            <FormField label="Description">
              <Input
                placeholder="e.g. Clothing, Electronics"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FormField>
            <div className="grid grid-cols-4 gap-3">
              <FormField label="Weight (kg)" required>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="1.0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </FormField>
              <FormField label="L (cm)">
                <Input type="number" min="1" placeholder="30" value={length} onChange={(e) => setLength(e.target.value)} />
              </FormField>
              <FormField label="W (cm)">
                <Input type="number" min="1" placeholder="20" value={width} onChange={(e) => setWidth(e.target.value)} />
              </FormField>
              <FormField label="H (cm)">
                <Input type="number" min="1" placeholder="10" value={height} onChange={(e) => setHeight(e.target.value)} />
              </FormField>
            </div>

            {/* COD */}
            <div className="flex items-center gap-3 pt-1">
              <Switch
                id="cod-switch"
                checked={isCod}
                onCheckedChange={(v) => {
                  setIsCod(v)
                  if (!v) setCodAmount('')
                }}
              />
              <Label htmlFor="cod-switch" className="cursor-pointer select-none">
                Cash on Delivery (COD)
              </Label>
            </div>
            {isCod && (
              <FormField label="COD Amount (PHP)" required>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={codAmount}
                  onChange={(e) => setCodAmount(e.target.value)}
                  className="w-48"
                />
              </FormField>
            )}
          </section>
        </div>

        {/* Footer */}
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
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
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
  // Normalize: API returns snake_case (is_active, provider_id); old mock used camelCase (isEnabled, providerId)
  const enabledProviders = (providersData?.providers ?? [])
    .filter((p: any) => p.is_active ?? p.isEnabled)
    .map((p: any) => ({
      ...p,
      providerId: p.provider_id ?? p.providerId,
      isEnabled: true,
    }))

  const handleCancel = async (orderId: string, trackingNumber: string) => {
    if (!window.confirm(`Cancel shipment ${trackingNumber}? This cannot be undone.`)) return
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
    new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })

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

            <Button variant="primary" size="small" onClick={() => setShowCreate(true)}>
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
            <option value="flyingtigers">Flying Tigers Express</option>
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
                <Button variant="secondary" size="small" onClick={() => setShowCreate(true)}>
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
                  <th className="px-6 py-3 text-left font-medium text-ui-fg-subtle">Carrier</th>
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
                        <span className="text-ui-fg-subtle text-xs">{formatDate(order.created_at)}</span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {order.tracking_number && (
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
