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
  count: number
  page: number
  limit: number
  vendor_id: string
}

export const useGiyaPayTransactions = (options: { page?: number; limit?: number } = {}) => {
  const { page = 1, limit = 20 } = options

  return useQuery({
    queryKey: ["giyapay-transactions", page, limit],
    queryFn: async (): Promise<GiyaPayTransactionsResponse> => {
      const response = await fetchQuery(`/vendor/giyapay/transactions`, {
        method: "GET",
        query: { page: page.toString(), limit: limit.toString() }
      })
      return response
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
} 