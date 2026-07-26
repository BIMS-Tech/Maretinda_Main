import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchQuery } from "../../lib/client/client"

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  yearly_price: number | null
  yearly_discount_percent: number | null
  trial_days: number
  features: Record<string, unknown> | null
  status: "active" | "inactive"
}

export interface sellersubscription {
  id: string
  seller_id: string
  plan_id: string | null
  plan_name: string
  price: number
  billing_period: "monthly" | "yearly"
  start_date: string
  end_date: string | null
  is_trial: boolean
  trial_ends_at: string | null
  status: "active" | "expired" | "cancelled"
  payment_reference: string | null
  created_at: string
}

export interface SubscriptionStatusResponse {
  has_subscription: boolean
  has_ever_subscribed: boolean
  subscription: sellersubscription | null
  plan: SubscriptionPlan | null
}

export interface CheckoutResponse {
  checkout_url: string
  form_data: Record<string, string>
  enabled_methods: string[]
  plan: SubscriptionPlan
  billing_period: "monthly" | "yearly"
}

export interface ActivateResponse {
  success: boolean
  subscription: sellersubscription
  plan: SubscriptionPlan
  already_activated?: boolean
}

const SUBSCRIPTION_KEY = ["seller-subscription"] as const
const PLANS_KEY = ["subscription-plans"] as const

export const useSubscriptionStatus = () => {
  return useQuery<SubscriptionStatusResponse>({
    queryKey: SUBSCRIPTION_KEY,
    queryFn: () => fetchQuery("/vendor/subscription/status", { method: "GET" }),
    staleTime: 1000 * 60 * 5,
  })
}

export const isSubscriptionActive = (
  data?: SubscriptionStatusResponse
): boolean =>
  data?.has_subscription === true && data?.subscription?.status === "active"

/**
 * `/subscription` is the one page an unsubscribed seller may open. Matched
 * exactly so sibling routes like `/subscription-products` stay gated.
 */
export const isSubscriptionRoute = (pathname: string): boolean =>
  pathname === "/subscription" || pathname.startsWith("/subscription/")

export const useSubscriptionPlans = () => {
  return useQuery<{ plans: SubscriptionPlan[] }>({
    queryKey: PLANS_KEY,
    queryFn: () => fetchQuery("/vendor/subscription/plans", { method: "GET" }),
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
      fetchQuery("/vendor/subscription/checkout", { method: "POST", body: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SUBSCRIPTION_KEY }),
  })
}

export const useActivateSubscription = () => {
  const qc = useQueryClient()
  return useMutation<
    ActivateResponse,
    Error,
    { order_id: string; refno: string; nonce: string; timestamp: string; amount: string; signature: string }
  >({
    mutationFn: (payload) =>
      fetchQuery("/vendor/subscription/activate", { method: "POST", body: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SUBSCRIPTION_KEY }),
  })
}

export const useStartTrial = () => {
  const qc = useQueryClient()
  return useMutation<
    { success: boolean; subscription: sellersubscription },
    Error,
    { plan_name: string }
  >({
    mutationFn: (payload) =>
      fetchQuery("/vendor/subscription/trial", { method: "POST", body: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SUBSCRIPTION_KEY }),
  })
}
