import { useQuery } from "@tanstack/react-query"
import { fetchQuery } from "../../lib/client"

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  features: Record<string, unknown> | null
  status: "active" | "inactive"
}

export interface VendorSubscription {
  id: string
  vendor_id: string
  plan_name: string
  price: number
  start_date: string
  end_date: string | null
  status: "active" | "expired" | "cancelled"
  payment_reference: string | null
  created_at: string
}

export interface SubscriptionStatusResponse {
  has_subscription: boolean
  subscription: VendorSubscription | null
  plan: SubscriptionPlan | null
}

const SUBSCRIPTION_KEY = ["vendor-subscription"] as const

export const useSubscriptionStatus = () => {
  return useQuery<SubscriptionStatusResponse>({
    queryKey: SUBSCRIPTION_KEY,
    queryFn: () => fetchQuery("/vendor/subscription/status", { method: "GET" }),
    staleTime: 1000 * 60 * 5,
  })
}
