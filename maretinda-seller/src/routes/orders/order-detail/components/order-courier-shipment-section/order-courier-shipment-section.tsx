import { HttpTypes } from "@medusajs/types"
import {
  Button,
  Container,
  Heading,
  StatusBadge,
  Badge,
  Text,
  toast,
} from "@medusajs/ui"
import { TruckFast, Plus, XCircle, ArrowDownTray } from "@medusajs/icons"
import { useState } from "react"
import {
  useShippingOrders,
  useShippingProviders,
  useCreateShippingOrder,
} from "../../../../../hooks/api/shipping"
import { CreateShipmentDrawer } from "../../../../shipping/components/create-shipment-drawer"
import {
  STATUS_COLORS,
  STATUS_LABELS,
  PROVIDER_LABELS,
  TERMINAL_STATUSES,
  isActiveShipment,
  downloadWaybill,
} from "../../../../shipping/shipping-shared"

type OrderCourierShipmentSectionProps = {
  order: HttpTypes.AdminOrder
}

/**
 * Book and track a courier pickup (Ninja Van / Flying Tigers) for this order,
 * without leaving the order page. Mirrors the Shipments tab, scoped to one order.
 *
 * Guardrails:
 *  - Once an active (non-cancelled) shipment exists, the "Book Courier" action
 *    is hidden so the same order can't be shipped twice.
 *  - A cancelled shipment frees the order to be re-booked.
 */
export const OrderCourierShipmentSection = ({
  order,
}: OrderCourierShipmentSectionProps) => {
  const [showCreate, setShowCreate] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const { data, isLoading, refetch } = useShippingOrders({
    medusa_order_id: order.id,
  })
  const { data: providersData } = useShippingProviders()
  const { mutateAsync: mutateShipment } = useCreateShippingOrder()

  const shipments = (data?.orders ?? []) as any[]
  const activeShipments = shipments.filter((s) => isActiveShipment(s.status))
  const hasActiveShipment = activeShipments.length > 0

  const enabledProviders = (providersData?.providers ?? [])
    .filter((p: any) => p.is_active ?? p.isEnabled)
    .map((p: any) => ({
      ...p,
      providerId: p.provider_id ?? p.providerId,
      isEnabled: true,
    }))

  const handleCancel = async (shipmentId: string, trackingNumber: string) => {
    if (!window.confirm(`Cancel shipment ${trackingNumber}? This cannot be undone.`)) return
    setCancellingId(shipmentId)
    try {
      const res: any = await mutateShipment({ action: "cancel-order", orderId: shipmentId })
      toast.success(res?.message ?? "Shipment cancelled")
      refetch()
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to cancel")
    } finally {
      setCancellingId(null)
    }
  }

  const handleWaybill = async (shipmentId: string, trackingNumber: string) => {
    setDownloadingId(shipmentId)
    try {
      await downloadWaybill(shipmentId, trackingNumber)
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to download waybill")
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Heading level="h2">Courier Shipment</Heading>
            {hasActiveShipment && (
              <Badge size="2xsmall" color="green">Shipped</Badge>
            )}
          </div>

          {!hasActiveShipment && order.status !== "canceled" && (
            <Button
              size="small"
              variant="secondary"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-4 w-4" />
              Book Courier
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="px-6 py-6">
            <div className="h-12 rounded-lg bg-ui-bg-subtle animate-pulse" />
          </div>
        ) : shipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-8 text-center">
            <TruckFast className="h-8 w-8 text-ui-fg-muted" />
            <Text size="small" className="text-ui-fg-muted max-w-xs">
              No courier booked yet. Book a pickup to generate a tracking number
              and waybill for this order.
            </Text>
          </div>
        ) : (
          <div className="divide-y">
            {shipments.map((s) => {
              const isTerminal = TERMINAL_STATUSES.includes(s.status)
              const isCancelling = cancellingId === s.id
              const isDownloading = downloadingId === s.id

              return (
                <div
                  key={s.id}
                  className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      {s.tracking_number ? (
                        <span className="font-mono text-sm font-medium text-ui-fg-base">
                          {s.tracking_number}
                        </span>
                      ) : (
                        <span className="text-xs text-ui-fg-muted">Pending</span>
                      )}
                      <Badge size="2xsmall" color="blue">
                        {PROVIDER_LABELS[s.provider] ?? s.provider}
                      </Badge>
                      <StatusBadge color={STATUS_COLORS[s.status] ?? "grey"}>
                        {STATUS_LABELS[s.status] ?? s.status}
                      </StatusBadge>
                    </div>
                    {s.tracking_url && (
                      <a
                        href={s.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-ui-fg-interactive hover:underline"
                      >
                        Track online
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {s.tracking_number && (
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleWaybill(s.id, s.tracking_number)}
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
                        onClick={() => handleCancel(s.id, s.tracking_number ?? s.id)}
                        isLoading={isCancelling}
                        className="text-ui-tag-red-text hover:bg-ui-tag-red-bg"
                        title="Cancel shipment"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Container>

      {showCreate && (
        <CreateShipmentDrawer
          enabledProviders={enabledProviders}
          initialOrder={order}
          lockOrder
          onClose={() => setShowCreate(false)}
          onCreated={() => refetch()}
        />
      )}
    </>
  )
}
