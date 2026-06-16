import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../lib/client"

export type AdminShippingOrder = {
  id: string
  seller_id: string
  seller_name: string | null
  medusa_order_id: string | null
  provider: string
  country_code: string | null
  provider_order_id: string | null
  tracking_number: string | null
  tracking_url: string | null
  status: string
  amount: string | number | null
  currency: string | null
  service_level: string | null
  from_details: any
  to_details: any
  parcel_details: any
  created_at: string
  updated_at: string
}

export type AdminShippingOrdersSummary = {
  totalOrders: number
  totalCost: number
  delivered: number
  pending: number
  cancelled: number
  sellerCount: number
  byProvider: Record<string, number>
}

export type AdminShippingOrderFilters = {
  seller_id?: string
  provider?: string
  status?: string
  search?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}

const QUERY_KEY = ["admin", "shipping-orders"]

export function useAdminShippingOrders(filters: AdminShippingOrderFilters = {}) {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: [...QUERY_KEY, filters],
    queryFn: async () => {
      const query: Record<string, string> = {}
      for (const [k, v] of Object.entries(filters)) {
        if (v !== undefined && v !== null && v !== "") query[k] = String(v)
      }
      const result = await sdk.client.fetch("/admin/shipping-orders", { method: "GET", query })
      return result as {
        orders: AdminShippingOrder[]
        count: number
        hasMore: boolean
        summary: AdminShippingOrdersSummary
      }
    },
  })

  return {
    orders: data?.orders ?? [],
    count: data?.count ?? 0,
    hasMore: data?.hasMore ?? false,
    summary: data?.summary,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  }
}

export function useAdminShippingOrderAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      action: "cancel-order" | "get-tracking"
      orderId: string
      reason?: string
    }) => {
      const result = await sdk.client.fetch("/admin/shipping-orders", { method: "POST", body: payload })
      return result as any
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

/** Download a waybill PDF for any seller's order (admin). */
export async function downloadAdminWaybill(orderId: string, trackingNumber: string | null) {
  const token = localStorage.getItem("medusa_admin_jwt")
  const response = await fetch(`${__BACKEND_URL__}/admin/shipping-orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action: "get-waybill", orderId }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || "Failed to download waybill")
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `waybill-${trackingNumber ?? orderId}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
