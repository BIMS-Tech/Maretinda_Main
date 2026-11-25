import { Badge, Button, clx, Container, Heading, Input, Text, toast } from "@medusajs/ui"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { StockFilter, StockRow, useSaveStock, useStock } from "../../../hooks/api/delivery-setup"
import { Thumbnail } from "../thumbnail"

const PAGE = 25

const FILTERS: { key: StockFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unset", label: "Not entered" },
  { key: "low", label: "Running low" },
  { key: "out", label: "Out of stock" },
]

const StockBadge = ({ row, lowAt }: { row: StockRow; lowAt: number }) => {
  if (row.kind === "unlimited") return <Badge size="2xsmall" color="grey">Not tracked</Badge>
  if (row.on_hand === null && row.elsewhere === 0) return <Badge size="2xsmall" color="orange">Not entered</Badge>
  if (row.available <= 0) return <Badge size="2xsmall" color="red">Out of stock</Badge>
  if (row.available <= lowAt) return <Badge size="2xsmall" color="orange">Running low</Badge>
  return <Badge size="2xsmall" color="green">In stock</Badge>
}

/**
 * Stock in plain terms: type how many you have on hand, save everything at
 * once. With a product id it shows only that product's variants.
 */
export const StockEditor = ({ productId, title = "Update stock" }: { productId?: string; title?: string }) => {
  const [filter, setFilter] = useState<StockFilter>("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [edits, setEdits] = useState<Record<string, string>>({})

  const { data, isPending, isError, error } = useStock({
    product_id: productId,
    q: search,
    filter,
    limit: PAGE,
    offset: page * PAGE,
  })
  const save = useSaveStock()

  const rows = data?.stock ?? []
  const saved = useMemo(() => Object.fromEntries(rows.map((r) => [r.variant_id, r.on_hand === null ? "" : String(r.on_hand)])), [rows])
  const changed = Object.entries(edits).filter(([id, value]) => value !== "" && value !== saved[id])

  const submit = async () => {
    try {
      const { saved: n } = await save.mutateAsync(changed.map(([variant_id, quantity]) => ({ variant_id, quantity })))
      setEdits({})
      toast.success(`Stock saved for ${n} item${n === 1 ? "" : "s"}.`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save the stock. Please try again.")
    }
  }

  const pick = (next: StockFilter) => {
    setFilter(next)
    setPage(0)
  }

  return (
    <Container className="divide-y p-0" data-testid="stock-editor">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div>
          <Heading level="h2">{title}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Enter how many you have on hand. Buyers can order what isn't already sold.
          </Text>
        </div>
        <Button size="small" onClick={submit} disabled={!changed.length} isLoading={save.isPending} data-testid="stock-save">
          {changed.length ? `Save ${changed.length} change${changed.length === 1 ? "" : "s"}` : "Save"}
        </Button>
      </div>

      {data && !data.has_location && (
        <div className="bg-ui-tag-orange-bg px-6 py-4">
          <Text size="small" className="text-ui-tag-orange-text">
            Set up your pickup location first: stock is kept there.{" "}
            <Link to="/shipping?tab=setup" className="font-medium underline">
              Set up delivery
            </Link>
          </Text>
        </div>
      )}

      {!productId && (
        <div className="flex flex-wrap items-center gap-2 px-6 py-3">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => pick(f.key)}
              className={clx(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filter === f.key
                  ? "bg-ui-bg-interactive text-ui-fg-on-color border-transparent"
                  : "bg-ui-bg-base border-ui-border-base text-ui-fg-subtle hover:bg-ui-bg-base-hover"
              )}
            >
              {f.label} {data ? `(${data.counts[f.key]})` : ""}
            </button>
          ))}
          <div className="ml-auto w-full max-w-xs">
            <Input
              size="small"
              type="search"
              placeholder="Search product or SKU"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
            />
          </div>
        </div>
      )}

      {isError ? (
        <Text size="small" className="text-ui-fg-error px-6 py-6">
          {error instanceof Error ? error.message : "Couldn't load your stock."}
        </Text>
      ) : isPending ? (
        <Text size="small" className="text-ui-fg-muted px-6 py-6">
          Loading your stock…
        </Text>
      ) : rows.length === 0 ? (
        <Text size="small" className="text-ui-fg-muted px-6 py-6">
          {filter === "all" && !search ? (
            <>
              No products yet.{" "}
              <Link to="/products/create" className="text-ui-fg-interactive hover:underline">
                Add your first product
              </Link>
            </>
          ) : (
            "Nothing here."
          )}
        </Text>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="bg-ui-bg-subtle text-ui-fg-muted text-left text-xs">
                <th className="px-6 py-2.5 font-medium">Item</th>
                <th className="px-3 py-2.5 text-right font-medium">Sold, to ship</th>
                <th className="px-3 py-2.5 text-right font-medium">Buyers can order</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-6 py-2.5 text-right font-medium">On hand</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => {
                const value = edits[row.variant_id] ?? saved[row.variant_id] ?? ""
                const dirty = changed.some(([id]) => id === row.variant_id)
                const label = row.variant_title && row.variant_title !== "Default variant" ? row.variant_title : null
                return (
                  <tr key={row.variant_id} data-testid="stock-row">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <Thumbnail src={row.thumbnail} />
                        <div className="min-w-0">
                          <Link to={`/products/${row.product_id}`} className="text-ui-fg-base hover:underline">
                            {row.product_title}
                          </Link>
                          <Text size="xsmall" className="text-ui-fg-muted">
                            {[label, row.sku ? `SKU ${row.sku}` : null].filter(Boolean).join(" · ") || "One variant"}
                          </Text>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{row.kind === "unlimited" ? "—" : row.reserved}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{row.kind === "unlimited" ? "Any" : row.available}</td>
                    <td className="px-3 py-3">
                      <StockBadge row={row} lowAt={data!.low_at} />
                    </td>
                    <td className="px-6 py-3">
                      {row.kind === "tracked" ? (
                        <div className="ml-auto w-24">
                          <Input
                            size="small"
                            type="number"
                            min={0}
                            step={1}
                            inputMode="numeric"
                            aria-label={`On hand: ${row.product_title}${label ? `, ${label}` : ""}`}
                            className={clx("text-right tabular-nums", dirty && "ring-ui-border-interactive ring-1")}
                            placeholder="0"
                            disabled={!data!.has_location}
                            value={value}
                            onChange={(e) => setEdits((prev) => ({ ...prev, [row.variant_id]: e.target.value }))}
                          />
                        </div>
                      ) : (
                        <Text size="xsmall" className="text-ui-fg-muted text-right">
                          {row.kind === "unlimited" ? "Always available" : "Under Inventory"}
                        </Text>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {data && data.count > PAGE && (
        <div className="flex items-center justify-between px-6 py-3">
          <Text size="small" className="text-ui-fg-muted">
            {page * PAGE + 1}–{Math.min((page + 1) * PAGE, data.count)} of {data.count}
          </Text>
          <div className="flex gap-2">
            <Button size="small" variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button size="small" variant="secondary" disabled={(page + 1) * PAGE >= data.count} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </Container>
  )
}
