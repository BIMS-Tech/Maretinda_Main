/**
 * Payload of the order.placed event. Mercur's split checkout (b2c-core 1.5+)
 * emits one event per cart with every seller order in `order_ids`; Medusa's
 * own completeCartWorkflow still emits `{ id }` per order.
 */
export type OrderPlacedData = { id?: string; order_ids?: string[] }

export function placedOrderIds(data: OrderPlacedData): string[] {
  if (Array.isArray(data?.order_ids)) return data.order_ids
  return data?.id ? [data.id] : []
}
