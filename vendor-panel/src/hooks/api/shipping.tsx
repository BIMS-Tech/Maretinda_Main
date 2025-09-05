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

interface ShippingQuotation {
  providerId: string
  quotationId: string
  serviceType: string
  cost: number
  vendorCost: number
  marketplaceCost: number
  estimatedDeliveryTime: string
  capabilities: string[]
  billingResponsibility: 'marketplace' | 'vendor'
  credentialsSource: 'vendor' | 'marketplace'
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

// Hooks for Shipping Providers
export const useShippingProviders = () => {
  return useQuery({
    queryKey: [SHIPPING_QUERY_KEY, "providers"],
    queryFn: async (): Promise<{
      providers: VendorShippingProvider[]
      vendorConfig: VendorShippingConfig
    }> => {
      try {
        return await fetchQuery("/vendor/shipping-providers")
      } catch (error) {
        console.warn("Shipping Providers API not available, using mock data:", error)
        return {
          providers: [
            {
              providerId: "lalamove",
              name: "Lalamove",
              type: "same_day",
              enabled: true,
              hasVendorCredentials: false,
              isEnabled: false,
              isDefault: false,
              supportedMarkets: ["PH", "SG", "MY", "TH"],
              capabilities: ["Real-time tracking", "Proof of delivery", "Same-day delivery"]
            },
            {
              providerId: "dhl",
              name: "DHL Express",
              type: "express",
              enabled: true,
              hasVendorCredentials: false,
              isEnabled: false,
              isDefault: false,
              supportedMarkets: ["GLOBAL"],
              capabilities: ["Global coverage", "Express delivery", "Insurance", "Tracking"]
            }
          ],
          vendorConfig: {
            vendorId: "vendor_mock",
            enabledProviders: [],
            preferences: {
              autoSelectBestRate: true,
              preferredServiceTypes: [],
              blacklistedProviders: []
            },
            billingConfig: {
              paymentMethod: "marketplace",
              costMarkup: 0,
              handlingFee: 0
            }
          }
        }
      }
    }
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
        body: JSON.stringify(data)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHIPPING_QUERY_KEY, "providers"] })
    }
  })
}

// Hooks for Shipping Quotations
export const useShippingQuotations = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: {
      action: 'get-quotations' | 'get-best-quotation' | 'compare-providers'
      quotationRequest: any
      criteria?: any
    }) => {
      return await fetchQuery("/vendor/shipping-quotations", {
        method: "POST",
        body: JSON.stringify(data)
      })
    }
  })
}

export const useQuotationHistory = () => {
  return useQuery({
    queryKey: [SHIPPING_QUERY_KEY, "quotation-history"],
    queryFn: async (): Promise<{
      quotations: ShippingQuotation[]
      count: number
      hasMore: boolean
    }> => {
      try {
        return await fetchQuery("/vendor/shipping-quotations")
      } catch (error) {
        console.warn("Quotation History API not available, using mock data:", error)
        return {
          quotations: [
            {
              providerId: "lalamove",
              quotationId: "quote_001",
              serviceType: "motorcycle",
              cost: 150.00,
              vendorCost: 150.00,
              marketplaceCost: 0,
              estimatedDeliveryTime: "2-4 hours",
              capabilities: ["Real-time tracking"],
              billingResponsibility: "vendor",
              credentialsSource: "vendor"
            }
          ],
          count: 1,
          hasMore: false
        }
      }
    }
  })
}

// Hooks for Shipping Orders
export const useShippingOrders = (filters?: any) => {
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
        return await fetchQuery(`/vendor/shipping-orders?${params.toString()}`)
      } catch (error) {
        console.warn("Shipping Orders API not available, using mock data:", error)
        return {
          orders: [
            {
              orderId: "order_001",
              providerId: "lalamove",
              providerOrderId: "llm_123456",
              status: "delivered",
              trackingNumber: "LLM123456789",
              vendorCost: 150.00,
              marketplaceCost: 0,
              billingResponsibility: "vendor",
              credentialsSource: "vendor"
            }
          ],
          count: 1,
          hasMore: false,
          summary: {
            totalOrders: 1,
            totalCost: 150.00,
            successfulDeliveries: 1,
            averageDeliveryTime: 180
          }
        }
      }
    }
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
        body: JSON.stringify(data)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SHIPPING_QUERY_KEY, "orders"] })
    }
  })
}

// Hooks for Shipping Analytics
export const useShippingAnalytics = (period: string = "30d", providerId?: string) => {
  return useQuery({
    queryKey: [SHIPPING_QUERY_KEY, "analytics", period, providerId],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({ period })
        if (providerId) params.append('provider_id', providerId)
        return await fetchQuery(`/vendor/shipping-analytics?${params.toString()}`)
      } catch (error) {
        console.warn("Shipping Analytics API not available, using mock data:", error)
        return {
          period,
          analytics: {
            totalOrders: 25,
            successfulDeliveries: 23,
            failedDeliveries: 1,
            cancelledOrders: 1,
            successRate: 92,
            totalCost: 3750.00,
            averageCostPerOrder: 150.00,
            averageDeliveryTime: 180,
            onTimeDeliveryRate: 95.7
          },
          providerComparison: {
            providers: [
              { providerId: "lalamove", orders: 15, cost: 2250, successRate: 93.3 },
              { providerId: "dhl", orders: 10, cost: 1500, successRate: 90.0 }
            ]
          },
          optimization: {
            tips: ["Consider using Lalamove for local deliveries", "DHL better for express orders"],
            potentialSavings: 250.00
          }
        }
      }
    }
  })
}

export const useExportAnalytics = () => {
  return useMutation({
    mutationFn: async (data: {
      action: string
      format?: string
      filters?: any
      schedule?: any
    }) => {
      return await fetchQuery("/vendor/shipping-analytics", {
        method: "POST",
        body: JSON.stringify(data)
      })
    }
  })
}


