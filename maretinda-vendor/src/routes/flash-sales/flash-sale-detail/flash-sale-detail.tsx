import { useState } from "react"
import { useParams, useNavigate, Outlet } from "react-router-dom"
import { Button, Container, Heading, Input, Label, toast, usePrompt } from "@medusajs/ui"
import { Bolt, PencilSquare, Trash, Plus } from "@medusajs/icons"
import {
  useFlashSale,
  useSubmitFlashSale,
  useAddFlashSaleItem,
  useRemoveFlashSaleItem,
  useUpdateFlashSaleItem,
} from "../../../hooks/api/flash-sales"
import { FlashSaleItem, getFlashSaleStatus, getTimeRemaining } from "../../../lib/flash-sales"

const STATUS_COLOR: Record<string, string> = {
  green: "bg-green-100 text-green-700",
  orange: "bg-orange-100 text-orange-700",
  blue: "bg-blue-100 text-blue-700",
  grey: "bg-gray-100 text-gray-600",
  red: "bg-red-100 text-red-700",
}

function AddItemForm({ flashSaleId, onAdded }: { flashSaleId: string; onAdded: () => void }) {
  const [form, setForm] = useState({ product_id: "", discount_type: "percentage" as "percentage" | "fixed", discount_value: "", stock_limit: "" })
  const { mutate: addItem, isPending } = useAddFlashSaleItem(flashSaleId, {
    onSuccess: () => { toast.success("Product added"); setForm({ product_id: "", discount_type: "percentage", discount_value: "", stock_limit: "" }); onAdded() },
    onError: (err: any) => toast.error(err?.message || "Failed to add"),
  })
  return (
    <div className="border border-dashed border-gray-200 rounded-lg p-4 space-y-3">
      <p className="text-sm font-medium text-gray-700">Add Product to Flash Sale</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Product ID</Label>
          <Input placeholder="prod_..." value={form.product_id} onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))} size="small" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Discount Type</Label>
          <select className="w-full border rounded px-2 py-1.5 text-sm" value={form.discount_type} onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value as any }))}>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed (₱)</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Discount Value</Label>
          <Input type="number" min="0" placeholder="30" value={form.discount_value} onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))} size="small" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Stock Limit (optional)</Label>
          <Input type="number" min="1" placeholder="e.g. 50" value={form.stock_limit} onChange={(e) => setForm((f) => ({ ...f, stock_limit: e.target.value }))} size="small" />
        </div>
      </div>
      <Button size="small" onClick={() => addItem({ product_id: form.product_id, discount_type: form.discount_type, discount_value: parseFloat(form.discount_value), stock_limit: form.stock_limit ? parseInt(form.stock_limit) : undefined })} isLoading={isPending} disabled={!form.product_id || !form.discount_value}>
        <Plus className="w-3.5 h-3.5 mr-1" /> Add Product
      </Button>
    </div>
  )
}

function ItemRow({ item, flashSaleId, editable }: { item: FlashSaleItem; flashSaleId: string; editable: boolean }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ discount_type: item.discount_type, discount_value: String(item.discount_value), stock_limit: item.stock_limit ? String(item.stock_limit) : "" })
  const prompt = usePrompt()
  const { mutate: updateItem, isPending: updating } = useUpdateFlashSaleItem(flashSaleId, item.id, { onSuccess: () => { toast.success("Updated"); setEditing(false) }, onError: (e: any) => toast.error(e?.message || "Update failed") })
  const { mutate: removeItem } = useRemoveFlashSaleItem(flashSaleId, { onSuccess: () => toast.success("Removed") })
  const soldPct = item.stock_limit ? Math.round((item.sold_count / item.stock_limit) * 100) : 0
  return (
    <div className="border border-gray-100 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-800 truncate">{item.product?.title || item.product_id}</div>
          <div className="text-xs text-gray-400 mt-0.5">{item.product_id}</div>
          {editing ? (
            <div className="mt-3 grid grid-cols-3 gap-2">
              <select className="border rounded px-2 py-1 text-xs" value={form.discount_type} onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value as any }))}>
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
              <span className="text-xs font-semibold text-red-600">-{item.discount_value}{item.discount_type === "percentage" ? "%" : "₱"}</span>
              {item.stock_limit && (
                <div className="flex-1 max-w-[120px]">
                  <div className="h-1.5 bg-yellow-100 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${soldPct}%` }} />
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{item.sold_count}/{item.stock_limit} sold</div>
                </div>
              )}
            </div>
          )}
        </div>
        {editable && !editing && (
          <div className="flex items-center gap-1 shrink-0">
            <button className="p-1 hover:bg-gray-100 rounded" onClick={() => setEditing(true)}><PencilSquare className="w-3.5 h-3.5 text-gray-400" /></button>
            <button className="p-1 hover:bg-red-50 rounded" onClick={async () => { const ok = await prompt({ title: "Remove", description: "Remove this product?", confirmText: "Remove", cancelText: "Cancel" }); if (ok) removeItem(item.id) }}><Trash className="w-3.5 h-3.5 text-red-400" /></button>
          </div>
        )}
      </div>
    </div>
  )
}

