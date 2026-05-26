import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchQuery, backendUrl, publishableApiKey } from "../../lib/client/client"

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  yearly_price: number | null
  features: Record<string, unknown> | null
  status: "active" | "inactive"
}

export interface VendorSubscription {
  id: string
  vendor_id: string
  plan_id: string | null
  plan_name: string
  price: number
  billing_period: "monthly" | "yearly"
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

export interface CheckoutResponse {
  checkout_url: string
  form_data: Record<string, string>
  enabled_methods: string[]
  plan: SubscriptionPlan
  billing_period: "monthly" | "yearly"
}

const SUBSCRIPTION_KEY = ["vendor-subscription"] as const
const PLANS_KEY = ["subscription-plans"] as const

export const useSubscriptionStatus = () => {
  return useQuery<SubscriptionStatusResponse>({
    queryKey: SUBSCRIPTION_KEY,
    queryFn: () => fetchQuery("/vendor/subscription/status", { method: "GET" }),
    staleTime: 1000 * 60 * 5,
  })
}

export const useSubscriptionPlans = () => {
  return useQuery<{ plans: SubscriptionPlan[] }>({
    queryKey: PLANS_KEY,
    queryFn: async () => {
      const bearer = window.localStorage.getItem("medusa_auth_token") || ""
      const res = await fetch(`${backendUrl}/store/subscription/plans`, {
        headers: {
          "x-publishable-api-key": publishableApiKey,
          authorization: `Bearer ${bearer}`,
        },
      })
      if (!res.ok) throw new Error("Failed to load plans")
      return res.json()
    },
    staleTime: 1000 * 60 * 10,
  })
}

export const useSubscriptionCheckout = () => {
  const qc = useQueryClient()
  return useMutation<
    CheckoutResponse,
    Error,
    { plan_name: string; billing_period: "monthly" | "yearly" }
  >({
    mutationFn: (payload) =>
      fetchQuery("/vendor/subscription/checkout", {
        method: "POST",
        body: payload,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SUBSCRIPTION_KEY })
    },
  })
}
