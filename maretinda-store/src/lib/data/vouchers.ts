'use server'

import { getAuthHeaders } from './cookies'

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''

export interface VoucherPromotion {
  id: string
  code: string
  type: string
  status?: string
  description?: string
  discount_label: string
  min_order?: number
  scope: 'platform' | 'seller'
  seller_id?: string
  seller_name?: string
  expires_at?: string | null
  is_collected?: boolean
  collected_voucher_id?: string
  metadata?: Record<string, any> | null
}

const baseHeaders = () => ({
  'x-publishable-api-key': PUB_KEY,
  'Content-Type': 'application/json',
})

/** Fetch all available vouchers (public). Marks collected status for logged-in users. */
export async function getAvailableVouchers(): Promise<VoucherPromotion[]> {
  try {
    const authHeaders = await getAuthHeaders()
    const res = await fetch(`${BACKEND_URL}/store/vouchers`, {
      headers: { ...baseHeaders(), ...authHeaders },
      next: { revalidate: 60, tags: ['vouchers'] },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.vouchers || []
  } catch {
    return []
  }
}

/** Fetch vouchers the logged-in customer has collected. */
export async function getMyVouchers(): Promise<VoucherPromotion[]> {
  try {
    const authHeaders = await getAuthHeaders()
    const res = await fetch(`${BACKEND_URL}/store/vouchers/my`, {
      headers: { ...baseHeaders(), ...authHeaders },
      next: { revalidate: 0, tags: ['my-vouchers'] },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.vouchers || []
  } catch {
    return []
  }
}

/** Collect a voucher into the customer's wallet. */
export async function collectVoucher(promotionId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const authHeaders = await getAuthHeaders()
    const res = await fetch(`${BACKEND_URL}/store/vouchers/collect`, {
      method: 'POST',
      headers: { ...baseHeaders(), ...authHeaders },
      body: JSON.stringify({ promotion_id: promotionId }),
    })
    if (!res.ok) {
      const data = await res.json()
      return { success: false, message: data.message || 'Failed to collect voucher' }
    }
    return { success: true }
  } catch {
    return { success: false, message: 'Network error' }
  }
}

/** Remove a voucher from the customer's wallet. */
export async function removeVoucher(promotionId: string): Promise<{ success: boolean }> {
  try {
    const authHeaders = await getAuthHeaders()
    const res = await fetch(`${BACKEND_URL}/store/vouchers/collect`, {
      method: 'DELETE',
      headers: { ...baseHeaders(), ...authHeaders },
      body: JSON.stringify({ promotion_id: promotionId }),
    })
    return { success: res.ok }
  } catch {
    return { success: false }
  }
}
