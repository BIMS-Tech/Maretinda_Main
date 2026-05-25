'use server'

const BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'

export interface FlashSaleItem {
  id: string
  product_id: string
  variant_id: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  stock_limit: number | null
  sold_count: number
  product?: any
}

export interface FlashSale {
  id: string
  title: string
  description: string | null
  starts_at: string
  ends_at: string
  status: string
  banner_image: string | null
  max_order_quantity: number | null
  items: FlashSaleItem[]
}

export async function getActiveFlashSale(): Promise<FlashSale | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/store/flash-sales`, {
      next: { revalidate: 30 },
      headers: {
        'x-publishable-api-key':
          process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
      },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.flash_sale || null
  } catch {
    return null
  }
}

export type ActiveFlashSaleItem = FlashSaleItem & { ends_at: string; sale_title: string }

/**
 * Returns the flash sale item for a specific product if it is currently in an
 * active flash sale, or null otherwise. Reuses the cached active-sale fetch so
 * there is no extra network round-trip on the product page.
 */
export async function getFlashSaleForProduct(
  productId: string
): Promise<ActiveFlashSaleItem | null> {
  const sale = await getActiveFlashSale()
  if (!sale) return null
  const item = sale.items?.find((i) => i.product_id === productId)
  if (!item) return null
  return { ...item, ends_at: sale.ends_at, sale_title: sale.title }
}
