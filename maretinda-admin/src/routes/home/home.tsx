import { format } from "date-fns"
import { Link } from "react-router-dom"
import {
  ArrowUpMini,
  BuildingStorefront,
  CurrencyDollar,
  ShoppingBag,
  TriangleRightMini,
  User,
  ExclamationCircle,
  Tag,
  CreditCard,
} from "@medusajs/icons"
import { Badge, Container, Heading, Text } from "@medusajs/ui"

import { useOrders } from "@hooks/api/orders"
import { useCustomers } from "@hooks/api/customers"
import { useSellers } from "@hooks/api/sellers"
import { useProducts } from "@hooks/api/products"
import { useAdminSubscriptions } from "@hooks/api/subscriptions"

const formatMoney = (amount: number) => {
  if (amount >= 1_000_000) return `₱${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `₱${(amount / 1_000).toFixed(1)}K`
  return `₱${amount.toFixed(2)}`
}

const StatusDot = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    ACTIVE: "bg-green-500",
    INACTIVE: "bg-gray-400",
    SUSPENDED: "bg-red-500",
    fulfilled: "bg-green-500",
    not_fulfilled: "bg-amber-400",
    cancelled: "bg-red-400",
    pending: "bg-blue-400",
  }
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${colors[status] ?? "bg-gray-300"}`}
    />
  )
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  color,
  href,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color: string
  href?: string
}) => {
  const inner = (
    <div className="flex flex-col gap-3 rounded-xl border border-ui-border-base bg-ui-bg-base p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="text-white" />
        </div>
        {href && <TriangleRightMini className="text-ui-fg-muted" />}
      </div>
      <div>
        <p className="text-2xl font-bold text-ui-fg-base">{value}</p>
        <p className="text-sm font-medium text-ui-fg-subtle mt-0.5">{label}</p>
        {sub && <p className="text-xs text-ui-fg-muted mt-1">{sub}</p>}
      </div>
    </div>
  )

  return href ? <Link to={href}>{inner}</Link> : inner
}

const MiniBar = ({
  label,
  value,
  max,
  color,
}: {
  label: string
  value: number
  max: number
  color: string
}) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs text-ui-fg-subtle capitalize">
        {label}
      </span>
      <div className="h-2 flex-1 rounded-full bg-ui-bg-subtle overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-semibold text-ui-fg-base">
        {value}
      </span>
    </div>
  )
}

