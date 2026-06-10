export type FlashSaleStatus =
  | "draft"
  | "pending"
  | "scheduled"
  | "active"
  | "ended"
  | "cancelled"

export type DiscountType = "percentage" | "fixed"

export interface FlashSaleItem {
  id: string
  flash_sale_id: string
  product_id: string
  variant_id: string | null
  discount_type: DiscountType
  discount_value: number
  stock_limit: number | null
  sold_count: number
  created_at: string
  updated_at: string
  product?: any
}

export interface FlashSale {
  id: string
  title: string
  description: string | null
  starts_at: string
  ends_at: string
  status: FlashSaleStatus
  seller_id: string | null
  banner_image: string | null
  max_order_quantity: number | null
  created_by: string | null
  created_at: string
  updated_at: string
  item_count?: number
  items?: FlashSaleItem[]
}

export type StatusColor = "green" | "orange" | "red" | "grey" | "blue"

export const flashSaleStatusMap: Record<FlashSaleStatus, [StatusColor, string]> = {
  draft: ["grey", "Draft"],
  pending: ["orange", "Pending Approval"],
  scheduled: ["blue", "Scheduled"],
  active: ["green", "Live"],
  ended: ["grey", "Ended"],
  cancelled: ["red", "Cancelled / Rejected"],
}

export function getFlashSaleStatus(sale: FlashSale): [StatusColor, string] {
  return flashSaleStatusMap[sale.status] ?? ["grey", sale.status]
}

export function getTimeRemaining(endsAt: string): string {
  const ms = new Date(endsAt).getTime() - Date.now()
  if (ms <= 0) return "Ended"
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`
  return `${h}h ${m}m`
}
