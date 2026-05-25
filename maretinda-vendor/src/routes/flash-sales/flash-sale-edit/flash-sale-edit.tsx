import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button, Drawer, Heading, Input, Label, Textarea, toast } from "@medusajs/ui"
import { useFlashSale, useUpdateFlashSale } from "../../../hooks/api/flash-sales"

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const FlashSaleEdit = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)
  const { flash_sale: sale, isLoading } = useFlashSale(id!)
  const [form, setForm] = useState({ title: "", description: "", starts_at: "", ends_at: "", banner_image: "", max_order_quantity: "" })

  useEffect(() => {
    if (sale) {
      setForm({
        title: sale.title,
        description: sale.description || "",
        starts_at: toDatetimeLocal(sale.starts_at),
        ends_at: toDatetimeLocal(sale.ends_at),
        banner_image: sale.banner_image || "",
        max_order_quantity: sale.max_order_quantity ? String(sale.max_order_quantity) : "",
      })
    }
  }, [sale])

  const { mutate: update, isPending } = useUpdateFlashSale(id!, {
    onSuccess: () => { toast.success("Updated"); navigate("..") },
    onError: (err: any) => toast.error(err?.message || "Update failed"),
  })

  const handleClose = () => { setOpen(false); navigate("..") }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (new Date(form.ends_at) <= new Date(form.starts_at)) { toast.error("End must be after start"); return }
    update({ title: form.title, description: form.description || undefined, starts_at: new Date(form.starts_at).toISOString(), ends_at: new Date(form.ends_at).toISOString(), banner_image: form.banner_image || undefined, max_order_quantity: form.max_order_quantity ? parseInt(form.max_order_quantity) : undefined })
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Content>
        <Drawer.Header><Heading level="h2">Edit Flash Sale</Heading></Drawer.Header>
        <Drawer.Body className="p-6">
          {isLoading ? <div className="text-sm text-gray-400">Loading...</div> : (
            <form id="vendor-flash-sale-edit-form" onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
                <Input id="title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea id="description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="starts_at" className="text-sm font-medium">Start *</Label>
                  <Input id="starts_at" type="datetime-local" value={form.starts_at} onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ends_at" className="text-sm font-medium">End *</Label>
                  <Input id="ends_at" type="datetime-local" value={form.ends_at} onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="banner_image" className="text-sm font-medium">Banner Image URL</Label>
                <Input id="banner_image" value={form.banner_image} onChange={(e) => setForm((f) => ({ ...f, banner_image: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max_qty" className="text-sm font-medium">Max quantity per customer</Label>
                <Input id="max_qty" type="number" min="1" placeholder="No limit" value={form.max_order_quantity} onChange={(e) => setForm((f) => ({ ...f, max_order_quantity: e.target.value }))} />
              </div>
            </form>
          )}
        </Drawer.Body>
        <Drawer.Footer>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="submit" form="vendor-flash-sale-edit-form" isLoading={isPending}>Save Changes</Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}
