import {
  Button,
  Container,
  Heading,
  Input,
  Select,
  StatusBadge,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { ArrowDownTray, ArrowPath, XMark } from "@medusajs/icons"
import { useMemo, useState } from "react"
import {
  AdminShippingOrderFilters,
  downloadAdminWaybill,
  useAdminShippingOrders,
  useAdminShippingOrderAction,
} from "../../hooks/api/shipping-orders"

const PROVIDERS = [
  { value: "flyingtigers", label: "Flying Tigers" },
  { value: "ninjavan", label: "Ninja Van" },
]
const STATUSES = [
  "pending",
  "pending_pickup",
  "processing",
  "in_transit",
  "delivered",
  "cancelled",
  "failed",
  "returned",
]
const PAGE_SIZE = 20

const statusColor = (s: string): "green" | "orange" | "red" | "blue" | "grey" => {
  if (s === "delivered") return "green"
  if (["pending", "pending_pickup", "processing"].includes(s)) return "orange"
  if (["cancelled", "failed"].includes(s)) return "red"
  if (["in_transit", "returned"].includes(s)) return "blue"
  return "grey"
}

const peso = (n: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(n || 0)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

export const ShippingOrders = () => {
  const [search, setSearch] = useState("")
  const [provider, setProvider] = useState("")
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(0)
  const [applied, setApplied] = useState<AdminShippingOrderFilters>({})

  const filters: AdminShippingOrderFilters = useMemo(
    () => ({ ...applied, limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
    [applied, page]
  )

  const { orders, count, summary, isLoading, isFetching, refetch } =
    useAdminShippingOrders(filters)
  const action = useAdminShippingOrderAction()

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const activeFilters = [applied.search, applied.provider, applied.status].filter(Boolean).length

  const applyFilters = () => {
    const f: AdminShippingOrderFilters = {}
    if (search.trim()) f.search = search.trim()
    if (provider) f.provider = provider
    if (status) f.status = status
    setPage(0)
    setApplied(f)
  }

  const clearFilters = () => {
    setSearch("")
    setProvider("")
    setStatus("")
    setPage(0)
    setApplied({})
  }

  const handleWaybill = async (id: string, tracking: string | null) => {
    try {
      await downloadAdminWaybill(id, tracking)
    } catch (e) {
      toast.error("Waybill download failed", { description: (e as Error).message })
    }
  }

  const handleCancel = async (id: string) => {
    if (!window.confirm("Cancel this shipment with the carrier? This cannot be undone.")) return
    try {
      await action.mutateAsync({ action: "cancel-order", orderId: id, reason: "Cancelled by admin" })
      toast.success("Shipment cancelled")
    } catch (e) {
      toast.error("Cancel failed", { description: (e as Error).message })
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Shipping Orders</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            All shipments booked by sellers across every carrier
          </Text>
        </div>
        <Button variant="secondary" size="small" onClick={() => refetch()} isLoading={isFetching}>
          <ArrowPath className="mr-1" /> Refresh
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-3 px-6 py-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Orders", value: summary.totalOrders },
            { label: "Total Cost", value: peso(summary.totalCost) },
            { label: "Pending", value: summary.pending },
            { label: "Delivered", value: summary.delivered },
            { label: "Cancelled", value: summary.cancelled },
            { label: "Sellers", value: summary.sellerCount },
          ].map((c) => (
            <div key={c.label} className="rounded-lg border border-ui-border-base bg-ui-bg-subtle px-3 py-2">
              <Text className="text-xs text-ui-fg-muted">{c.label}</Text>
              <Text className="font-semibold text-ui-fg-base">{c.value}</Text>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2 px-6 py-4">
        <div className="min-w-[220px] flex-1">
          <Input
            placeholder="Search tracking #, order ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
        </div>
        <Select value={provider || "_all"} onValueChange={(v) => setProvider(v === "_all" ? "" : v)}>
          <Select.Trigger className="w-40">
            <Select.Value placeholder="All carriers" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="_all">All carriers</Select.Item>
            {PROVIDERS.map((p) => (
              <Select.Item key={p.value} value={p.value}>
                {p.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
        <Select value={status || "_all"} onValueChange={(v) => setStatus(v === "_all" ? "" : v)}>
          <Select.Trigger className="w-44">
            <Select.Value placeholder="All statuses" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="_all">All statuses</Select.Item>
            {STATUSES.map((s) => (
              <Select.Item key={s} value={s}>
                {s.replace(/_/g, " ")}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
        <Button variant="primary" size="small" onClick={applyFilters}>
          Filter{activeFilters > 0 ? ` (${activeFilters})` : ""}
        </Button>
        {activeFilters > 0 && (
          <Button variant="secondary" size="small" onClick={clearFilters}>
            <XMark className="mr-1" /> Clear
          </Button>
        )}
      </div>

      <div className="px-6 py-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-ui-bg-subtle" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="my-16 text-center">
            <Text className="text-ui-fg-subtle">No shipping orders found.</Text>
          </div>
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Seller</Table.HeaderCell>
                  <Table.HeaderCell>Order</Table.HeaderCell>
                  <Table.HeaderCell>Carrier</Table.HeaderCell>
                  <Table.HeaderCell>Tracking</Table.HeaderCell>
                  <Table.HeaderCell>Service</Table.HeaderCell>
                  <Table.HeaderCell>Amount</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell>Date</Table.HeaderCell>
                  <Table.HeaderCell>Actions</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {orders.map((o) => {
                  const terminal = ["delivered", "cancelled", "failed", "returned"].includes(o.status)
                  return (
                    <Table.Row key={o.id}>
                      <Table.Cell>{o.seller_name || o.seller_id}</Table.Cell>
                      <Table.Cell>
                        <Text className="font-mono text-xs">{o.medusa_order_id || "-"}</Text>
                      </Table.Cell>
                      <Table.Cell className="capitalize">{o.provider}</Table.Cell>
                      <Table.Cell>
                        {o.tracking_url ? (
                          <a
                            href={o.tracking_url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-xs text-ui-fg-interactive"
                          >
                            {o.tracking_number || "-"}
                          </a>
                        ) : (
                          <Text className="font-mono text-xs">{o.tracking_number || "-"}</Text>
                        )}
                      </Table.Cell>
                      <Table.Cell>{o.service_level || "-"}</Table.Cell>
                      <Table.Cell>{peso(parseFloat(String(o.amount)) || 0)}</Table.Cell>
                      <Table.Cell>
                        <StatusBadge color={statusColor(o.status)}>
                          {o.status.replace(/_/g, " ")}
                        </StatusBadge>
                      </Table.Cell>
                      <Table.Cell>
                        <Text className="text-xs">{fmtDate(o.created_at)}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex gap-1">
                          <Button
                            size="small"
                            variant="secondary"
                            onClick={() => handleWaybill(o.id, o.tracking_number)}
                            title="Download waybill"
                          >
                            <ArrowDownTray />
                          </Button>
                          {!terminal && (
                            <Button
                              size="small"
                              variant="secondary"
                              onClick={() => handleCancel(o.id)}
                              title="Cancel shipment"
                            >
                              <XMark />
                            </Button>
                          )}
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
              </Table.Body>
            </Table>

            <div className="mt-4 flex items-center justify-between">
              <Text className="text-xs text-ui-fg-muted">
                Page {page + 1} of {totalPages} · {count} total
              </Text>
              <div className="flex gap-2">
                <Button
                  size="small"
                  variant="secondary"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="small"
                  variant="secondary"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Container>
  )
}
