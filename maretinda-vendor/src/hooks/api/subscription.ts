import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchQuery } from "../../lib/client/client"

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  yearly_price: number | null
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
  status: "active" | "expired" | "cancelled"
  payment_reference: string | null
  created_at: string
}

export interface SubscriptionStatusResponse {
  has_subscription: boolean
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
    queryFn: () => fetchQuery("/seller/subscription/status", { method: "GET" }),
    staleTime: 1000 * 60 * 5,
  })
}

export const useSubscriptionPlans = () => {
  return useQuery<{ plans: SubscriptionPlan[] }>({
    queryKey: PLANS_KEY,
    queryFn: () => fetchQuery("/seller/subscription/plans", { method: "GET" }),
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
      fetchQuery("/seller/subscription/checkout", {
        method: "POST",
        body: payload,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SUBSCRIPTION_KEY })
    },
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
      fetchQuery("/seller/subscription/activate", {
        method: "POST",
        body: payload,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SUBSCRIPTION_KEY })
    },
  })
}
