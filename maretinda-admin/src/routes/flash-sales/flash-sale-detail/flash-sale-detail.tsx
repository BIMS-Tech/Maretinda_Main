import { useState } from "react"
import { useParams, useNavigate, Outlet } from "react-router-dom"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  toast,
  usePrompt,
  Badge,
} from "@medusajs/ui"
import { Bolt, PencilSquare, Trash, Plus, XCircle, Check } from "@medusajs/icons"
import {
  useFlashSale,
  usePublishFlashSale,
  useEndFlashSale,
  useReviveFlashSale,
  useApproveFlashSale,
  useRejectFlashSale,
  useAddFlashSaleItem,
  useRemoveFlashSaleItem,
  useUpdateFlashSaleItem,
  useApproveFlashSaleItem,
  useRejectFlashSaleItem,
} from "../../../hooks/api/flash-sales"
import { FlashSaleItem, getFlashSaleStatus, getTimeRemaining } from "../../../lib/flash-sales"

const STATUS_COLOR: Record<string, string> = {
  green: "bg-green-100 text-green-700",
  orange: "bg-orange-100 text-orange-700",
  blue: "bg-blue-100 text-blue-700",
  grey: "bg-gray-100 text-gray-600",
  red: "bg-red-100 text-red-700",
}

function AddItemForm({
  flashSaleId,
  onAdded,
}: {
  flashSaleId: string
  onAdded: () => void
}) {
  const [form, setForm] = useState({
    product_id: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: "",
    stock_limit: "",
  })

  const { mutate: addItem, isPending } = useAddFlashSaleItem(flashSaleId, {
    onSuccess: () => {
      toast.success("Product added")
      setForm({ product_id: "", discount_type: "percentage", discount_value: "", stock_limit: "" })
      onAdded()
    },
    onError: (err: any) => toast.error(err?.message || "Failed to add product"),
  })

  return (
    <div className="border border-dashed border-gray-200 rounded-lg p-4 space-y-3">
      <p className="text-sm font-medium text-gray-700">Add Product</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Product ID</Label>
          <Input
            placeholder="prod_..."
            value={form.product_id}
            onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))}
            size="small"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Discount Type</Label>
          <select
            className="w-full border rounded px-2 py-1.5 text-sm"
            value={form.discount_type}
            onChange={(e) =>
              setForm((f) => ({ ...f, discount_type: e.target.value as any }))
            }
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed (₱)</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">
            Discount Value {form.discount_type === "percentage" ? "(%)" : "(₱)"}
          </Label>
          <Input
            type="number"
            min="0"
            max={form.discount_type === "percentage" ? "100" : undefined}
            placeholder={form.discount_type === "percentage" ? "30" : "500"}
            value={form.discount_value}
            onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
            size="small"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Stock Limit</Label>
          <Input
            type="number"
            min="1"
            placeholder="e.g. 50 (optional)"
            value={form.stock_limit}
            onChange={(e) => setForm((f) => ({ ...f, stock_limit: e.target.value }))}
            size="small"
          />
        </div>
      </div>
      <Button
        size="small"
        onClick={() =>
          addItem({
            product_id: form.product_id,
            discount_type: form.discount_type,
            discount_value: parseFloat(form.discount_value),
            stock_limit: form.stock_limit ? parseInt(form.stock_limit) : undefined,
          })
        }
        isLoading={isPending}
        disabled={!form.product_id || !form.discount_value}
      >
        <Plus className="w-3.5 h-3.5 mr-1" />
        Add Product
      </Button>
    </div>
  )
}

