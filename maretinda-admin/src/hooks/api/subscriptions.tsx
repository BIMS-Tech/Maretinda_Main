import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sdk } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-key-factory'

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  yearly_price: number | null
  features: Record<string, unknown> | null
  status: 'active' | 'inactive'
}

export interface sellersubscription {
  id: string
  seller_id: string
  plan_name: string
  price: number
  billing_period: 'monthly' | 'yearly'
  start_date: string
  end_date: string
  status: 'active' | 'expired' | 'cancelled'
  payment_reference: string | null
  created_at: string
}

export interface SubscriptionGiyaPayConfig {
  id: string
  merchant_id: string
  merchant_secret: string
  sandbox_mode: boolean
  is_enabled: boolean
}

export const subscriptionQueryKeys = queryKeysFactory('subscriptions')
export const subscriptionPlanQueryKeys = queryKeysFactory('subscription-plans')
export const subscriptionConfigQueryKeys = queryKeysFactory('subscription-giyapay-config')

// List all seller subscriptions
export const useAdminSubscriptions = (filters?: {
  status?: string
  seller_id?: string
  limit?: number
  offset?: number
}) => {
  const query = new URLSearchParams()
  if (filters?.status) query.set('status', filters.status)
  if (filters?.seller_id) query.set('seller_id', filters.seller_id)
  if (filters?.limit) query.set('limit', String(filters.limit))
  if (filters?.offset) query.set('offset', String(filters.offset))
  const qs = query.toString()

  return useQuery<{ subscriptions: sellersubscription[]; count: number; limit: number; offset: number }>({
    queryKey: subscriptionQueryKeys.list([filters]),
    queryFn: async () => {
      const result = await sdk.client.fetch(`/admin/subscriptions${qs ? `?${qs}` : ''}`, {
        method: 'GET',
      })
      return result as any
    },
    staleTime: 30_000,
  })
}

// Activate / deactivate a subscription
export const useUpdateSubscriptionStatus = () => {
  const qc = useQueryClient()
  return useMutation<{ subscription: sellersubscription }, Error, { id: string; status: 'active' | 'cancelled' }>({
    mutationFn: async ({ id, status }) => {
      const result = await sdk.client.fetch(`/admin/subscriptions/${id}`, {
        method: 'PATCH',
        body: { status } as any,
      })
      return result as any
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subscriptionQueryKeys.lists() })
    },
  })
}

// Manually assign a plan to a seller
export const useAdminAssignSubscription = () => {
  const qc = useQueryClient()
  return useMutation<
    { subscription: sellersubscription },
    Error,
    { seller_id: string; plan_name: string; duration_days?: number }
  >({
    mutationFn: async (payload) => {
      const result = await sdk.client.fetch('/admin/subscriptions/assign', {
        method: 'POST',
        body: payload as any,
      })
      return result as any
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subscriptionQueryKeys.lists() })
    },
  })
}

// List all subscription plans (admin)
export const useAdminSubscriptionPlans = () => {
  const { data, ...rest } = useQuery<{ plans: SubscriptionPlan[] }>({
    queryKey: subscriptionPlanQueryKeys.list([]),
    queryFn: async () => {
      const result = await sdk.client.fetch('/admin/subscriptions/plans', { method: 'GET' })
      return result as any
    },
    staleTime: 60_000,
  })
  return { plans: data?.plans ?? [], ...rest }
}

// Update a subscription plan
export const useUpdateSubscriptionPlan = () => {
  const qc = useQueryClient()
  return useMutation<
    { plan: SubscriptionPlan },
    Error,
    { plan_id: string; price?: number; yearly_price?: number; features?: Record<string, unknown>; status?: 'active' | 'inactive' }
  >({
    mutationFn: async (payload) => {
      const result = await sdk.client.fetch('/admin/subscriptions/plans', {
        method: 'PATCH',
        body: payload as any,
      })
      return result as any
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subscriptionPlanQueryKeys.lists() })
    },
  })
}

// Subscription-specific GiyaPay config
export const useSubscriptionGiyaPayConfig = () => {
  const { data, ...rest } = useQuery<{ config: SubscriptionGiyaPayConfig | null }>({
    queryKey: subscriptionConfigQueryKeys.list(['config']),
    queryFn: async () => {
      const result = await sdk.client.fetch('/admin/giyapay/subscription-config', { method: 'GET' })
      return result as any
    },
    staleTime: 60_000,
  })
  return { config: data?.config ?? null, ...rest }
}

export const useUpdateSubscriptionGiyaPayConfig = () => {
  const qc = useQueryClient()
  return useMutation<
    { config: SubscriptionGiyaPayConfig },
    Error,
    { merchantId: string; merchantSecret: string; sandboxMode: boolean; isEnabled: boolean }
  >({
    mutationFn: async (payload) => {
      const result = await sdk.client.fetch('/admin/giyapay/subscription-config', {
        method: 'POST',
        body: payload as any,
      })
      return result as any
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subscriptionConfigQueryKeys.lists() })
    },
  })
}