export const FlashSaleDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const prompt = usePrompt()
  const [showAddItem, setShowAddItem] = useState(false)
  const { flash_sale: sale, isLoading, refetch } = useFlashSale(id!)
  const { mutate: submit, isPending: submitting } = useSubmitFlashSale(id!, {
    onSuccess: () => toast.success("Submitted for admin approval!"),
    onError: (err: any) => toast.error(err?.message || "Submit failed"),
  })

  if (isLoading || !sale) return <div className="p-8 text-center text-sm text-gray-400">Loading...</div>

  const [statusColor, statusLabel] = getFlashSaleStatus(sale)
  const editable = ["draft", "pending"].includes(sale.status)
  const canSubmit = sale.status === "draft"

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Outlet />
      <div className="flex items-start justify-between gap-4">
        <div>
          <button className="text-xs text-gray-400 hover:text-gray-600 mb-1" onClick={() => navigate("..")}>← Flash Sales</button>
          <Heading level="h1">{sale.title}</Heading>
          {sale.description && <p className="text-sm text-gray-500 mt-1">{sale.description}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[statusColor] || STATUS_COLOR.grey}`}>
            {sale.status === "active" && (<span className="relative flex w-1.5 h-1.5"><span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" /><span className="relative w-1.5 h-1.5 rounded-full bg-green-500" /></span>)}
            {statusLabel}
          </span>
          {canSubmit && (
            <Button size="small" onClick={async () => {
              const ok = await prompt({ title: "Submit for Approval", description: "Submit this flash sale for admin review?", confirmText: "Submit", cancelText: "Cancel" })
              if (ok) submit()
            }} isLoading={submitting}>
              <Bolt className="w-3.5 h-3.5 mr-1" /> Submit for Approval
            </Button>
          )}
          {editable && (
            <Button size="small" variant="secondary" onClick={() => navigate("edit")}>
              <PencilSquare className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          )}
        </div>
      </div>

      {sale.status === "pending" && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-sm text-orange-700">
          This flash sale is pending admin approval. You'll be notified once it's reviewed.
        </div>
      )}
      {sale.status === "cancelled" && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          This flash sale was rejected by an admin.
        </div>
      )}

      <Container className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Starts</p>
          <p className="font-medium">{new Date(sale.starts_at).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Ends</p>
          <p className="font-medium">{new Date(sale.ends_at).toLocaleString()}</p>
          {sale.status === "active" && <p className="text-xs text-green-600 font-medium">{getTimeRemaining(sale.ends_at)} remaining</p>}
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Products</p>
          <p className="font-medium">{sale.items?.length ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Per-customer limit</p>
          <p className="font-medium">{sale.max_order_quantity ?? "No limit"}</p>
        </div>
      </Container>

      <Container className="p-5">
        <div className="flex items-center justify-between mb-4">
          <Heading level="h2">Products ({sale.items?.length ?? 0})</Heading>
          {editable && (
            <Button size="small" variant="secondary" onClick={() => setShowAddItem((v) => !v)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Product
            </Button>
          )}
        </div>
        {showAddItem && editable && <div className="mb-4"><AddItemForm flashSaleId={sale.id} onAdded={() => { setShowAddItem(false); refetch() }} /></div>}
        {!sale.items?.length ? (
          <div className="text-center py-8 text-sm text-gray-400">No products added yet.</div>
        ) : (
          <div className="space-y-3">
            {sale.items.map((item) => <ItemRow key={item.id} item={item} flashSaleId={sale.id} editable={editable} />)}
          </div>
        )}
      </Container>
    </div>
  )
}
