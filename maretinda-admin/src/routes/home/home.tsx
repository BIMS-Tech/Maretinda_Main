import { format } from "date-fns"
import { Link } from "react-router-dom"
import {
  BuildingStorefront,
  CreditCard,
  CurrencyDollar,
  ShoppingBag,
  TriangleRightMini,
} from "@medusajs/icons"
import { Container, Heading, StatusBadge, Text } from "@medusajs/ui"

import { useMarketplaceOverview } from "@hooks/api/marketplace"

/** Pesos, as Medusa stores them here (no centavos to divide out). */
const peso = (amount: number) =>
  "₱" + amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const ORDER_STATUS: Record<string, "green" | "orange" | "red" | "grey" | "blue"> = {
  completed: "green",
  pending: "orange",
  requires_action: "orange",
  canceled: "red",
  archived: "grey",
}

const Kpi = ({
  icon: Icon,
  label,
  value,
  sub,
  to,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub: string
  to?: string
}) => {
  const body = (
    <Container className="brand-card-hover flex h-full flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <span className="bg-ui-bg-highlight text-ui-fg-interactive flex h-9 w-9 items-center justify-center rounded-lg">
          <Icon />
        </span>
        {to && <TriangleRightMini className="text-ui-fg-muted" />}
      </div>
      <div>
        <Text size="small" className="text-ui-fg-subtle">{label}</Text>
        <p className="text-ui-fg-base mt-0.5 text-2xl font-semibold tracking-tight">{value}</p>
        <Text size="xsmall" className="text-ui-fg-muted mt-1">{sub}</Text>
      </div>
    </Container>
  )
  return to ? <Link to={to}>{body}</Link> : body
}

