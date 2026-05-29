import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchQuery } from "../../lib/client"

const SHIPPING_QUERY_KEY = "shipping"

// Types
interface CredentialFieldConfig {
  type: 'text' | 'password' | 'select' | 'boolean'
  required: boolean
  description: string
  credentialPath?: string
  options?: string[]
}

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
  configTemplate?: Record<string, CredentialFieldConfig>
  credentialLinks?: {
    signupUrl?: string
    dashboardUrl?: string
    apiDocsUrl?: string
    sandboxUrl?: string
  }
  setupInstructions?: string[]
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
              configTemplate: {
                client_id: { type: "text", required: true, description: "Client ID from Ninja Dashboard", credentialPath: "Settings > IT Settings" },
                client_secret: { type: "password", required: true, description: "Client Key from Ninja Dashboard", credentialPath: "Settings > IT Settings" },
              },
              credentialLinks: {
                signupUrl: "https://www.ninjavan.co/en-ph/business-registration",
                dashboardUrl: "https://dashboard.ninjavan.co",
                apiDocsUrl: "https://api-docs.ninjavan.co/en",
              },
              setupInstructions: [
                "Register a Ninja Van Postpaid Pro account",
                "Log in to your Ninja Dashboard (sandbox or production)",
                "Go to Settings > IT Settings and click \"REGENERATE CLIENT ID & KEY\"",
                "Copy the Client ID and Client Key into the fields below",
                "Select your country and toggle sandbox mode on for testing",
              ],
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
              configTemplate: {
                aftership_api_key: { type: "password", required: true, description: "AfterShip API Key (for tracking)", credentialPath: "AfterShip Dashboard > Settings > API Keys" },
              },
              credentialLinks: {
                signupUrl: "https://www.jtexpress.ph/index/signup.html",
                dashboardUrl: "https://admin.aftership.com",
                apiDocsUrl: "https://www.aftership.com/docs/tracking/2024-04/overview",
              },
              setupInstructions: [
                "Register a J&T Express shipper account",
                "Sign up for AfterShip (free tier available)",
                "In AfterShip, go to Settings > API Keys and create a new key",
                "Connect your J&T Express account in AfterShip Couriers",
                "Paste the AfterShip API Key below",
              ],
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
              configTemplate: {
                api_key: { type: "text", required: true, description: "Lalamove API Key" },
                api_secret: { type: "password", required: true, description: "Lalamove API Secret" },
                market: { type: "select", required: true, description: "Your market", options: ["PH", "MY", "SG", "TH", "HK", "VN"] },
              },
              credentialLinks: {
                signupUrl: "https://www.lalamove.com/en-ph/business",
                dashboardUrl: "https://driver.lalamove.com",
                apiDocsUrl: "https://developers.lalamove.com",
              },
              setupInstructions: [
                "Register a Lalamove Business account",
                "Request API access from your account manager",
                "Obtain your API Key and Secret from the developer portal",
                "Enter your credentials below",
              ],
            },
            {
              providerId: "flyingtigers",
              name: "Flying Tigers Express",
              type: "standard",
              enabled: true,
              hasVendorCredentials: false,
              isEnabled: false,
              isDefault: false,
              supportedMarkets: ["PH"],
              capabilities: ["Door-to-door delivery", "Cash on Delivery", "Real-time tracking", "Same-day & next-day"],
              configTemplate: {
                api_key: { type: "password", required: true, description: "API Key", credentialPath: "Flying Tigers Portal > My Account > API Settings" },
                merchant_code: { type: "text", required: true, description: "Merchant / Shipper Code", credentialPath: "Flying Tigers Portal > My Account > Profile" },
              },
              credentialLinks: {
                signupUrl: "https://www.flyingtigersexpress.com",
                dashboardUrl: "https://www.flyingtigersexpress.com",
                apiDocsUrl: "https://www.flyingtigersexpress.com",
              },
              setupInstructions: [
                "Register a Flying Tigers Express shipper account",
                "Log in to the Flying Tigers merchant portal",
                "Go to My Account > API Settings to generate your API Key",
                "Copy your Merchant Code from My Account > Profile",
                "Paste both values below and save",
              ],
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
