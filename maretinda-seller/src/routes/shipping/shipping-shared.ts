/**
 * Shared shipping helpers and constants.
 *
 * Used by the Shipments tab (list + create drawer) and the order-detail
 * "Courier Shipment" section so status labels, colours and the waybill
 * download behave identically everywhere.
 */
import { backendUrl, publishableApiKey } from '../../lib/client'

export const STATUS_COLORS: Record<
  string,
  'grey' | 'orange' | 'blue' | 'green' | 'red' | 'purple'
> = {
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

export const STATUS_LABELS: Record<string, string> = {
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

export const PROVIDER_LABELS: Record<string, string> = {
  ninjavan: 'Ninja Van',
  flyingtigers: 'Flying Tigers Express',
}

export const SERVICE_LEVELS = ['Standard', 'Express', 'Sameday', 'Nextday']

/**
 * Statuses in which a shipment is finished. A shipment in one of these states
 * can no longer be cancelled.
 */
export const TERMINAL_STATUSES = ['delivered', 'cancelled', 'failed', 'returned']

/**
 * Statuses that mean an order is already being shipped and must NOT be booked
 * again. Everything except a `cancelled` shipment counts — a cancelled booking
 * frees the order to be re-shipped.
 */
export const ACTIVE_SHIPMENT_STATUSES = Object.keys(STATUS_LABELS).filter(
  (s) => s !== 'cancelled'
)

/** True when this shipment still ties up its order (i.e. not cancelled). */
export function isActiveShipment(status: string): boolean {
  return status !== 'cancelled'
}

/** Derive a carrier service level from the customer's chosen shipping option. */
export function deriveServiceLevel(shippingOptionName: string): string {
  const name = (shippingOptionName ?? '').toLowerCase()
  if (name.includes('same') || name.includes('sameday')) return 'Sameday'
  if (name.includes('next') || name.includes('nextday')) return 'Nextday'
  if (name.includes('express')) return 'Express'
  return 'Standard'
}

/**
 * Download a shipment's waybill PDF. Surfaces the backend's own message for
 * carriers that don't expose a waybill via API (e.g. Flying Tigers → download
 * from their portal instead).
 */
export async function downloadWaybill(orderId: string, trackingNumber: string) {
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
  if (!response.ok) {
    let msg = 'Failed to get waybill'
    try {
      const body = await response.json()
      if (body?.message) msg = body.message
    } catch {
      /* non-JSON error body */
    }
    throw new Error(msg)
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `waybill-${trackingNumber}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
