import { useQuery } from "@tanstack/react-query"
import { sdk } from "../../lib/client"

/** The dashboard's figures, worked out on the server (GET /admin/marketplace-overview). */
export type MarketplaceOverview = {
  sellers: { total: number; selling: number; closed_no_plan: number; closed_setup: number; suspended: number }
  subscriptions: { paid: number; trials: number; mrr: number }
  orders: { total: number; last_30_days: number; sales_30_days: number }
  recent_orders: {
    id: string
    display_id: number
    status: string
    created_at: string
    total: number
    customer_name: string | null
    seller_name: string | null
  }[]
  requests: { seller_applications: number; verifications: number; product_requests: number; returns_escalated: number }
}

export const useMarketplaceOverview = () =>
  useQuery({
    queryKey: ["admin", "marketplace-overview"],
    queryFn: () => sdk.client.fetch<MarketplaceOverview>("/admin/marketplace-overview", { method: "GET" }),
    refetchInterval: 60_000,
  })

/** Whether a shop can sell right now and why not (GET /admin/sellers/:id/standing). */
export type SellerStanding = {
  open: boolean
  suspended: boolean
  plan: { name: string; trial: boolean; price: number; billing_period: string; ends_at: string } | null
  setup: { ready: boolean; missing: string[] }
  verification_status: string
}

export const useSellerStanding = (id: string) =>
  useQuery({
    queryKey: ["admin", "seller-standing", id],
    queryFn: () => sdk.client.fetch<SellerStanding>(`/admin/sellers/${id}/standing`, { method: "GET" }),
    enabled: !!id,
  })
