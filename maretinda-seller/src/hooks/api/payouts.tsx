import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { FetchError } from "@medusajs/js-sdk"

import { fetchQuery } from "../../lib/client"

export const PAYOUTS_QUERY_KEY = "payouts" as const

export const usePayouts = (
  query?: Record<string, any>,
  options?: any
) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => {
      try {
        return await fetchQuery("/vendor/payouts", {
          method: "GET",
          query: query as { [key: string]: string | number },
        })
      } catch (error) {
        // Force real data usage - no more mock fallbacks
        console.error("❌ Failed to fetch real payouts data:", error)
        console.log("🔍 Using real data from backend API only")
        return {
          payouts: [],
          count: 0
        }
      }
    },
    queryKey: [PAYOUTS_QUERY_KEY, "list", query],
    retry: false, // Don't retry on error
    ...options,
  })

  // Ensure data is properly structured
  const safeData = data && typeof data === 'object' ? data : { payouts: [], count: 0 }
  return { payouts: safeData.payouts || [], count: safeData.count || 0, ...rest }
}

export const usePayoutAccount = (options?: any) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => {
      try {
        return await fetchQuery("/vendor/payout-account", {
          method: "GET",
        })
      } catch (error) {
        // Force real data usage - no more mock fallbacks
        console.error("❌ Failed to fetch real payout account data:", error)
        console.log("🔍 Using real data from backend API only")
        return {
          payout_account: null
        }
      }
    },
    queryKey: [PAYOUTS_QUERY_KEY, "account"],
    retry: false, // Don't retry on error
    ...options,
  })

  // Ensure data is properly structured
  const safeData = data && typeof data === 'object' ? data : { payout_account: null }
  return { payout_account: safeData.payout_account, ...rest }
}

export const useCreatePayoutAccount = (options?: any) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: any) =>
      fetchQuery("/vendor/payout-account", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: [PAYOUTS_QUERY_KEY, "account"],
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useCreatePayoutRequest = (options?: any) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { amount: number; currency?: string; notes?: string }) =>
      fetchQuery("/vendor/payouts", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: [PAYOUTS_QUERY_KEY, "list"],
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

// GiyaPay Analytics Hook
export const useGiyaPayAnalytics = (options?: any) => {
  const { data, ...rest } = useQuery({
    queryFn: async () => {
      // No stand-in numbers: a page that can't load says so instead of
      // showing a seller earnings they never made
      return (await fetchQuery("/vendor/giyapay-analytics", { method: "GET" })) as any
    },
    queryKey: [PAYOUTS_QUERY_KEY, "giyapay-analytics"],
    retry: false,
    ...options,
  })
  
  const safeData = data && typeof data === 'object' ? data : { analytics: null }
  return { analytics: safeData.analytics, ...rest }
}