function ItemRow({
  item,
  flashSaleId,
  editable,
}: {
  item: FlashSaleItem
  flashSaleId: string
  editable: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    discount_type: item.discount_type,
    discount_value: String(item.discount_value),
    stock_limit: item.stock_limit ? String(item.stock_limit) : "",
  })
  const prompt = usePrompt()

  const { mutate: updateItem, isPending: updating } = useUpdateFlashSaleItem(flashSaleId, item.id, {
    onSuccess: () => { toast.success("Item updated"); setEditing(false) },
    onError: (err: any) => toast.error(err?.message || "Update failed"),
  })
  const { mutate: removeItem } = useRemoveFlashSaleItem(flashSaleId, {
    onSuccess: () => toast.success("Product removed"),
  })

  const handleDelete = async () => {
    const confirmed = await prompt({
      title: "Remove Product",
      description: "Remove this product from the flash sale?",
      confirmText: "Remove",
      cancelText: "Cancel",
    })
    if (confirmed) removeItem(item.id)
  }

  const soldPct = item.stock_limit
    ? Math.round((item.sold_count / item.stock_limit) * 100)
    : 0

  return (
    <div className="border border-gray-100 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-800 truncate">
            {item.product?.title || item.product_id}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {item.product_id}
            {item.variant_id && ` · variant: ${item.variant_id}`}
          </div>

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
              <Input
                type="number"
                value={form.discount_value}
                onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                size="small"
              />
              <Input
                type="number"
                placeholder="Stock limit"
                value={form.stock_limit}
                onChange={(e) => setForm((f) => ({ ...f, stock_limit: e.target.value }))}
                size="small"
              />
              <Button size="small" onClick={() => updateItem({ ...form, discount_value: parseFloat(form.discount_value), stock_limit: form.stock_limit ? parseInt(form.stock_limit) : null })} isLoading={updating}>
                Save
              </Button>
              <Button size="small" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-3">
              <span className="text-xs font-semibold text-red-600">
                -{item.discount_value}{item.discount_type === "percentage" ? "%" : "₱"}
              </span>
              {item.stock_limit && (
                <div className="flex-1 max-w-[120px]">
                  <div className="h-1.5 bg-yellow-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: `${soldPct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {item.sold_count}/{item.stock_limit} sold
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {editable && !editing && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              className="p-1 hover:bg-gray-100 rounded"
              onClick={() => setEditing(true)}
            >
              <PencilSquare className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <button
              className="p-1 hover:bg-red-50 rounded"
              onClick={handleDelete}
            >
              <Trash className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const ITEM_STATUS_STYLE: Record<string, string> = {
  pending: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
}

function SellerApplicationRow({ item, flashSaleId }: { item: FlashSaleItem & { seller_id?: string; item_status?: string }; flashSaleId: string }) {
  const prompt = usePrompt()
  const { mutate: approve, isPending: approving } = useApproveFlashSaleItem(flashSaleId, item.id, {
    onSuccess: () => toast.success("Application approved"),
    onError: (err: any) => toast.error(err?.message || "Failed"),
  })
  const { mutate: reject, isPending: rejecting } = useRejectFlashSaleItem(flashSaleId, item.id, {
    onSuccess: () => toast.success("Application rejected"),
    onError: (err: any) => toast.error(err?.message || "Failed"),
  })
  const { mutate: remove } = useRemoveFlashSaleItem(flashSaleId, {
    onSuccess: () => toast.success("Removed"),
  })

  const status = item.item_status || "pending"

  return (
    <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
      {item.product?.thumbnail && (
        <img src={item.product.thumbnail} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
          {item.product?.title || item.product_id}
        </div>
        <div className="text-xs text-gray-400 truncate">
          {item.product_id}
          {item.seller_id && <span className="ml-2 text-blue-500">seller: {item.seller_id.slice(-8)}</span>}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-semibold text-red-600">
            -{item.discount_value}{item.discount_type === "percentage" ? "%" : "₱"}
          </span>
          {item.stock_limit && (
            <span className="text-xs text-gray-400">{item.sold_count}/{item.stock_limit} sold</span>
          )}
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ITEM_STATUS_STYLE[status] || ITEM_STATUS_STYLE.pending}`}>
            {status}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {status === "pending" && (
          <>
            <Button size="small" onClick={() => approve()} isLoading={approving} className="h-7 text-xs px-2">
              <Check className="w-3 h-3 mr-1" />
              Approve
            </Button>
            <Button size="small" variant="secondary" onClick={() => reject()} isLoading={rejecting} className="h-7 text-xs px-2">
              Reject
            </Button>
          </>
        )}
        {status === "approved" && (
          <Button size="small" variant="secondary" onClick={() => reject()} isLoading={rejecting} className="h-7 text-xs px-2">
            Revoke
          </Button>
        )}
        <button
          className="p-1 hover:bg-red-50 rounded ml-1"
          onClick={async () => {
            const ok = await prompt({ title: "Remove", description: "Remove this product application?", confirmText: "Remove", cancelText: "Cancel" })
            if (ok) remove(item.id)
          }}
        >
          <Trash className="w-3.5 h-3.5 text-red-400" />
        </button>
      </div>
    </div>
  )
}

function ReviveModal({
  saleId,
  endsAt,
  onClose,
}: {
  saleId: string
  endsAt: string
  onClose: () => void
}) {
  const isPast = new Date(endsAt) <= new Date()
  const [newEndsAt, setNewEndsAt] = useState("")

  const { mutate: revive, isPending } = useReviveFlashSale(saleId, {
    onSuccess: () => { toast.success("Flash sale revived"); onClose() },
    onError: (err: any) => toast.error(err?.message || "Failed to revive"),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <Heading level="h2">Revive Flash Sale</Heading>
        {isPast ? (
          <>
            <p className="text-sm text-gray-500">
              This sale's end date has already passed. Set a new end date to revive it.
            </p>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">New End Date & Time *</Label>
              <Input
                type="datetime-local"
                value={newEndsAt}
                onChange={(e) => setNewEndsAt(e.target.value)}
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500">
            The end date is still in the future. The sale will be restored to its original schedule.
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" size="small" onClick={onClose}>Cancel</Button>
          <Button
            size="small"
            isLoading={isPending}
            disabled={isPast && !newEndsAt}
            onClick={() => revive(isPast && newEndsAt ? { ends_at: new Date(newEndsAt).toISOString() } : undefined)}
          >
            Revive
          </Button>
        </div>
      </div>
    </div>
  )
}

function BannerImage({ url }: { url: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <Container className="p-4">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Banner Image</p>
      {failed ? (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-50 rounded-lg p-3">
          <span>Image failed to load.</span>
          <span className="truncate text-gray-400">{url}</span>
        </div>
      ) : (
        <img
          src={url}
          alt="Banner"
          className="w-full max-h-48 object-cover rounded-lg"
          onError={() => setFailed(true)}
        />
      )}
    </Container>
  )
}

export const FlashSaleDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const prompt = usePrompt()
  const [showAddItem, setShowAddItem] = useState(false)
  const [showRevive, setShowRevive] = useState(false)

  const { flash_sale: sale, isLoading, refetch } = useFlashSale(id!)

  const { mutate: publish, isPending: publishing } = usePublishFlashSale(id!, {
    onSuccess: () => toast.success("Flash sale published"),
    onError: (err: any) => toast.error(err?.message || "Failed to publish"),
  })
  const { mutate: end, isPending: ending } = useEndFlashSale(id!, {
    onSuccess: () => toast.success("Flash sale ended"),
    onError: (err: any) => toast.error(err?.message || "Failed to end"),
  })
  const { mutate: approve } = useApproveFlashSale(id!, {
    onSuccess: () => toast.success("Approved and published"),
  })
  const { mutate: reject } = useRejectFlashSale(id!, {
    onSuccess: () => toast.success("Flash sale rejected"),
  })

  if (isLoading || !sale) {
    return <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
  }

  const [statusColor, statusLabel] = getFlashSaleStatus(sale)
  const editable = ["draft", "scheduled", "active"].includes(sale.status)
  const canPublish = ["draft", "scheduled"].includes(sale.status)
  const canEnd = ["active", "scheduled"].includes(sale.status)

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Outlet />
      {showRevive && (
        <ReviveModal saleId={id!} endsAt={sale.ends_at} onClose={() => setShowRevive(false)} />
      )}
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            className="text-xs text-gray-400 hover:text-gray-600 mb-1"
            onClick={() => navigate("..")}
          >
            ← Flash Sales
          </button>
          <Heading level="h1">{sale.title}</Heading>
          {sale.description && (
            <p className="text-sm text-gray-500 mt-1">{sale.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[statusColor] || STATUS_COLOR.grey}`}
          >
            {sale.status === "active" && (
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
                <span className="relative w-1.5 h-1.5 rounded-full bg-green-500" />
              </span>
            )}
            {statusLabel}
          </span>

          {canPublish && (
            <Button size="small" onClick={() => publish()} isLoading={publishing}>
              <Bolt className="w-3.5 h-3.5 mr-1" />
              Publish
            </Button>
          )}
          {canEnd && (
            <Button size="small" variant="secondary" onClick={async () => {
              const ok = await prompt({ title: "End Flash Sale", description: "End this flash sale early?", confirmText: "End", cancelText: "Cancel" })
              if (ok) end()
            }} isLoading={ending}>
              End Sale
            </Button>
          )}
          {["ended", "cancelled"].includes(sale.status) && (
            <Button size="small" variant="secondary" onClick={() => setShowRevive(true)}>
              <Bolt className="w-3.5 h-3.5 mr-1" />
              Revive
            </Button>
          )}
          {sale.status === "pending" && (
            <>
              <Button size="small" onClick={() => approve()}>Approve</Button>
              <Button size="small" variant="secondary" onClick={() => reject()}>
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Reject
              </Button>
            </>
          )}
          <Button size="small" variant="secondary" asChild>
            <span onClick={() => navigate("edit")} className="cursor-pointer">
              <PencilSquare className="w-3.5 h-3.5 mr-1" />
              Edit
            </span>
          </Button>
        </div>
      </div>

      {/* Info grid */}
      <Container className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Products</p>
          <p className="font-medium">{sale.items?.length ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Per-customer limit</p>
          <p className="font-medium">{sale.max_order_quantity ?? "No limit"}</p>
        </div>
      </Container>

      {/* Banner */}
      {sale.banner_image && (
        <BannerImage url={sale.banner_image} />
      )}

      {/* seller Product Applications */}
      <Container className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Heading level="h2">Product Applications</Heading>
            <p className="text-xs text-gray-400 mt-0.5">seller-submitted products — approve to include in this flash sale</p>
          </div>
          {editable && (
            <Button size="small" variant="secondary" onClick={() => setShowAddItem((v) => !v)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add (Admin)
            </Button>
          )}
        </div>

        {showAddItem && editable && (
          <div className="mb-4">
            <AddItemForm flashSaleId={sale.id} onAdded={() => { setShowAddItem(false); refetch() }} />
          </div>
        )}

        {!sale.items?.length ? (
          <div className="text-center py-8 text-sm text-gray-400">
            No product applications yet.
          </div>
        ) : (
          <div className="space-y-2">
            {sale.items.map((item: any) => (
              item.seller_id ? (
                <SellerApplicationRow key={item.id} item={item} flashSaleId={sale.id} />
              ) : (
                <ItemRow key={item.id} item={item} flashSaleId={sale.id} editable={editable} />
              )
            ))}
          </div>
        )}
      </Container>
    </div>
  )
}
