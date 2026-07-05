'use client'

import {
  Container,
  Heading,
  Text,
  Button,
  StatusBadge,
  Badge,
  toast,
} from '@medusajs/ui'
import {
  TruckFast,
  Plus,
  XCircle,
  ArrowDownTray,
  MagnifyingGlass,
} from '@medusajs/icons'
import { useState } from 'react'
import {
  useShippingOrders,
  useCreateShippingOrder,
  useShippingProviders,
} from '../../../hooks/api/shipping'
import { CreateShipmentDrawer } from './create-shipment-drawer'
import {
  STATUS_COLORS,
  STATUS_LABELS,
  PROVIDER_LABELS,
  TERMINAL_STATUSES,
  downloadWaybill,
} from '../shipping-shared'

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
