import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery
} from '@tanstack/react-query'

import { sdk } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-key-factory'

export interface GiyaPayConfig {
  id?: string;
  merchantId: string;
  merchantSecret: string;
  sandboxMode: boolean;
  isEnabled: boolean;
  enabledMethods?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GiyaPayTransaction {
  id: string;
  reference_number: string;
  order_id?: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  gateway: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export const giyaPayQueryKeys = queryKeysFactory('giyapay')

export const useGiyaPayConfig = (
  options?: Omit<
    UseQueryOptions<
      any,
      Error,
      { config: GiyaPayConfig },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: giyaPayQueryKeys.list(['config']),
    queryFn: async () => {
      const result = await sdk.client.fetch('/admin/giyapay', {
        method: 'GET'
      })
      return result as { config: GiyaPayConfig }
    },
    ...options
  })

  return { ...data, ...other }
}

export const useUpdateGiyaPayConfig = (
  options?: UseMutationOptions<
    { config: GiyaPayConfig },
    Error,
    {
      merchantId: string;
      merchantSecret: string;
      sandboxMode: boolean;
      isEnabled: boolean;
    }
  >
) => {
  return useMutation({
    mutationFn: async (payload) => {
      const result = await sdk.client.fetch('/admin/giyapay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload
      })
      return result as { config: GiyaPayConfig }
    },
    ...options
  })
}

export const useGiyaPayTransactions = (
  query?: Record<string, string | number>,
  options?: Omit<
    UseQueryOptions<
      { transactions: GiyaPayTransaction[] },
      Error,
      { transactions: GiyaPayTransaction[] },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: giyaPayQueryKeys.list(['transactions', query]),
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          searchParams.append(key, String(value))
        })
      }
      
      const url = `/admin/giyapay/transactions${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      const result = await sdk.client.fetch(url, {
        method: 'GET'
      })
      return result as { transactions: GiyaPayTransaction[] }
    },
    ...options
  })

  return { ...data, ...other }
}

export const useGiyaPayTransaction = (
  transactionId: string,
  options?: Omit<
    UseQueryOptions<
      any,
      Error,
      { transaction: GiyaPayTransaction },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: giyaPayQueryKeys.detail(transactionId),
    queryFn: async () => {
      const result = await sdk.client.fetch(`/admin/giyapay/transactions/${transactionId}`, {
        method: 'GET'
      })
      return result as { transaction: GiyaPayTransaction }
    },
    enabled: !!transactionId,
    ...options
  })

  return { ...data, ...other }
}

export const useGiyaPayMethods = (
  options?: Omit<
    UseQueryOptions<
      any,
      Error,
      { enabledMethods: string[] },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: giyaPayQueryKeys.list(['payment-methods']),
    queryFn: async () => {
      const result = await sdk.client.fetch('/admin/giyapay/payment-methods', {
        method: 'GET'
      })
      return result as { enabledMethods: string[] }
    },
    ...options
  })

  return { ...data, ...other }
}

export const useUpdateGiyaPayMethods = (
  options?: UseMutationOptions<
    { enabledMethods: string[] },
    Error,
    { enabledMethods: string[] }
  >
) => {
  return useMutation({
    mutationFn: async (payload) => {
      const result = await sdk.client.fetch('/admin/giyapay/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload
      })
      return result as { enabledMethods: string[] }
    },
    ...options
  })
}
