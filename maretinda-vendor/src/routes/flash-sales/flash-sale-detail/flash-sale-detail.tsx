import { useEffect, useRef, useState } from "react"
import { useParams, useNavigate, Outlet } from "react-router-dom"
import { Button, Container, Heading, Input, Label, toast, usePrompt } from "@medusajs/ui"
import { Bolt, PencilSquare, Trash, Plus, MagnifyingGlass, XMark } from "@medusajs/icons"
import {
  useFlashSale,
  useAddFlashSaleItem,
  useRemoveFlashSaleItem,
  useUpdateFlashSaleItem,
} from "../../../hooks/api/flash-sales"
import { useProducts } from "../../../hooks/api/products"
import { FlashSaleItem, getFlashSaleStatus, getTimeRemaining } from "../../../lib/flash-sales"

const STATUS_COLOR: Record<string, string> = {
  green: "bg-green-100 text-green-700",
  orange: "bg-orange-100 text-orange-700",
  blue: "bg-blue-100 text-blue-700",
  grey: "bg-gray-100 text-gray-600",
  red: "bg-red-100 text-red-700",
}

const ITEM_STATUS_STYLE: Record<string, string> = {
  pending: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
}

// ── Product search + select ────────────────────────────────────────────────

function ProductSearchSelect({
  onSelect,
  excludeIds,
}: {
  onSelect: (product: { id: string; title: string; thumbnail: string | null }) => void
  excludeIds: string[]
}) {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350)
    return () => clearTimeout(t)
  }, [query])

  const { products, isLoading } = useProducts(
    { q: debouncedQuery || undefined, limit: 12, offset: 0 },
    { enabled: open },
  )

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const filtered = (products || []).filter((p: any) => !excludeIds.includes(p.id))

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-violet-300">
        <MagnifyingGlass className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          className="flex-1 text-sm outline-none placeholder:text-gray-400"
          placeholder="Search your products..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {query && (
          <button onClick={() => { setQuery(""); setOpen(false) }}>
            <XMark className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {isLoading && <div className="px-4 py-3 text-sm text-gray-400">Searching...</div>}
          {!isLoading && filtered.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-400">
              {debouncedQuery ? "No products found" : "Start typing to search"}
            </div>
          )}
          {filtered.map((product: any) => (
            <button
              key={product.id}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-violet-50 text-left transition-colors"
              onClick={() => { onSelect({ id: product.id, title: product.title, thumbnail: product.thumbnail }); setQuery(""); setOpen(false) }}
            >
              <div className="w-9 h-9 rounded-md bg-gray-100 shrink-0 overflow-hidden">
                {product.thumbnail
                  ? <img src={product.thumbnail} alt={product.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px]">IMG</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{product.title}</div>
                <div className="text-[10px] text-gray-400 truncate">{product.id}</div>
              </div>
              <span className="text-[10px] text-violet-500 font-medium shrink-0">Select →</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Apply product form ─────────────────────────────────────────────────────

function ApplyForm({ flashSaleId, existingIds, onAdded }: {
  flashSaleId: string
  existingIds: string[]
  onAdded: () => void
}) {
  const [selected, setSelected] = useState<{ id: string; title: string; thumbnail: string | null } | null>(null)
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [discountValue, setDiscountValue] = useState("")
  const [stockLimit, setStockLimit] = useState("")

  const { mutate: addItem, isPending } = useAddFlashSaleItem(flashSaleId, {
    onSuccess: () => {
      toast.success("Application submitted — pending admin approval")
      setSelected(null)
      setDiscountValue("")
      setStockLimit("")
      onAdded()
    },
    onError: (err: any) => toast.error(err?.message || "Failed to apply product"),
  })

  const handleApply = () => {
    if (!selected) { toast.error("Select a product first"); return }
    if (!discountValue || parseFloat(discountValue) <= 0) { toast.error("Enter a valid discount"); return }
    if (discountType === "percentage" && parseFloat(discountValue) > 100) { toast.error("Percentage cannot exceed 100"); return }
    addItem({
      product_id: selected.id,
      discount_type: discountType,
      discount_value: parseFloat(discountValue),
      stock_limit: stockLimit ? parseInt(stockLimit) : undefined,
    })
  }

  return (
    <div className="border border-dashed border-violet-200 rounded-xl p-5 bg-violet-50/40 space-y-4">
      <p className="text-sm font-semibold text-gray-700">Apply a Product</p>
      <p className="text-xs text-gray-400">Your application will be reviewed by admin before going live.</p>

      {!selected ? (
        <ProductSearchSelect onSelect={setSelected} excludeIds={existingIds} />
      ) : (
        <div className="flex items-center gap-3 border border-violet-200 rounded-lg px-3 py-2.5 bg-white">
          <div className="w-9 h-9 rounded-md bg-gray-100 shrink-0 overflow-hidden">
            {selected.thumbnail
              ? <img src={selected.thumbnail} alt={selected.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px]">IMG</div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 truncate">{selected.title}</div>
            <div className="text-[10px] text-gray-400 truncate">{selected.id}</div>
          </div>
          <button className="text-gray-400 hover:text-gray-600 shrink-0" onClick={() => setSelected(null)}>
            <XMark className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {selected && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Discount Type</Label>
              <select
                className="w-full border rounded-md px-2 py-1.5 text-sm bg-white"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (₱)</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Discount {discountType === "percentage" ? "(%)" : "(₱)"}</Label>
              <Input
                type="number" min="0" max={discountType === "percentage" ? "100" : undefined}
                placeholder={discountType === "percentage" ? "e.g. 30" : "e.g. 500"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                size="small"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Stock Limit (optional)</Label>
              <Input
                type="number" min="1" placeholder="e.g. 50"
                value={stockLimit}
                onChange={(e) => setStockLimit(e.target.value)}
                size="small"
              />
            </div>
          </div>
          <Button size="small" onClick={handleApply} isLoading={isPending}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Submit Application
          </Button>
        </>
      )}
    </div>
  )
}

// ── Application row ────────────────────────────────────────────────────────

function ApplicationRow({ item, flashSaleId }: { item: FlashSaleItem & { item_status?: string }; flashSaleId: string }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    discount_type: item.discount_type,
    discount_value: String(item.discount_value),
    stock_limit: item.stock_limit ? String(item.stock_limit) : "",
  })
  const prompt = usePrompt()
  const status = (item as any).item_status || "pending"
  const canEdit = status === "pending"

  const { mutate: updateItem, isPending: updating } = useUpdateFlashSaleItem(flashSaleId, item.id, {
    onSuccess: () => { toast.success("Application updated"); setEditing(false) },
    onError: (e: any) => toast.error(e?.message || "Update failed"),
  })
  const { mutate: removeItem } = useRemoveFlashSaleItem(flashSaleId, {
    onSuccess: () => toast.success("Application withdrawn"),
    onError: (e: any) => toast.error(e?.message || "Cannot withdraw"),
  })

  return (
    <div className="border border-gray-100 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {item.product?.thumbnail && (
            <img src={item.product.thumbnail} alt={item.product?.title} className="w-10 h-10 rounded-md object-cover shrink-0 bg-gray-100" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-gray-800 truncate">
                {item.product?.title || item.product_id}
              </div>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${ITEM_STATUS_STYLE[status] || ITEM_STATUS_STYLE.pending}`}>
                {status}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{item.product_id}</div>

            {editing ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                <select
                  className="border rounded px-2 py-1 text-xs"
                  value={form.discount_type}
                  onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value as any }))}
                >
                  <option value="percentage">%</option>
                  <option value="fixed">₱</option>
                </select>
                <Input type="number" value={form.discount_value} onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))} size="small" />
                <Input type="number" placeholder="Stock" value={form.stock_limit} onChange={(e) => setForm((f) => ({ ...f, stock_limit: e.target.value }))} size="small" />
                <Button size="small" onClick={() => updateItem({ ...form, discount_value: parseFloat(form.discount_value), stock_limit: form.stock_limit ? parseInt(form.stock_limit) : null })} isLoading={updating}>Save</Button>
                <Button size="small" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-3">
                <span className="text-xs font-semibold text-red-600">
                  -{item.discount_value}{item.discount_type === "percentage" ? "%" : "₱"}
                </span>
                {item.stock_limit && (
                  <span className="text-xs text-gray-400">{item.sold_count}/{item.stock_limit} sold</span>
                )}
                {status === "rejected" && (
                  <span className="text-xs text-red-500">Rejected by admin</span>
                )}
              </div>
            )}
          </div>
        </div>

        {canEdit && !editing && (
          <div className="flex items-center gap-1 shrink-0">
            <button className="p-1 hover:bg-gray-100 rounded" onClick={() => setEditing(true)}>
              <PencilSquare className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <button
              className="p-1 hover:bg-red-50 rounded"
              onClick={async () => {
                const ok = await prompt({ title: "Withdraw", description: "Withdraw this application?", confirmText: "Withdraw", cancelText: "Cancel" })
                if (ok) removeItem(item.id)
              }}
            >
              <Trash className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export const FlashSaleDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showApply, setShowApply] = useState(false)
  const { flash_sale: sale, isLoading, refetch } = useFlashSale(id!)

  if (isLoading || !sale) return <div className="p-8 text-center text-sm text-gray-400">Loading...</div>

  const [statusColor, statusLabel] = getFlashSaleStatus(sale)
  const canApply = !["ended", "cancelled"].includes(sale.status)
  const existingProductIds = (sale.items || []).map((i: FlashSaleItem) => i.product_id)

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Outlet />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button className="text-xs text-gray-400 hover:text-gray-600 mb-1" onClick={() => navigate("..")}>
            ← Flash Sales
          </button>
          <Heading level="h1">{sale.title}</Heading>
          {sale.description && <p className="text-sm text-gray-500 mt-1">{sale.description}</p>}
          <p className="text-xs text-gray-400 mt-1">Platform event — apply your products to participate</p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[statusColor] || STATUS_COLOR.grey}`}>
          {sale.status === "active" && (
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
              <span className="relative w-1.5 h-1.5 rounded-full bg-green-500" />
            </span>
          )}
          {statusLabel}
        </span>
      </div>

      {/* Event info */}
      <Container className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Starts</p>
          <p className="font-medium">{new Date(sale.starts_at).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Ends</p>
          <p className="font-medium">{new Date(sale.ends_at).toLocaleString()}</p>
          {sale.status === "active" && (
            <p className="text-xs text-green-600 font-medium">{getTimeRemaining(sale.ends_at)} remaining</p>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Per-customer limit</p>
          <p className="font-medium">{sale.max_order_quantity ?? "No limit"}</p>
        </div>
      </Container>

      {/* My Applications */}
      <Container className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Heading level="h2">My Applications ({sale.items?.length ?? 0})</Heading>
            <p className="text-xs text-gray-400 mt-0.5">Products you've applied to this flash sale</p>
          </div>
          {canApply && (
            <Button size="small" variant="secondary" onClick={() => setShowApply((v) => !v)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              {showApply ? "Cancel" : "Apply Product"}
            </Button>
          )}
        </div>

        {showApply && canApply && (
          <div className="mb-4">
            <ApplyForm
              flashSaleId={sale.id}
              existingIds={existingProductIds}
              onAdded={() => { setShowApply(false); refetch() }}
            />
          </div>
        )}

        {!sale.items?.length ? (
          <div className="text-center py-8 text-sm text-gray-400">
            <Bolt className="w-6 h-6 text-gray-300 mx-auto mb-2" />
            You haven't applied any products yet.{" "}
            {canApply && <button className="text-violet-500 hover:underline" onClick={() => setShowApply(true)}>Apply now →</button>}
          </div>
        ) : (
          <div className="space-y-3">
            {sale.items.map((item: any) => (
              <ApplicationRow key={item.id} item={item} flashSaleId={sale.id} />
            ))}
          </div>
        )}
      </Container>
    </div>
  )
}
