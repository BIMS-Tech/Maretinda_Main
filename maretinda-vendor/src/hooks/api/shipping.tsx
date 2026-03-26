import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchQuery } from "../../lib/client"

const SHIPPING_QUERY_KEY = "shipping"

// Types
interface VendorShippingProvider {
  providerId: string
  name: string
  type: string
  enabled: boolean
  hasVendorCredentials: boolean
  isEnabled: boolean
  isDefault: boolean
  credentialsLastUsed?: string
  supportedMarkets: string[]
  capabilities: string[]
  configuration?: any
  vendorSpecificCapabilities?: any
}

interface VendorShippingConfig {
  vendorId: string
  enabledProviders: string[]
  defaultProvider?: string
  preferences: {
    autoSelectBestRate: boolean
    maxCostThreshold?: number
    preferredServiceTypes: string[]
    blacklistedProviders: string[]
  }
  billingConfig: {
    paymentMethod: 'marketplace' | 'vendor-direct'
    costMarkup?: number
    handlingFee?: number
  }
}

interface ShippingOrder {
  orderId: string
  providerId: string
  providerOrderId: string
  status: string
  trackingNumber?: string
  trackingUrl?: string
  estimatedDelivery?: string
  vendorCost: number
  marketplaceCost: number
  billingResponsibility: string
  credentialsSource: string
}

// ── Shipping Providers ────────────────────────────────────────────────────────

export const useShippingProviders = () => {
  return useQuery({
    queryKey: [SHIPPING_QUERY_KEY, "providers"],
    queryFn: async (): Promise<{
      providers: VendorShippingProvider[]
      vendorConfig: VendorShippingConfig
    }> => {
      try {
        return await fetchQuery("/vendor/shipping-providers", { method: "GET" })
      } catch (error) {
        console.warn("Shipping Providers API not available, using mock data:", error)
        return {
          providers: [
            {
              providerId: "ninjavan",
              name: "Ninja Van",
              type: "express",
              enabled: true,
              hasVendorCredentials: false,
              isEnabled: false,
              isDefault: false,
              supportedMarkets: ["PH", "MY", "SG", "TH", "VN", "ID"],
              capabilities: ["Real-time tracking", "Waybill generation", "Webhooks", "Standard & Express"],
            },
            {
              providerId: "jnt",
              name: "J&T Express",
              type: "express",
              enabled: true,
              hasVendorCredentials: false,
              isEnabled: false,
              isDefault: false,
              supportedMarkets: ["PH", "MY", "SG", "TH", "VN", "ID"],
              capabilities: ["Tracking via AfterShip", "Status webhooks"],
            },
            {
              providerId: "lalamove",
              name: "Lalamove",
              type: "same_day",
              enabled: true,
              hasVendorCredentials: false,
              isEnabled: false,
              isDefault: false,
              supportedMarkets: ["PH", "MY", "SG", "TH", "HK", "VN"],
              capabilities: ["Same-day delivery", "Real-time tracking", "Proof of delivery"],
            },
          ],
          vendorConfig: {
            vendorId: "vendor_mock",
            enabledProviders: [],
            preferences: {
              autoSelectBestRate: false,
              preferredServiceTypes: [],
              blacklistedProviders: [],
            },
            billingConfig: {
              paymentMethod: "vendor-direct",
              costMarkup: 0,
              handlingFee: 0,
            },
          },
        }
      }
    },
  })
}

export const useConfigureShippingProvider = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      action: string
      providerId: string
      data: any
    }) => {
      return await fetchQuery("/vendor/shipping-providers", {
        method: "POST",
        body: data,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHIPPING_QUERY_KEY, "providers"] })
    },
  })
}

// ── Shipping Orders ───────────────────────────────────────────────────────────

export const useShippingOrders = (filters?: Record<string, string>) => {
  return useQuery({
    queryKey: [SHIPPING_QUERY_KEY, "orders", filters],
    queryFn: async (): Promise<{
      orders: ShippingOrder[]
      count: number
      hasMore: boolean
      summary: any
    }> => {
      try {
        const params = new URLSearchParams(filters || {})
        return await fetchQuery(`/vendor/shipping-orders?${params.toString()}`, { method: "GET" })
      } catch (error) {
        console.warn("Shipping Orders API not available:", error)
        return { orders: [], count: 0, hasMore: false, summary: {} }
      }
    },
  })
}

export const useCreateShippingOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      action: string
      orderData?: any
      orderId?: string
      providerId?: string
      reason?: string
    }) => {
      return await fetchQuery("/vendor/shipping-orders", {
        method: "POST",
        body: data,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHIPPING_QUERY_KEY, "orders"] })
    },
  })
}

// ── Shipping Analytics ────────────────────────────────────────────────────────

export const useShippingAnalytics = (period: string = "30d", providerId?: string) => {
  return useQuery({
    queryKey: [SHIPPING_QUERY_KEY, "analytics", period, providerId],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({ period })
        if (providerId) params.append("provider_id", providerId)
        return await fetchQuery(`/vendor/shipping-analytics?${params.toString()}`, { method: "GET" })
      } catch (error) {
        console.warn("Shipping Analytics API not available, using mock data:", error)
        return {
          period,
          analytics: {
            totalOrders: 0,
            successfulDeliveries: 0,
            failedDeliveries: 0,
            cancelledOrders: 0,
            successRate: 0,
            totalCost: 0,
            averageCostPerOrder: 0,
            averageDeliveryTime: null,
            onTimeDeliveryRate: null,
          },
          providerComparison: { providers: [] },
          optimization: { tips: [], potentialSavings: 0 },
        }
      }
    },
  })
}
