import { useQuery } from "@tanstack/react-query"
import { fetchQuery } from "../../lib/client"

interface GiyaPayTransaction {
  id: string
  reference_number: string
  order_id: string
  vendor_id: string
  vendor_name: string
  amount: number
  currency: string
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
  gateway: string
  description: string
  created_at: string
  updated_at: string
}

interface GiyaPayTransactionsResponse {
  transactions: GiyaPayTransaction[]
  summary: {
    total_count: number
    total_amount: number
    success_count: number
    pending_count: number
    failed_count: number
    cancelled_count: number
  }
  count: number
  page: number
  limit: number
  vendor_id: string
}

export interface GiyaPayFilters {
  page?: number
  limit?: number
  status?: string
  gateway?: string
  search?: string
  date_from?: string
  date_to?: string
}

export const useGiyaPayTransactions = (filters: GiyaPayFilters = {}) => {
  const { page = 1, limit = 20, status, gateway, search, date_from, date_to } = filters

  const query: Record<string, string> = {
    page: String(page),
    limit: String(limit),
  }
  if (status) query.status = status
  if (gateway) query.gateway = gateway
  if (search) query.search = search
  if (date_from) query.date_from = date_from
  if (date_to) query.date_to = date_to

  return useQuery({
    queryKey: ["giyapay-transactions", page, limit, status, gateway, search, date_from, date_to],
    queryFn: async (): Promise<GiyaPayTransactionsResponse> => {
      return await fetchQuery(`/vendor/giyapay/transactions`, {
        method: "GET",
        query,
      })
    },
    staleTime: 1000 * 60 * 2,
  })
}
