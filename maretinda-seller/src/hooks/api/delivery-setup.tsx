import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query"

import { fetchQuery } from "../../lib/client"
import { queryClient } from "../../lib/query-client"

export type Pickup = {
  name: string
  address_1: string
  address_2: string | null
  city: string
  province: string
  postal_code: string
  phone: string
}

export type DeliveryCode = "standard" | "express"

export type DeliverySetup = {
  location: (Pickup & { id: string }) | null
  options: { id: string; name: string; code: string | null; fee: number | null }[]
  /** What still keeps buyers from checking out, in plain words. */
  missing: string[]
  ready: boolean
  suggested_pickup: Pickup
}

const DELIVERY_KEY = ["vendor", "delivery-setup"]
const STOCK_KEY = ["vendor", "stock"]

export const useDeliverySetup = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: DELIVERY_KEY,
    queryFn: () => fetchQuery("/vendor/delivery-setup", { method: "GET" }) as Promise<DeliverySetup>,
    ...options,
  })

export const useSaveDeliverySetup = () =>
  useMutation({
    mutationFn: (body: { pickup: Pickup; fees: Record<DeliveryCode, string | number | null> }) =>
      fetchQuery("/vendor/delivery-setup", { method: "POST", body }) as Promise<DeliverySetup & { published: number }>,
    // The locations and shipping screens show the same records, and held products may have gone live
    onSuccess: () => queryClient.invalidateQueries(),
  })

export type StockFilter = "all" | "unset" | "low" | "out"

export type StockRow = {
  variant_id: string
  product_id: string
  product_title: string
  variant_title: string | null
  sku: string | null
  thumbnail: string | null
  status: string
  on_hand: number | null
  reserved: number
  available: number
  elsewhere: number
  kind: "tracked" | "unlimited" | "bundle"
}

export type StockList = {
  stock: StockRow[]
  count: number
  counts: Record<StockFilter, number>
  low_at: number
  has_location: boolean
}

export const useStock = (params: { q?: string; product_id?: string; filter?: StockFilter; limit?: number; offset?: number }) => {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== "") query.set(key, String(value))
  return useQuery({
    queryKey: [...STOCK_KEY, query.toString()],
    queryFn: () => fetchQuery(`/vendor/stock?${query}`, { method: "GET" }) as Promise<StockList>,
    placeholderData: keepPreviousData,
  })
}

export const useSaveStock = () =>
  useMutation({
    mutationFn: (updates: { variant_id: string; quantity: string }[]) =>
      fetchQuery("/vendor/stock", { method: "POST", body: { updates } }) as Promise<{ saved: number }>,
    onSuccess: () => queryClient.invalidateQueries(),
  })
