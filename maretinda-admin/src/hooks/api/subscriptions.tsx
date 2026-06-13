import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sdk } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-key-factory'

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  yearly_price: number | null
  yearly_discount_percent: number | null
  trial_days: number
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
  is_trial: boolean
  trial_ends_at: string | null
  status: 'active' | 'expired' | 'cancelled'
  payment_reference: string | null
  created_at: string
  // enriched by admin list endpoint
  seller_name?: string
  seller_email?: string
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
      const result = await sdk.client.fetch(`/admin/subscriptions${qs ? `?${qs}` : ''}`, { method: 'GET' })
      return result as any
    },
    staleTime: 30_000,
  })
}

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
    onSuccess: () => qc.invalidateQueries({ queryKey: subscriptionQueryKeys.lists() }),
  })
}

export const useAdminEndTrial = () => {
  const qc = useQueryClient()
  return useMutation<{ subscription: sellersubscription }, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      const result = await sdk.client.fetch(`/admin/subscriptions/${id}`, {
        method: 'PATCH',
        body: { action: 'end_trial' } as any,
      })
      return result as any
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: subscriptionQueryKeys.lists() }),
  })
}

export const useAdminExtendTrial = () => {
  const qc = useQueryClient()
  return useMutation<{ subscription: sellersubscription }, Error, { id: string; days: number }>({
    mutationFn: async ({ id, days }) => {
      const result = await sdk.client.fetch(`/admin/subscriptions/${id}`, {
        method: 'PATCH',
        body: { action: 'extend_trial', days } as any,
      })
      return result as any
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: subscriptionQueryKeys.lists() }),
  })
}

export const useAdminAssignSubscription = () => {
  const qc = useQueryClient()
  return useMutation<
    { subscription: sellersubscription },
    Error,
    { seller_id: string; plan_name: string; duration_days?: number; is_trial?: boolean }
  >({
    mutationFn: async (payload) => {
      const result = await sdk.client.fetch('/admin/subscriptions/assign', {
        method: 'POST',
        body: payload as any,
      })
      return result as any
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: subscriptionQueryKeys.lists() }),
  })
}

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

export const useUpdateSubscriptionPlan = () => {
  const qc = useQueryClient()
  return useMutation<
    { plan: SubscriptionPlan },
    Error,
    {
      plan_id: string
      price?: number
      yearly_price?: number
      yearly_discount_percent?: number
      trial_days?: number
      features?: Record<string, unknown>
      status?: 'active' | 'inactive'
    }
  >({
    mutationFn: async (payload) => {
      const result = await sdk.client.fetch('/admin/subscriptions/plans', {
        method: 'PATCH',
        body: payload as any,
      })
      return result as any
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: subscriptionPlanQueryKeys.lists() }),
  })
}

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
    onSuccess: () => qc.invalidateQueries({ queryKey: subscriptionConfigQueryKeys.lists() }),
  })
}
