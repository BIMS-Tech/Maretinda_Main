import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button, Drawer, Heading, Input, Label, Textarea, toast } from "@medusajs/ui"
import { useCreateFlashSale } from "../../../hooks/api/flash-sales"

export const FlashSaleCreate = () => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)
  const [form, setForm] = useState({
    title: "",
    description: "",
    starts_at: "",
    ends_at: "",
    max_order_quantity: "",
  })

  const { mutate: create, isPending } = useCreateFlashSale({
    onSuccess: (data) => {
      toast.success("Flash sale created as draft — add products then submit for approval")
      navigate(`../${data.flash_sale.id}`)
    },
    onError: (err: any) => toast.error(err?.message || "Failed to create flash sale"),
  })

  const handleClose = () => { setOpen(false); navigate("..") }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error("Title is required"); return }
    if (!form.starts_at) { toast.error("Start date is required"); return }
    if (!form.ends_at) { toast.error("End date is required"); return }
    if (new Date(form.ends_at) <= new Date(form.starts_at)) {
      toast.error("End date must be after start date")
      return
    }
    create({
      title: form.title,
      description: form.description || undefined,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: new Date(form.ends_at).toISOString(),
      max_order_quantity: form.max_order_quantity ? parseInt(form.max_order_quantity) : undefined,
    })
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Content>
        <Drawer.Header>
          <Heading level="h2">Create Flash Sale</Heading>
          <p className="text-sm text-gray-500 mt-1">
            Your flash sale will be submitted for admin review before going live.
          </p>
        </Drawer.Header>
        <Drawer.Body className="p-6">
          <form id="vendor-flash-sale-create-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
              <Input
                id="title"
                placeholder="Summer Flash Sale"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                placeholder="Huge discounts for a limited time!"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="starts_at" className="text-sm font-medium">Start *</Label>
                <Input
                  id="starts_at"
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ends_at" className="text-sm font-medium">End *</Label>
                <Input
                  id="ends_at"
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="max_qty" className="text-sm font-medium">Max quantity per customer</Label>
              <Input
                id="max_qty"
                type="number"
                min="1"
                placeholder="e.g. 2 (leave blank for no limit)"
                value={form.max_order_quantity}
                onChange={(e) => setForm((f) => ({ ...f, max_order_quantity: e.target.value }))}
              />
              <p className="text-xs text-gray-400">
                Limits how many sale items a single customer can purchase at the discounted price.
              </p>
            </div>
          </form>
        </Drawer.Body>
        <Drawer.Footer>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="submit" form="vendor-flash-sale-create-form" isLoading={isPending}>
            Create Draft
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}