export const Home = () => {
  const today = format(new Date(), "EEEE, MMMM d, yyyy")

  const { orders, count: orderCount, isPending: ordersPending } = useOrders({ limit: 10 })
  const { count: customerCount } = useCustomers({ limit: 1 })
  const { sellers } = useSellers()
  const { count: productCount } = useProducts({ limit: 1 })
  const { data: subData } = useAdminSubscriptions({ status: "active", limit: 1 })
  const subCount = subData?.count

  const sellerList = sellers ?? []
  const activesellers = sellerList.filter((s) => s.store_status === "ACTIVE").length
  const inactivesellers = sellerList.filter((s) => s.store_status === "INACTIVE").length
  const suspendedsellers = sellerList.filter((s) => s.store_status === "SUSPENDED").length
  const totalsellers = sellerList.length

  const orderList = orders ?? []
  const pendingFulfillment = orderList.filter(
    (o) => o.fulfillment_status === "not_fulfilled"
  ).length
  const fulfilledOrders = orderList.filter(
    (o) => o.fulfillment_status === "fulfilled"
  ).length
  const cancelledOrders = orderList.filter(
    (o) => o.status === "cancelled"
  ).length

  const recentRevenue = orderList.reduce((sum, o) => {
    const total = typeof o.total === "number" ? o.total : 0
    return sum + total
  }, 0) / 100

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <Heading level="h1" className="text-2xl font-bold text-ui-fg-base">
            Admin Dashboard
          </Heading>
          <Text className="text-ui-fg-muted mt-1">{today}</Text>
        </div>
        <Badge color="blue" className="mt-1">Super Admin</Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={orderCount ?? "—"}
          sub={`${pendingFulfillment} pending fulfillment`}
          color="bg-blue-500"
          href="/orders"
        />
        <StatCard
          icon={User}
          label="Customers"
          value={customerCount ?? "—"}
          sub="Registered accounts"
          color="bg-violet-500"
          href="/customers"
        />
        <StatCard
          icon={BuildingStorefront}
          label="Sellers"
          value={totalsellers || "—"}
          sub={`${activesellers} active`}
          color="bg-emerald-500"
          href="/sellers"
        />
        <StatCard
          icon={CurrencyDollar}
          label="Recent Revenue"
          value={formatMoney(recentRevenue)}
          sub="From latest 10 orders"
          color="bg-amber-500"
        />
        <StatCard
          icon={CreditCard}
          label="Active Subscriptions"
          value={subCount ?? "—"}
          sub="seller plans"
          color="bg-rose-500"
          href="/subscriptions"
        />
      </div>

      {/* Middle section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Orders */}
        <Container className="divide-y p-0 lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <Heading level="h2" className="text-base font-semibold">
                Recent Orders
              </Heading>
              <Text size="small" className="text-ui-fg-muted">
                Latest 10 orders across all sellers
              </Text>
            </div>
            <Link
              to="/orders"
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            {ordersPending ? (
              <div className="px-5 py-8 text-center text-ui-fg-muted text-sm">
                Loading orders…
              </div>
            ) : orderList.length === 0 ? (
              <div className="px-5 py-8 text-center text-ui-fg-muted text-sm">
                No orders yet
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ui-border-base bg-ui-bg-subtle">
                    <th className="px-5 py-3 text-left text-xs font-medium text-ui-fg-muted">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ui-fg-muted">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ui-fg-muted">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ui-fg-muted">
                      Fulfillment
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-ui-fg-muted">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ui-fg-muted">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orderList.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-ui-border-base last:border-0 hover:bg-ui-bg-subtle transition-colors"
                    >
                      <td className="px-5 py-3">
                        <Link
                          to={`/orders/${order.id}`}
                          className="font-mono text-blue-600 hover:underline text-xs"
                        >
                          #{order.display_id}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-ui-fg-subtle truncate max-w-[140px]">
                        {order.customer?.email ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          <StatusDot status={order.status} />
                          <span className="capitalize text-xs text-ui-fg-subtle">
                            {order.status}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          <StatusDot status={order.fulfillment_status ?? ""} />
                          <span className="capitalize text-xs text-ui-fg-subtle">
                            {(order.fulfillment_status ?? "—").replace(/_/g, " ")}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-ui-fg-base text-xs">
                        {formatMoney((order.total ?? 0) / 100)}
                      </td>
                      <td className="px-4 py-3 text-xs text-ui-fg-muted whitespace-nowrap">
                        {order.created_at
                          ? format(new Date(order.created_at), "MMM d, yyyy")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Container>

        {/* Right column: seller + Order breakdown */}
        <div className="flex flex-col gap-4">
          {/* seller Status */}
          <Container className="divide-y p-0">
            <div className="px-5 py-4">
              <Heading level="h2" className="text-base font-semibold">
                Seller Overview
              </Heading>
              <Text size="small" className="text-ui-fg-muted">
                {totalsellers} registered sellers
              </Text>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              <MiniBar
                label="Active"
                value={activesellers}
                max={totalsellers}
                color="bg-emerald-500"
              />
              <MiniBar
                label="Inactive"
                value={inactivesellers}
                max={totalsellers}
                color="bg-gray-400"
              />
              <MiniBar
                label="Suspended"
                value={suspendedsellers}
                max={totalsellers}
                color="bg-red-400"
              />
            </div>
            <div className="px-5 py-3">
              <Link
                to="/sellers"
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Manage sellers →
              </Link>
            </div>
          </Container>

          {/* Order Breakdown */}
          <Container className="divide-y p-0">
            <div className="px-5 py-4">
              <Heading level="h2" className="text-base font-semibold">
                Order Breakdown
              </Heading>
              <Text size="small" className="text-ui-fg-muted">
                Latest {orderList.length} orders
              </Text>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              <MiniBar
                label="Fulfilled"
                value={fulfilledOrders}
                max={orderList.length}
                color="bg-green-500"
              />
              <MiniBar
                label="Pending"
                value={pendingFulfillment}
                max={orderList.length}
                color="bg-amber-400"
              />
              <MiniBar
                label="Cancelled"
                value={cancelledOrders}
                max={orderList.length}
                color="bg-red-400"
              />
            </div>
          </Container>
        </div>
      </div>

      {/* Pending Actions & Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Link to="/requests/seller">
          <div className="flex items-center gap-4 rounded-xl border border-ui-border-base bg-ui-bg-base p-4 shadow-sm hover:shadow-md hover:border-blue-400 transition-all group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <ExclamationCircle className="text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ui-fg-base">Seller Requests</p>
              <p className="text-xs text-ui-fg-muted">Approve or reject new sellers</p>
            </div>
            <TriangleRightMini className="text-ui-fg-muted group-hover:text-blue-500 transition-colors" />
          </div>
        </Link>

        <Link to="/requests/product">
          <div className="flex items-center gap-4 rounded-xl border border-ui-border-base bg-ui-bg-base p-4 shadow-sm hover:shadow-md hover:border-violet-400 transition-all group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
              <Tag className="text-violet-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ui-fg-base">Product Requests</p>
              <p className="text-xs text-ui-fg-muted">Review seller product submissions</p>
            </div>
            <TriangleRightMini className="text-ui-fg-muted group-hover:text-violet-500 transition-colors" />
          </div>
        </Link>

        <Link to="/subscriptions">
          <div className="flex items-center gap-4 rounded-xl border border-ui-border-base bg-ui-bg-base p-4 shadow-sm hover:shadow-md hover:border-rose-400 transition-all group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10">
              <CreditCard className="text-rose-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ui-fg-base">Subscriptions</p>
              <p className="text-xs text-ui-fg-muted">{subCount ?? 0} active seller plans</p>
            </div>
            <TriangleRightMini className="text-ui-fg-muted group-hover:text-rose-500 transition-colors" />
          </div>
        </Link>

        <Link to="/flash-sales">
          <div className="flex items-center gap-4 rounded-xl border border-ui-border-base bg-ui-bg-base p-4 shadow-sm hover:shadow-md hover:border-amber-400 transition-all group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <ArrowUpMini className="text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ui-fg-base">Flash Sales</p>
              <p className="text-xs text-ui-fg-muted">Create & manage timed promotions</p>
            </div>
            <TriangleRightMini className="text-ui-fg-muted group-hover:text-amber-500 transition-colors" />
          </div>
        </Link>
      </div>

      {/* Platform Stats Footer */}
      <Container className="divide-y p-0">
        <div className="px-5 py-4">
          <Heading level="h2" className="text-base font-semibold">
            Platform Overview
          </Heading>
          <Text size="small" className="text-ui-fg-muted">
            Marketplace at a glance
          </Text>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-ui-border-base">
          <div className="px-5 py-4 text-center">
            <p className="text-2xl font-bold text-ui-fg-base">
              {productCount ?? "—"}
            </p>
            <p className="text-xs text-ui-fg-muted mt-1">Total Products</p>
          </div>
          <div className="px-5 py-4 text-center">
            <p className="text-2xl font-bold text-ui-fg-base">
              {totalsellers || "—"}
            </p>
            <p className="text-xs text-ui-fg-muted mt-1">Total Sellers</p>
          </div>
          <div className="px-5 py-4 text-center">
            <p className="text-2xl font-bold text-ui-fg-base">
              {customerCount ?? "—"}
            </p>
            <p className="text-xs text-ui-fg-muted mt-1">Registered Customers</p>
          </div>
          <div className="px-5 py-4 text-center">
            <p className="text-2xl font-bold text-ui-fg-base">
              {orderCount ?? "—"}
            </p>
            <p className="text-xs text-ui-fg-muted mt-1">All-Time Orders</p>
          </div>
        </div>
      </Container>
    </div>
  )
}
