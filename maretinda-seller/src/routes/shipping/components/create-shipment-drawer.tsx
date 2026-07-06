'use client'

import {
  Heading,
  Text,
  Button,
  Input,
  Label,
  Switch,
  Badge,
  toast,
} from '@medusajs/ui'
import {
  MagnifyingGlass,
  XMark,
  CheckCircle,
} from '@medusajs/icons'
import { useState, useEffect, useMemo } from 'react'
import {
  useCreateShippingOrder,
  useShippingOrders,
  useShippingRates,
} from '../../../hooks/api/shipping'
import { useOrders } from '../../../hooks/api/orders'
import { useStockLocations } from '../../../hooks/api/stock-locations'
import { useMe } from '../../../hooks/api/users'
import { fetchQuery } from '../../../lib/client'
import {
  SERVICE_LEVELS,
  deriveServiceLevel,
  isActiveShipment,
} from '../shipping-shared'

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

export function CreateShipmentDrawer({
  enabledProviders,
  onClose,
  onCreated,
  initialOrder,
  lockOrder = false,
}: {
  enabledProviders: any[]
  onClose: () => void
  onCreated: () => void
  /** Pre-select and pre-fill from this order (e.g. opened from an order page). */
  initialOrder?: any
  /** When true the order can't be changed — used from the order detail page. */
  lockOrder?: boolean
}) {
  // Order picker
  const [orderSearch, setOrderSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<any>(initialOrder ?? null)

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
  // COD is locked off once we know the linked order was paid online (nothing
  // to collect). Stays unlocked for COD orders and manual (no-order) bookings.
  const [codLocked, setCodLocked] = useState(false)
  // Shipping fee the customer paid at checkout (major-unit pesos), for margin.
  const [customerShipping, setCustomerShipping] = useState<number | null>(
    initialOrder && typeof initialOrder.shipping_total === 'number'
      ? initialOrder.shipping_total
      : null
  )

  const { mutateAsync: createOrder, isPending } = useCreateShippingOrder()

  // Fetch seller's orders for picker (skipped when the order is locked).
  const { orders: vendorOrders = [] } = useOrders(
    {
      limit: 50,
      fields:
        'id,display_id,email,*shipping_address,*items,total,currency_code,payment_status,*shipping_methods',
    } as any,
    { enabled: !lockOrder }
  )

  // Existing shipments — used to block re-shipping orders that already have an
  // active (non-cancelled) booking. Pull a wide page so the block set stays
  // reliable for sellers with many shipments.
  const { data: shippingData } = useShippingOrders({ limit: '200' })
  const shippedOrderIds = useMemo(() => {
    const map = new Map<string, any>()
    for (const s of (shippingData?.orders ?? []) as any[]) {
      if (s.medusa_order_id && isActiveShipment(s.status)) {
        map.set(s.medusa_order_id, s)
      }
    }
    return map
  }, [shippingData])

  // Seller profile — provides the sender's business name + phone.
  const { seller } = useMe()

  // Fetch seller's locations for sender auto-fill
  const { stock_locations: locations = [] } = useStockLocations(
    { fields: 'name,*address', limit: 1 } as any
  )

  // Auto-fill sender identity (name + phone) from the seller's profile.
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

  /**
   * Fill recipient + parcel + service level from an order. When `fetchDetail`
   * is set, load the full order first (the list endpoint doesn't reliably
   * expand shipping_address); otherwise use the order object as given.
   */
  const fillFromOrder = async (order: any, fetchDetail: boolean) => {
    // The list endpoint doesn't reliably expand address / payment info, so when
    // selecting from the picker we load the full order (which does).
    let full = order
    if (fetchDetail) {
      try {
        const res: any = await fetchQuery(`/vendor/orders/${order.id}`, {
          method: 'GET',
          query: {
            fields:
              'id,total,shipping_total,payment_status,currency_code,*shipping_address,*items,*shipping_methods,*payment_collections.payments,*split_order_payment',
          },
        })
        if (res?.order) full = { ...order, ...res.order }
      } catch {
        // Fall back to whatever the caller provided.
      }
    }

    const addr = full.shipping_address
    const items = full.items ?? []

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
    // Auto-derive service level from the customer's chosen shipping option.
    const chosenOption = full.shipping_methods?.[0]?.name ?? ''
    if (chosenOption) setServiceLevel(deriveServiceLevel(chosenOption))

    // Shipping fee the customer paid at checkout (major-unit pesos) — used to
    // show the seller's margin against the courier cost.
    setCustomerShipping(
      typeof full.shipping_total === 'number' ? full.shipping_total : null
    )

    // COD vs prepaid: an order only counts as paid-online when money has
    // actually been captured. Anything still awaiting/pending (nothing captured)
    // is collected on delivery, so COD is switched on with the pending amount.
    // A truly prepaid order (e.g. GiyaPay, captured) has nothing to collect, so
    // COD is switched off and locked. This mirrors what the order Payment
    // section shows ("Awaiting" ⇒ captured_amount 0 ⇒ COD).
    const split = full.split_order_payment
    const capturedAmount = Number(split?.captured_amount ?? 0)
    const PAID_STATUSES = ['captured', 'partially_captured', 'refunded', 'partially_refunded']
    const isPrepaid = capturedAmount > 0 || PAID_STATUSES.includes(full.payment_status)
    const isCodOrder = !isPrepaid

    // Amount to collect = what's still outstanding (falls back to the total).
    const pending =
      split != null
        ? Math.max(0, Number(split.authorized_amount ?? full.total ?? 0) - capturedAmount)
        : Number(full.total ?? order.total ?? 0)

    setCodLocked(!isCodOrder)
    setIsCod(isCodOrder)
    // Medusa amounts are already major-unit pesos — do NOT divide by 100.
    setCodAmount(isCodOrder ? String(pending || full.total || order.total || '') : '')
  }

  // Prefill immediately when opened for a specific order.
  useEffect(() => {
    if (initialOrder) {
      fillFromOrder(initialOrder, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleOrderSelect = async (order: any) => {
    setSelectedOrder(order)
    await fillFromOrder(order, true)
  }

  const resetOrder = () => {
    setSelectedOrder(null)
    setOrderSearch('')
    setToName(''); setToPhone(''); setToAddress('')
    setToCity(''); setToState(''); setToPostcode('')
    setIsCod(false); setCodAmount(''); setCodLocked(false)
    setCustomerShipping(null)
    setDescription('Marketplace goods')
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

    // Guard against double-booking an order that already has an active shipment.
    if (selectedOrder && shippedOrderIds.has(selectedOrder.id)) {
      return toast.error('This order already has an active shipment. Cancel it before booking again.')
    }

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

  // ── Cost & margin estimate ──────────────────────────────────────────────────
  const weightNum = parseFloat(weight)
  const hasValidWeight = !Number.isNaN(weightNum) && weightNum > 0

  const { data: ratesData, isFetching: ratesLoading } = useShippingRates(
    {
      origin_postal: fromPostcode,
      dest_postal: toPostcode,
      weight_kg: weight,
      length_cm: length,
      width_cm: width,
      height_cm: height,
      is_cod: isCod,
    },
    !!provider && hasValidWeight
  )

  // Pick the rate for the chosen carrier + service level; fall back to that
  // carrier's cheapest option when the exact service level isn't rate-carded.
  const providerRates = (ratesData?.rates ?? []).filter((r) => r.provider_id === provider)
  const matchedRate =
    providerRates.find(
      (r) => (r.service_type ?? '').toLowerCase() === serviceLevel.toLowerCase()
    ) ??
    [...providerRates].sort((a, b) => a.rate - b.rate)[0] ??
    null

  const courierCost = matchedRate?.rate ?? null
  const margin =
    courierCost != null && customerShipping != null ? customerShipping - courierCost : null

  const peso = (n: number) =>
    '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-lg bg-ui-bg-base shadow-xl flex flex-col overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-ui-border-base bg-ui-bg-base">
          <div>
            <Heading level="h3">Create Shipment</Heading>
            <Text className="text-xs text-ui-fg-muted">
              {lockOrder
                ? 'Book a courier pickup for this order'
                : 'Select an order — address details fill automatically'}
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
                {!lockOrder && (
                  <button
                    className="text-xs text-ui-fg-muted hover:text-ui-fg-base ml-3 flex-shrink-0"
                    onClick={resetOrder}
                  >
                    Change
                  </button>
                )}
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
                      const existing = shippedOrderIds.get(order.id)
                      const alreadyShipped = !!existing
                      return (
                        <button
                          key={order.id}
                          disabled={alreadyShipped}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                            alreadyShipped
                              ? 'opacity-60 cursor-not-allowed'
                              : 'hover:bg-ui-bg-base'
                          }`}
                          onClick={() => !alreadyShipped && handleOrderSelect(order)}
                          title={
                            alreadyShipped
                              ? `Already shipped — tracking ${existing.tracking_number ?? existing.id}`
                              : undefined
                          }
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <Text size="small" weight="plus">Order #{order.display_id}</Text>
                              {alreadyShipped && (
                                <Badge size="2xsmall" color="green">Shipped</Badge>
                              )}
                            </div>
                            <Text size="xsmall" className="text-ui-fg-subtle">
                              {order.shipping_address?.first_name} {order.shipping_address?.last_name}
                              {order.email ? ` · ${order.email}` : ''}
                            </Text>
                            {alreadyShipped ? (
                              <Text size="xsmall" className="text-ui-fg-muted">
                                Tracking {existing.tracking_number ?? '—'}
                              </Text>
                            ) : (
                              chosenShipping && (
                                <Text size="xsmall" className="text-ui-fg-muted">
                                  🚚 {chosenShipping}
                                </Text>
                              )
                            )}
                          </div>
                          <Text size="xsmall" className="text-ui-fg-muted flex-shrink-0 ml-3">
                            {order.currency_code?.toUpperCase()}{' '}
                            {(order.total ?? 0).toLocaleString()}
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
                readOnly
                disabled
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
                disabled={codLocked}
                onCheckedChange={(v) => {
                  setIsCod(v)
                  if (!v) setCodAmount('')
                }}
              />
              <Label
                htmlFor="cod-switch"
                className={`select-none ${codLocked ? 'text-ui-fg-muted' : 'cursor-pointer'}`}
              >
                Cash on Delivery (COD)
              </Label>
              {codLocked && (
                <Badge size="2xsmall" color="green">Paid online</Badge>
              )}
            </div>
            {codLocked ? (
              <Text size="xsmall" className="text-ui-fg-muted">
                This order was already paid online — there's nothing to collect on delivery.
              </Text>
            ) : (
              isCod && (
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
              )
            )}
          </section>

          <div className="border-t border-ui-border-base" />

          {/* Step 6 — Cost & margin */}
          <section className="flex flex-col gap-3">
            <SectionHeading step={6} title="Cost & margin" />
            <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-4 flex flex-col gap-2">
              {!hasValidWeight ? (
                <Text size="xsmall" className="text-ui-fg-muted">
                  Enter the parcel weight above to estimate the courier cost and your margin.
                </Text>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <Text size="small" className="text-ui-fg-subtle">Courier cost (you pay)</Text>
                    <Text size="small" weight="plus" className="text-ui-fg-base">
                      {courierCost != null
                        ? peso(courierCost)
                        : ratesLoading
                          ? 'Estimating…'
                          : 'Unavailable'}
                    </Text>
                  </div>
                  {matchedRate && (
                    <Text size="xsmall" className="text-ui-fg-muted -mt-1">
                      {matchedRate.service_label}
                    </Text>
                  )}

                  {customerShipping != null && (
                    <div className="flex items-center justify-between">
                      <Text size="small" className="text-ui-fg-subtle">
                        Shipping charged to customer
                      </Text>
                      <Text size="small" weight="plus" className="text-ui-fg-base">
                        {peso(customerShipping)}
                      </Text>
                    </div>
                  )}

                  {margin != null && (
                    <>
                      <div className="border-t border-ui-border-base my-1" />
                      <div className="flex items-center justify-between">
                        <Text size="small" weight="plus" className="text-ui-fg-base">
                          Your margin
                        </Text>
                        <Text
                          size="small"
                          weight="plus"
                          className={margin >= 0 ? 'text-ui-tag-green-text' : 'text-ui-tag-red-text'}
                        >
                          {margin < 0 ? '-' : ''}{peso(Math.abs(margin))}
                        </Text>
                      </div>
                    </>
                  )}

                  {courierCost != null ? (
                    <Text size="xsmall" className="text-ui-fg-muted">
                      Estimated from carrier rate cards — the final charge is confirmed by the carrier.
                    </Text>
                  ) : (
                    !ratesLoading && (
                      <Text size="xsmall" className="text-ui-fg-muted">
                        No live estimate for this carrier — check your carrier portal for the exact rate.
                      </Text>
                    )
                  )}
                </>
              )}
            </div>
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

export default CreateShipmentDrawer
