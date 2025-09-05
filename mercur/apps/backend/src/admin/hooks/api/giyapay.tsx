import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery
} from '@tanstack/react-query'

import { mercurQuery } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-keys-factory'

export interface GiyaPayConfig {
  id?: string;
  merchantId: string;
  merchantSecret: string;
  sandboxMode: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GiyaPayTransaction {
  id: string;
  referenceNumber: string;
  orderId?: string;
  vendorId?: string;
  vendor?: { name: string };
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  gateway: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
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
    queryFn: () =>
      mercurQuery('/admin/giyapay', {
        method: 'GET'
      }),
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
    }
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      mercurQuery('/admin/giyapay', {
        method: 'POST',
        body: payload
      }),
    ...options
  })
}

export const useGiyaPayTransactions = (
  query?: Record<string, string | number>,
  options?: Omit<
    UseQueryOptions<
      Record<string, string | number>,
      Error,
      { transactions: GiyaPayTransaction[] },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: giyaPayQueryKeys.list(['transactions', query]),
    queryFn: () =>
      mercurQuery('/admin/giyapay/transactions', {
        method: 'GET',
        query
      }),
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
    queryFn: () =>
      mercurQuery(`/admin/giyapay/transactions/${transactionId}`, {
        method: 'GET'
      }),
    enabled: !!transactionId,
    ...options
  })

  return { ...data, ...other }
} 