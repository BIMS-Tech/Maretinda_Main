import { useState } from "react"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Switch,
  Text,
  Textarea,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { Plus, Trash, PencilSquare, ArrowPath } from "@medusajs/icons"
import {
  AdminBrand,
  useAdminBrands,
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand,
  useReindexBrands,
} from "../../hooks/api/admin-brands"

function BrandForm({
  initial,
  onDone,
  onCancel,
}: {
  initial?: AdminBrand
  onDone: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? "")
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)

  const { mutateAsync: create, isPending: creating } = useCreateBrand()
  const { mutateAsync: update, isPending: updating } = useUpdateBrand()

  const save = async () => {
    if (!name.trim()) return toast.error("Brand name is required")
    try {
      if (initial) {
        await update({ id: initial.id, name, logo_url: logoUrl, description, is_active: isActive })
        toast.success("Brand updated")
      } else {
        await create({ name, logo_url: logoUrl, description, is_active: isActive })
        toast.success("Brand created")
      }
      onDone()
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save brand")
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-ui-border-base p-4 bg-ui-bg-subtle">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label size="small">Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nike" />
        </div>
        <div className="flex flex-col gap-1">
          <Label size="small">Logo URL</Label>
          <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Label size="small">Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={isActive} onCheckedChange={setIsActive} id="brand-active" />
        <Label htmlFor="brand-active" size="small">Active (sellers can assign it)</Label>
      </div>
      <div className="flex gap-2">
        <Button size="small" variant="primary" isLoading={creating || updating} onClick={save}>
          {initial ? "Save changes" : "Create brand"}
        </Button>
        <Button size="small" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

export default function BrandsPage() {
  const [search, setSearch] = useState("")
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { brands, count, isLoading } = useAdminBrands(search)
  const { mutateAsync: remove } = useDeleteBrand()
  const { mutateAsync: reindex, isPending: reindexing } = useReindexBrands()
  const prompt = usePrompt()

  const handleDelete = async (b: AdminBrand) => {
    const ok = await prompt({
      title: `Delete ${b.name}?`,
      description: "Products keep working but lose this brand. This cannot be undone.",
    })
    if (!ok) return
    try {
      await remove(b.id)
      toast.success("Brand deleted")
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete")
    }
  }

  const handleReindex = async () => {
    try {
      const r = await reindex()
      toast.success(`Re-applied brand to ${r.reindexed} products in search`)
    } catch (e: any) {
      toast.error(e?.message ?? "Reindex failed")
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Brands</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            The platform brand catalog. Sellers assign these to products; customers filter by them.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button size="small" variant="secondary" onClick={handleReindex} isLoading={reindexing}>
            <ArrowPath /> Sync search
          </Button>
          <Button size="small" variant="primary" onClick={() => { setCreating(true); setEditingId(null) }}>
            <Plus /> New brand
          </Button>
        </div>
      </div>

      <div className="px-6 py-4 flex flex-col gap-3">
        <Input
          placeholder="Search brands…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />

        {creating && (
          <BrandForm onDone={() => setCreating(false)} onCancel={() => setCreating(false)} />
        )}

        {isLoading ? (
          <Text className="text-ui-fg-muted">Loading…</Text>
        ) : brands.length === 0 ? (
          <Text className="text-ui-fg-muted py-6 text-center">No brands yet. Create your first brand.</Text>
        ) : (
          <div className="flex flex-col divide-y rounded-lg border border-ui-border-base">
            {brands.map((b) => (
              <div key={b.id} className="flex flex-col">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    {b.logo_url ? (
                      <img src={b.logo_url} alt={b.name} className="h-8 w-8 rounded object-contain border border-ui-border-base" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-ui-bg-base border border-ui-border-base flex items-center justify-center text-xs text-ui-fg-muted">
                        {b.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <Text size="small" weight="plus">{b.name}</Text>
                      {!b.is_active && <Text size="xsmall" className="text-ui-fg-muted">Inactive</Text>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="small" variant="transparent" onClick={() => { setEditingId(editingId === b.id ? null : b.id); setCreating(false) }}>
                      <PencilSquare />
                    </Button>
                    <Button size="small" variant="transparent" className="text-ui-fg-error" onClick={() => handleDelete(b)}>
                      <Trash />
                    </Button>
                  </div>
                </div>
                {editingId === b.id && (
                  <div className="px-4 pb-4">
                    <BrandForm initial={b} onDone={() => setEditingId(null)} onCancel={() => setEditingId(null)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <Text size="xsmall" className="text-ui-fg-muted">{count} brand{count !== 1 ? "s" : ""}</Text>
      </div>
    </Container>
  )
}
