import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../lib/client"

export type PlatformProvider = {
  provider_id: string
  name: string
  type: string
  markets: string[]
  capabilities: string[]
  is_active: boolean
  is_configured: boolean
  configured_at: string | null
  last_updated: string | null
  credential_fields: {
    key: string
    label: string
    type: "text" | "password" | "select" | "boolean"
    required: boolean
    help?: string
    options?: string[]
  }[]
  dashboard_url: string
  docs_url: string
}

const PROVIDERS_QUERY_KEY = ["admin", "shipping-providers"]

export function useAdminShippingProviders() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: PROVIDERS_QUERY_KEY,
    queryFn: async () => {
      const result = await sdk.client.fetch("/admin/shipping-providers", { method: "GET" })
      return result as { providers: PlatformProvider[]; active_count: number }
    },
  })
  return { providers: data?.providers ?? [], active_count: data?.active_count ?? 0, isLoading, isError, error }
}

export function useAdminShippingProviderAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      action: "save-credentials" | "test-credentials" | "activate" | "deactivate" | "remove"
      provider_id: string
      credentials?: Record<string, unknown>
      settings?: Record<string, unknown>
    }) => {
      const result = await sdk.client.fetch("/admin/shipping-providers", {
        method: "POST",
        body: payload,
      })
      return result as { success: boolean; message: string }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDERS_QUERY_KEY })
    },
  })
}
