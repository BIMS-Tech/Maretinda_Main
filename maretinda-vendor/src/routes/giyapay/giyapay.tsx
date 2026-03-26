import React, { useState } from 'react'
import { Container, Heading, StatusBadge, Table, Text, Input, Button, Select } from "@medusajs/ui"
import { MagnifyingGlass, XMark, Adjustments } from "@medusajs/icons"
import { useGiyaPayTransactions, GiyaPayFilters } from "../../hooks/api/giyapay"

const STATUSES = ['SUCCESS', 'PENDING', 'FAILED', 'CANCELLED']
const GATEWAYS = ['MASTERCARD/VISA', 'GCASH', 'INSTAPAY', 'PAYMAYA', 'UNIONPAY', 'GRAB', 'GRABPAY', 'QRPH', 'WECHATPAY']

const GATEWAY_LOGOS: Record<string, string> = {
  'MASTERCARD/VISA': 'https://pay.giyapay.com/images/select-mastercard-visa.png',
  'VISA':            'https://pay.giyapay.com/images/select-mastercard-visa.png',
  'MASTERCARD':      'https://pay.giyapay.com/images/select-mastercard-visa.png',
  'GCASH':           'https://pay.giyapay.com/images/select-gcash.png',
  'QRPH':            'https://pay.giyapay.com/images/select-qrph.png',
  'UNIONPAY':        'https://pay.giyapay.com/images/select-unionpay.png',
  'WECHATPAY':       'https://pay.giyapay.com/images/select-wechatpay.png',
  'GRAB':            'https://pay.giyapay.com/images/select-grabpay.png',
  'GRABPAY':         'https://pay.giyapay.com/images/select-grabpay.png',
}

function GatewayLogo({ gateway }: { gateway: string }) {
  const key = (gateway || '').toUpperCase()
  const src = GATEWAY_LOGOS[key]
  if (src) {
    return (
      <div style={{ background: '#fff', borderRadius: 4, padding: '2px 6px', display: 'inline-flex', alignItems: 'center', border: '1px solid #e5e7eb' }}>
        <img src={src} alt={gateway} style={{ height: 18, width: 'auto', objectFit: 'contain' }} />
      </div>
    )
  }
  return <Text className="text-sm">{gateway || '-'}</Text>
}

const getStatus = (status: string) => {
  switch (status) {
    case 'SUCCESS':   return <StatusBadge color="green">Success</StatusBadge>
    case 'PENDING':   return <StatusBadge color="orange">Pending</StatusBadge>
    case 'FAILED':    return <StatusBadge color="red">Failed</StatusBadge>
    case 'CANCELLED': return <StatusBadge color="grey">Cancelled</StatusBadge>
    default:          return <StatusBadge color="grey">Unknown</StatusBadge>
  }
}

const formatAmount = (amount: number, currency = 'PHP') =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency }).format(amount)

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

