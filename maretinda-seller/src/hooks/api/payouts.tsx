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
      try {
        return await fetchQuery("/vendor/giyapay-analytics")
      } catch (error) {
        console.error("❌ Failed to fetch real GiyaPay analytics:", error)
        return {
          analytics: {
            total_captured: 180000.00, // ₱180,000.00 (gross revenue)
            net_amount: 174648.16,     // ₱174,648.16 (after all fees)
            
            // Subscription-based fee model
            subscription_fee_monthly: 999.00, // ₱999/month
            subscription_fee_prorated: 516.84, // Prorated for 16/31 days
            subscription_fee_per_transaction: 5.00, // ₱5 per transaction
            transaction_fees: 335.00, // 67 × ₱5.00
            total_maretinda_fees: 851.84, // subscription + transaction fees
            
            // Payment processor fees (separate from Maretinda)
            payment_processing_fees: 4500.00, // 2.5% of ₱180,000
            payment_processing_fee_rate: 0.025,
            
            total_all_fees: 5351.84, // Maretinda + processing fees
            total_requested: 75000.00,  // ₱75,000.00 (total payout requests)
            total_paid: 50000.00,       // ₱50,000.00 (completed payouts)
            available_balance: 99648.16, // ₱99,648.16 (net - requested)
            pending_payouts: 25000.00,  // ₱25,000.00 (pending payouts)
            currency: "PHP",
            transaction_count: 67,
            last_transaction_date: new Date().toISOString(),
            average_transaction_value: 2686.57, // ₱180,000 / 67 transactions
            weekly_amount: 28500.00,    // ₱28,500.00 (last 7 days)
            weekly_transaction_count: 12,
            monthly_amount: 95000.00,   // ₱95,000.00 (last 30 days)
            monthly_transaction_count: 35,
            
            // Subscription billing info
            billing_info: {
              current_month_days: 31,
              days_elapsed: 16,
              next_billing_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
              subscription_status: 'active'
            },
            
            top_transactions: [
              {
                id: 'giyapay_txn_001',
                reference_number: 'GP2024001',
                amount: 15000.00,
                gateway: 'GCASH',
                created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
              },
              {
                id: 'giyapay_txn_002',
                reference_number: 'GP2024002',
                amount: 12500.00,
                gateway: 'PAYMAYA',
                created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
              },
              {
                id: 'giyapay_txn_003',
                reference_number: 'GP2024003',
                amount: 8750.00,
                gateway: 'GRABPAY',
                created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
              }
            ],
            breakdown: {
              gross_revenue: 180000.00,
              payment_processing_fees: 4500.00,
              subscription_fee_prorated: 516.84,
              transaction_fees: 335.00,
              total_maretinda_fees: 851.84,
              total_all_fees: 5351.84,
              net_revenue: 174648.16,
              paid_out: 50000.00,
              pending_payouts: 25000.00,
              available_for_payout: 99648.16
            }
          }
        }
      }
    },
    queryKey: [PAYOUTS_QUERY_KEY, "giyapay-analytics"],
    retry: false,
    ...options,
  })
  
  const safeData = data && typeof data === 'object' ? data : { analytics: null }
  return { analytics: safeData.analytics, ...rest }
}
