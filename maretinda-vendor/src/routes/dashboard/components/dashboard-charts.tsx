import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { addDays, differenceInDays, format, subDays } from "date-fns"
import {
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
  Area,
} from "recharts"
import {
  Badge,
  Button,
  Container,
  DateRange,
  Heading,
  Popover,
  Text,
} from "@medusajs/ui"
import {
  CalendarMini,
  ShoppingCart,
  Star,
  ChatBubbleLeftRight,
  CurrencyDollar,
  ShoppingBag,
  TriangleRightMini,
} from "@medusajs/icons"
import { useStatistics, useOrders, useProducts } from "../../../hooks/api"
import { useChatConversations } from "../../../hooks/api/chat"
import { useReviews } from "../../../hooks/api/review"
import { usePayouts } from "../../../hooks/api/payouts"
import { Calendar } from "../../../components/common/calendar/calendar"
import { ChartSkeleton } from "./chart-skeleton"

const formatMoney = (amount: number) => {
  if (amount >= 1_000_000) return `₱${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `₱${(amount / 1_000).toFixed(1)}K`
  return `₱${amount.toFixed(2)}`
}

const generateChartData = ({
  range,
  customers,
  orders,
}: {
  range: DateRange | undefined
  customers: { date: string; count: string }[]
  orders: { date: string; count: string }[]
}) => {
  return [
    ...Array(
      differenceInDays(
        range?.to || addDays(new Date(), 1),
        range?.from || addDays(new Date(), -7)
      ) + 1
    ).keys(),
  ].map((index) => {
    const date = format(
      subDays(range?.from || addDays(new Date(), index), -index),
      "yyyy-MM-dd"
    )
    return {
      date,
      orders: parseInt(
        orders?.find((item) => format(item.date, "yyyy-MM-dd") === date)
          ?.count || "0"
      ),
      customers: parseInt(
        customers?.find((item) => format(item.date, "yyyy-MM-dd") === date)
          ?.count || "0"
      ),
    }
  })
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
  href,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  iconBg: string
  iconColor: string
  href?: string
}) => {
  const inner = (
    <div className="flex flex-col gap-3 rounded-xl border border-ui-border-base bg-ui-bg-base p-5 shadow-sm hover:shadow-md transition-shadow h-full">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}
        >
          <Icon className={iconColor} />
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
  return href ? <Link to={href} className="block">{inner}</Link> : inner
}

const ActionButton = ({
  count,
  label,
  href,
  color,
}: {
  count: number
  label: string
  href: string
  color: string
}) => (
  <Link to={href}>
    <Button
      variant="secondary"
      className="w-full justify-between py-4 h-full hover:bg-ui-bg-subtle"
    >
      <div className="flex gap-3 items-center">
        <Badge className={color}>{count}</Badge>
        <span className="text-sm">{label}</span>
      </div>
      <TriangleRightMini className="text-ui-fg-muted" />
    </Button>
  </Link>
)

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  label?: string
  payload?: { dataKey: string; name: string; stroke: string; value: number }[]
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-ui-bg-component p-3 rounded-lg border border-ui-border-base shadow-md">
      <p className="text-xs font-semibold text-ui-fg-base mb-1">{label}</p>
      <ul className="flex flex-col gap-1">
        {payload.map((item) => (
          <li key={item.dataKey} className="flex gap-2 items-center text-xs">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.stroke }} />
            <span className="capitalize text-ui-fg-subtle">{item.name}:</span>
            <span className="font-semibold text-ui-fg-base">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export const DashboardCharts = ({
  notFulfilledOrders,
  fulfilledOrders,
  reviewsToReply,
}: {
  notFulfilledOrders: number
  fulfilledOrders: number
  reviewsToReply: any
}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeLines, setActiveLines] = useState(["orders", "customers"])
  const { data: chatData } = useChatConversations()
  const unreadMessages = { length: chatData?.unread ?? 0 }

  const from = (searchParams.get("from") ||
    format(addDays(new Date(), -7), "yyyy-MM-dd")) as unknown as Date
  const to = (searchParams.get("to") ||
    format(new Date(), "yyyy-MM-dd")) as unknown as Date

  const updateDateRange = async (newFrom: string, newTo: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("from", format(newFrom, "yyyy-MM-dd"))
    params.set("to", format(newTo, "yyyy-MM-dd"))
    setSearchParams(params)
    refetch()
  }

  const { customers, orders: statsOrders, isPending: statsPending, refetch } = useStatistics({
    from: `${from}`,
    to: `${to}`,
  })

  const { orders: allOrders, isPending: ordersPending } = useOrders()
  const { reviews } = useReviews()
  const { payouts } = usePayouts({ limit: 5 } as any)
  const { count: productCount } = useProducts({ limit: 1 })

  const chartData = generateChartData({
    range: { from, to },
    customers: customers ?? [],
    orders: statsOrders ?? [],
  })

  const totals = chartData.reduce(
    (acc, curr) => ({ orders: acc.orders + curr.orders, customers: acc.customers + curr.customers }),
    { orders: 0, customers: 0 }
  )

  const orderList = allOrders ?? []
  const cancelledOrders = orderList.filter((o) => o.status === "cancelled").length
  const totalRevenue = orderList.reduce((sum, o) => sum + ((o.total ?? 0) / 100), 0)
  const avgOrderValue = orderList.length > 0 ? totalRevenue / orderList.length : 0

  const reviewList = (reviews as any) ?? []
  const reviewArray = Array.isArray(reviewList) ? reviewList : reviewList?.reviews ?? []
  const avgRating =
    reviewArray.length > 0
      ? reviewArray.reduce((s: number, r: any) => s + (r.rating ?? 0), 0) / reviewArray.length
      : 0

  const recentOrders = orderList.slice(0, 5)

  const toggleLine = (key: string) =>
    setActiveLines((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )

  const lineColors: Record<string, string> = {
    orders: "#3b82f6",
    customers: "#8b5cf6",
  }

  return (
    <div className="flex flex-col gap-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={ShoppingCart}
          label="Total Orders"
          value={orderList.length}
          sub={`${notFulfilledOrders} pending`}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          href="/orders"
        />
        <StatCard
          icon={CurrencyDollar}
          label="Total Revenue"
          value={formatMoney(totalRevenue)}
          sub={`Avg ${formatMoney(avgOrderValue)}/order`}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
        />
        <StatCard
          icon={Star}
          label="Reviews"
          value={reviewArray.length}
          sub={`${avgRating.toFixed(1)} avg rating`}
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
          href="/reviews"
        />
        <StatCard
          icon={ChatBubbleLeftRight}
          label="Unread Messages"
          value={unreadMessages?.length ?? 0}
          sub="Customer support"
          iconBg="bg-violet-50"
          iconColor="text-violet-500"
          href="/messages"
        />
      </div>

      {/* Action Buttons Row */}
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading>Actions Required</Heading>
            <Text className="text-ui-fg-subtle" size="small">
              Items that need your attention
            </Text>
          </div>
        </div>
        <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <ActionButton
            count={notFulfilledOrders}
            label="Orders to fulfill"
            href="/orders?order_status=not_fulfilled"
            color=""
          />
          <ActionButton
            count={fulfilledOrders}
            label="Orders to ship"
            href="/orders?order_status=fulfilled"
            color=""
          />
          <ActionButton
            count={typeof reviewsToReply === "number" ? reviewsToReply : reviewsToReply?.length ?? 0}
            label="Reviews to reply"
            href="/reviews?seller_note=false"
            color=""
          />
          <ActionButton
            count={unreadMessages?.length ?? 0}
            label="Unread messages"
            href="/messages"
            color=""
          />
        </div>
      </Container>

      {/* Main Chart */}
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading>Performance Analytics</Heading>
            <Text className="text-ui-fg-subtle" size="small">
              Orders and customer activity over time
            </Text>
          </div>
          <Popover>
            <Popover.Trigger asChild>
              <Button variant="secondary" size="small">
                <CalendarMini />
                {from ? (
                  to ? (
                    <>
                      {format(from, "MMM dd")} — {format(to, "MMM dd, yyyy")}
                    </>
                  ) : (
                    format(from, "MMM dd, yyyy")
                  )
                ) : (
                  "Pick a date"
                )}
              </Button>
            </Popover.Trigger>
            <Popover.Content>
              <Calendar
                mode="range"
                selected={{ from, to }}
                onSelect={(range) =>
                  range && updateDateRange(`${range.from}`, `${range.to}`)
                }
                numberOfMonths={2}
                defaultMonth={from}
              />
            </Popover.Content>
          </Popover>
        </div>

        <div className="relative px-6 py-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="col-span-3 relative h-[200px] md:h-[280px] w-full">
            {statsPending ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="customersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => format(new Date(v), "MMM d")}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <CartesianGrid stroke="#e5e7eb" vertical={false} />
                  <Tooltip content={<CustomTooltip />} />
                  {activeLines.includes("orders") && (
                    <Area
                      type="monotone"
                      dataKey="orders"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#ordersGrad)"
                    />
                  )}
                  {activeLines.includes("customers") && (
                    <Area
                      type="monotone"
                      dataKey="customers"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fill="url(#customersGrad)"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {(["orders", "customers"] as const).map((key) => (
              <button
                key={key}
                onClick={() => toggleLine(key)}
                className={`p-4 border rounded-xl flex flex-col items-start transition-all ${
                  activeLines.includes(key)
                    ? "border-ui-border-strong bg-ui-bg-subtle"
                    : "border-ui-border-base bg-ui-bg-base opacity-50"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: lineColors[key] }}
                  />
                  <span className="text-sm font-semibold capitalize text-ui-fg-base">
                    {key}
                  </span>
                </div>
                <p className="text-xl font-bold text-ui-fg-base">
                  {key === "orders" ? totals.orders : totals.customers}
                </p>
                <p className="text-xs text-ui-fg-muted">In date range</p>
              </button>
            ))}
          </div>
        </div>
      </Container>

      {/* Bottom section: Recent Orders + Order Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Orders */}
        <Container className="divide-y p-0 lg:col-span-2">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <Heading level="h2" className="text-base font-semibold">
                Recent Orders
              </Heading>
              <Text size="small" className="text-ui-fg-muted">
                Your latest 5 orders
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
              <div className="px-6 py-6 text-center text-ui-fg-muted text-sm">
                Loading…
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="px-6 py-6 text-center text-ui-fg-muted text-sm">
                No orders yet
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ui-border-base bg-ui-bg-subtle">
                    <th className="px-5 py-3 text-left text-xs font-medium text-ui-fg-muted">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ui-fg-muted">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ui-fg-muted">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-ui-fg-muted">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ui-fg-muted">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
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
                      <td className="px-4 py-3 text-xs text-ui-fg-subtle truncate max-w-[120px]">
                        {order.customer?.email ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            order.fulfillment_status === "fulfilled"
                              ? "bg-green-100 text-green-700"
                              : order.fulfillment_status === "not_fulfilled"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {(order.fulfillment_status ?? "—").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-ui-fg-base">
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

        {/* Right: Order breakdown + Review summary */}
        <div className="flex flex-col gap-4">
          {/* Order Status Breakdown */}
          <Container className="divide-y p-0">
            <div className="px-5 py-4">
              <Heading level="h2" className="text-base font-semibold">
                Order Status
              </Heading>
              <Text size="small" className="text-ui-fg-muted">
                All orders breakdown
              </Text>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              {[
                {
                  label: "Fulfilled",
                  value: fulfilledOrders,
                  color: "bg-green-500",
                  textColor: "text-green-600",
                },
                {
                  label: "Pending",
                  value: notFulfilledOrders,
                  color: "bg-amber-400",
                  textColor: "text-amber-600",
                },
                {
                  label: "Cancelled",
                  value: cancelledOrders,
                  color: "bg-red-400",
                  textColor: "text-red-600",
                },
              ].map(({ label, value, color, textColor }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-xs text-ui-fg-subtle">{label}</span>
                  <div className="h-2 flex-1 rounded-full bg-ui-bg-subtle overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{
                        width: orderList.length > 0
                          ? `${(value / orderList.length) * 100}%`
                          : "0%",
                      }}
                    />
                  </div>
                  <span className={`w-6 text-right text-xs font-bold ${textColor}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </Container>

          {/* Review Summary */}
          <Container className="divide-y p-0">
            <div className="px-5 py-4">
              <Heading level="h2" className="text-base font-semibold">
                Review Summary
              </Heading>
              <Text size="small" className="text-ui-fg-muted">
                Customer feedback
              </Text>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ui-fg-muted">Total Reviews</span>
                <span className="text-sm font-semibold text-ui-fg-base">
                  {reviewArray.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ui-fg-muted">Avg Rating</span>
                <span className="flex items-center gap-1 text-sm font-semibold text-amber-500">
                  <Star className="text-amber-500" />
                  {avgRating.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ui-fg-muted">Needs Reply</span>
                <span className={`text-sm font-semibold ${typeof reviewsToReply === "number" && reviewsToReply > 0 ? "text-red-500" : "text-green-600"}`}>
                  {typeof reviewsToReply === "number" ? reviewsToReply : reviewsToReply?.length ?? 0}
                </span>
              </div>
              <Link
                to="/reviews"
                className="text-xs text-blue-600 hover:underline font-medium mt-1"
              >
                View all reviews →
              </Link>
            </div>
          </Container>

          {/* Products count */}
          <Container className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <ShoppingBag className="text-emerald-500" />
              </div>
              <div className="flex-1">
                <p className="text-xl font-bold text-ui-fg-base">{productCount ?? "—"}</p>
                <p className="text-xs text-ui-fg-muted">Total Products Listed</p>
              </div>
              <Link to="/products" className="text-xs text-blue-600 hover:underline">
                Manage →
              </Link>
            </div>
          </Container>
        </div>
      </div>

      {/* Recent Payouts */}
      {Array.isArray(payouts) && payouts.length > 0 && (
        <Container className="divide-y p-0">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <Heading level="h2" className="text-base font-semibold">
                Recent Payouts
              </Heading>
              <Text size="small" className="text-ui-fg-muted">
                Latest payout activity
              </Text>
            </div>
            <Link to="/payouts" className="text-xs text-blue-600 hover:underline font-medium">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ui-border-base bg-ui-bg-subtle">
                  <th className="px-5 py-3 text-left text-xs font-medium text-ui-fg-muted">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-ui-fg-muted">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-ui-fg-muted">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-ui-fg-muted">Date</th>
                </tr>
              </thead>
              <tbody>
                {payouts.slice(0, 5).map((payout: any) => (
                  <tr
                    key={payout.id}
                    className="border-b border-ui-border-base last:border-0 hover:bg-ui-bg-subtle"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-ui-fg-subtle">
                      {payout.id?.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          payout.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : payout.status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-semibold text-ui-fg-base">
                      {formatMoney((payout.amount ?? 0) / 100)}
                    </td>
                    <td className="px-4 py-3 text-xs text-ui-fg-muted whitespace-nowrap">
                      {payout.created_at
                        ? format(new Date(payout.created_at), "MMM d, yyyy")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      )}
    </div>
  )
}