const ShopBar = ({ label, value, max, tone }: { label: string; value: number; max: number; tone: string }) => (
  <div className="flex items-center gap-3">
    <Text size="xsmall" className="text-ui-fg-subtle w-32 shrink-0">{label}</Text>
    <div className="bg-ui-bg-subtle h-2 flex-1 overflow-hidden rounded-full">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${max ? Math.round((value / max) * 100) : 0}%` }} />
    </div>
    <Text size="xsmall" weight="plus" className="w-8 text-right">{value}</Text>
  </div>
)

export const Home = () => {
  const { data, isPending, isError } = useMarketplaceOverview()

  const waiting = data
    ? [
        { label: "Seller applications", count: data.requests.seller_applications, to: "/requests/seller" },
        { label: "Documents to verify", count: data.requests.verifications, to: "/requests/seller-verification" },
        { label: "Returns escalated by sellers", count: data.requests.returns_escalated, to: "/requests/return" },
        { label: "Product requests", count: data.requests.product_requests, to: "/requests/product" },
      ]
    : []

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Text size="small" className="text-ui-fg-muted">{format(new Date(), "EEEE, MMMM d, yyyy")}</Text>
        <Heading level="h1" className="mt-0.5">Marketplace overview</Heading>
      </div>

      {isError && (
        <Container className="p-5">
          <Text className="text-ui-fg-error">The overview couldn't load. Refresh to try again.</Text>
        </Container>
      )}

      {isPending ? (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="brand-shimmer h-[132px] rounded-xl" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <Kpi
              icon={CurrencyDollar}
              label="Sales, last 30 days"
              value={peso(data.orders.sales_30_days)}
              sub={`${data.orders.last_30_days} orders, cancellations left out`}
            />
            <Kpi icon={ShoppingBag} label="Orders" value={data.orders.total} sub="All time" to="/orders" />
            <Kpi
              icon={BuildingStorefront}
              label="Shops that can sell"
              value={`${data.sellers.selling} of ${data.sellers.total}`}
              sub="A plan, and a finished, approved setup"
              to="/sellers"
            />
            <Kpi
              icon={CreditCard}
              label="Monthly recurring revenue"
              value={peso(data.subscriptions.mrr)}
              sub={`${data.subscriptions.paid} paid plans · ${data.subscriptions.trials} free months`}
              to="/subscriptions"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Container className="divide-y p-0 lg:col-span-2">
              <div className="flex items-center justify-between px-6 py-4">
                <Heading level="h2">Recent orders</Heading>
                <Link to="/orders" className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover txt-compact-small-plus">
                  All orders
                </Link>
              </div>
              {data.recent_orders.length === 0 ? (
                <Text size="small" className="text-ui-fg-muted px-6 py-8 text-center">No orders yet</Text>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-ui-fg-muted txt-compact-xsmall-plus text-left">
                        <th className="px-6 py-2.5 font-medium">Order</th>
                        <th className="px-3 py-2.5 font-medium">Customer</th>
                        <th className="px-3 py-2.5 font-medium">Shop</th>
                        <th className="px-3 py-2.5 font-medium">Status</th>
                        <th className="px-3 py-2.5 text-right font-medium">Total</th>
                        <th className="px-6 py-2.5 font-medium">Placed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-ui-border-base divide-y">
                      {data.recent_orders.map((o) => (
                        <tr key={o.id} className="hover:bg-ui-bg-base-hover txt-compact-small transition-colors">
                          <td className="px-6 py-3">
                            <Link to={`/orders/${o.id}`} className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover font-medium">
                              #{o.display_id}
                            </Link>
                          </td>
                          <td className="text-ui-fg-subtle max-w-[160px] truncate px-3 py-3">{o.customer_name ?? "—"}</td>
                          <td className="text-ui-fg-subtle max-w-[140px] truncate px-3 py-3">{o.seller_name ?? "—"}</td>
                          <td className="px-3 py-3">
                            <StatusBadge color={ORDER_STATUS[o.status] ?? "grey"} className="capitalize">
                              {o.status.replace(/_/g, " ")}
                            </StatusBadge>
                          </td>
                          <td className="text-ui-fg-base px-3 py-3 text-right font-medium">{peso(o.total)}</td>
                          <td className="text-ui-fg-muted whitespace-nowrap px-6 py-3">{format(new Date(o.created_at), "MMM d, yyyy")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Container>

            <div className="flex flex-col gap-4">
              <Container className="divide-y p-0">
                <div className="px-6 py-4">
                  <Heading level="h2">Waiting for you</Heading>
                </div>
                {waiting.map(({ label, count, to }) => (
                  <Link key={to} to={to} className="hover:bg-ui-bg-base-hover flex items-center justify-between px-6 py-3 transition-colors">
                    <Text size="small" className="text-ui-fg-subtle">{label}</Text>
                    <span
                      className={
                        count > 0
                          ? "bg-ui-tag-orange-bg text-ui-tag-orange-text txt-compact-xsmall-plus rounded-full px-2 py-0.5"
                          : "text-ui-fg-muted txt-compact-xsmall"
                      }
                    >
                      {count > 0 ? count : "None"}
                    </span>
                  </Link>
                ))}
              </Container>

              <Container className="divide-y p-0">
                <div className="px-6 py-4">
                  <Heading level="h2">Shops</Heading>
                  <Text size="small" className="text-ui-fg-muted">{data.sellers.total} registered</Text>
                </div>
                <div className="flex flex-col gap-3 px-6 py-4">
                  <ShopBar label="Can sell" value={data.sellers.selling} max={data.sellers.total} tone="bg-ui-tag-green-icon" />
                  <ShopBar label="No plan" value={data.sellers.closed_no_plan} max={data.sellers.total} tone="bg-ui-tag-orange-icon" />
                  <ShopBar label="Setup unfinished" value={data.sellers.closed_setup} max={data.sellers.total} tone="bg-ui-tag-purple-icon" />
                  <ShopBar label="Suspended" value={data.sellers.suspended} max={data.sellers.total} tone="bg-ui-tag-red-icon" />
                </div>
              </Container>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