export const GiyaPay: React.FC = () => {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [gateway, setGateway] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  // Applied filters (committed on search)
  const [applied, setApplied] = useState<GiyaPayFilters>({ page: 1, limit: 20 })

  const { data, isLoading, refetch } = useGiyaPayTransactions(applied)
  const transactions = data?.transactions || []
  const summary = data?.summary
  const totalPages = Math.ceil((data?.count || 0) / (applied.limit || 20))

  const applyFilters = () => {
    const filters: GiyaPayFilters = { page: 1, limit: 20 }
    if (search.trim()) filters.search = search.trim()
    if (status) filters.status = status
    if (gateway) filters.gateway = gateway
    if (dateFrom) filters.date_from = dateFrom
    if (dateTo) filters.date_to = dateTo
    setPage(1)
    setApplied(filters)
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('')
    setGateway('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
    setApplied({ page: 1, limit: 20 })
  }

  const goToPage = (p: number) => {
    setPage(p)
    setApplied((prev) => ({ ...prev, page: p }))
  }

  const activeFilterCount = [
    applied.search, applied.status, applied.gateway,
    applied.date_from, applied.date_to,
  ].filter(Boolean).length

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>GiyaPay Transactions</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            View your payment transactions processed through GiyaPay
          </Text>
        </div>
        <Button variant="secondary" size="small" onClick={() => refetch()} isLoading={isLoading}>
          Refresh
        </Button>
      </div>

      {/* Summary bar */}
      {summary && (
        <div className="px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle px-4 py-2">
            <Text className="text-xs text-ui-fg-muted">Total</Text>
            <Text className="font-semibold text-ui-fg-base">{formatAmount(summary.total_amount)}</Text>
            <Text className="text-xs text-ui-fg-muted">{summary.total_count} transactions</Text>
          </div>
          <div className="rounded-lg border border-ui-tag-green-border bg-ui-tag-green-bg px-4 py-2">
            <Text className="text-xs text-ui-tag-green-text">Success</Text>
            <Text className="font-semibold text-ui-fg-base">{summary.success_count}</Text>
          </div>
          <div className="rounded-lg border border-ui-tag-orange-border bg-ui-tag-orange-bg px-4 py-2">
            <Text className="text-xs text-ui-tag-orange-text">Pending</Text>
            <Text className="font-semibold text-ui-fg-base">{summary.pending_count}</Text>
          </div>
          <div className="rounded-lg border border-ui-tag-red-border bg-ui-tag-red-bg px-4 py-2">
            <Text className="text-xs text-ui-tag-red-text">Failed</Text>
            <Text className="font-semibold text-ui-fg-base">{summary.failed_count}</Text>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="px-6 py-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 items-end">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ui-fg-muted pointer-events-none" />
            <Input
              className="pl-8"
              placeholder="Search by ref # or order ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>

          {/* Status */}
          <Select value={status || '_all'} onValueChange={(v) => setStatus(v === '_all' ? '' : v)}>
            <Select.Trigger className="w-36">
              <Select.Value placeholder="All statuses" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="_all">All statuses</Select.Item>
              {STATUSES.map((s) => (
                <Select.Item key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</Select.Item>
              ))}
            </Select.Content>
          </Select>

          {/* Gateway */}
          <Select value={gateway || '_all'} onValueChange={(v) => setGateway(v === '_all' ? '' : v)}>
            <Select.Trigger className="w-40">
              <Select.Value placeholder="All methods" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="_all">All methods</Select.Item>
              {GATEWAYS.map((g) => (
                <Select.Item key={g} value={g}>{g}</Select.Item>
              ))}
            </Select.Content>
          </Select>

          {/* Date range */}
          <div className="flex items-center gap-1">
            <input
              type="date"
              className="rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm text-ui-fg-base focus:outline-none focus:ring-1 focus:ring-ui-border-interactive"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <Text className="text-ui-fg-muted text-xs">to</Text>
            <input
              type="date"
              className="rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm text-ui-fg-base focus:outline-none focus:ring-1 focus:ring-ui-border-interactive"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button size="small" variant="primary" onClick={applyFilters}>
              <Adjustments className="h-4 w-4 mr-1" />
              Filter
              {activeFilterCount > 0 && (
                <span className="ml-1.5 rounded-full bg-ui-bg-base text-ui-fg-base text-xs w-4 h-4 flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            {activeFilterCount > 0 && (
              <Button size="small" variant="secondary" onClick={clearFilters}>
                <XMark className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-6 py-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 rounded bg-ui-bg-subtle animate-pulse" />
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Transaction ID</Table.HeaderCell>
                  <Table.HeaderCell>Order ID</Table.HeaderCell>
                  <Table.HeaderCell>Amount</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell>Payment Method</Table.HeaderCell>
                  <Table.HeaderCell>Date</Table.HeaderCell>
                  <Table.HeaderCell>Description</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {transactions.map((t: any) => (
                  <Table.Row key={t.id}>
                    <Table.Cell>
                      <Text className="font-mono text-sm">{t.reference_number || '-'}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text className="font-mono text-sm">{t.order_id || '-'}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text className="font-semibold">{formatAmount(t.amount, t.currency)}</Text>
                    </Table.Cell>
                    <Table.Cell>{getStatus(t.status)}</Table.Cell>
                    <Table.Cell>
                      <GatewayLogo gateway={t.gateway} />
                    </Table.Cell>
                    <Table.Cell>
                      <Text className="text-sm">{formatDate(t.created_at)}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text className="text-sm text-ui-fg-subtle">{t.description || '-'}</Text>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <Text className="text-xs text-ui-fg-muted">
                  Page {page} of {totalPages} · {data?.count} total
                </Text>
                <div className="flex gap-2">
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center text-center my-24 flex-col gap-3">
            <Adjustments className="h-10 w-10 text-ui-fg-muted" />
            <Heading level="h2">No transactions found</Heading>
            <Text className="text-ui-fg-subtle" size="small">
              {activeFilterCount > 0
                ? 'No transactions match your current filters. Try adjusting or clearing them.'
                : 'Your GiyaPay transactions will appear here once customers start making payments.'}
            </Text>
            {activeFilterCount > 0 && (
              <Button size="small" variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>
    </Container>
  )
}
