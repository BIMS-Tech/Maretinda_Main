import {
  Badge,
  Button,
  Container,
  Heading,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import {
  useAdminBrands,
  useUpdateBrand,
  useDeleteBrand,
  AdminBrand,
} from "../../../hooks/api/admin-brands"

export const RequestBrandList = () => {
  const { brands, isLoading } = useAdminBrands()
  const { mutateAsync: update } = useUpdateBrand()
  const { mutateAsync: remove } = useDeleteBrand()
  const prompt = usePrompt()

  // Seller "applications": brands requested by a seller and not yet active.
  const pending = brands.filter((b) => b.requested_by && !b.is_active)
  const approved = brands.filter((b) => b.requested_by && b.is_active)

  const approve = async (b: AdminBrand) => {
    try {
      await update({ id: b.id, is_active: true })
      toast.success(`${b.name} approved`)
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to approve")
    }
  }

  const reject = async (b: AdminBrand) => {
    const ok = await prompt({
      title: `Reject ${b.name}?`,
      description: "This removes the requested brand. The seller can request again.",
    })
    if (!ok) return
    try {
      await remove(b.id)
      toast.success(`${b.name} rejected`)
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to reject")
    }
  }

  const Row = ({ b, isPending }: { b: AdminBrand; isPending: boolean }) => (
    <div className="flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-3">
        {b.logo_url ? (
          <img src={b.logo_url} alt={b.name} className="h-8 w-8 rounded object-contain border border-ui-border-base" />
        ) : (
          <div className="h-8 w-8 rounded bg-ui-bg-base border border-ui-border-base flex items-center justify-center text-xs text-ui-fg-muted">
            {b.name.charAt(0).toUpperCase()}
          </div>
        )}
        <Text size="small" weight="plus">{b.name}</Text>
        <Badge color={isPending ? "orange" : "green"} size="2xsmall">
          {isPending ? "Pending" : "Approved"}
        </Badge>
      </div>
      {isPending && (
        <div className="flex items-center gap-2">
          <Button size="small" variant="primary" onClick={() => approve(b)}>Approve</Button>
          <Button size="small" variant="secondary" className="text-ui-fg-error" onClick={() => reject(b)}>Reject</Button>
        </div>
      )}
    </div>
  )

  return (
    <Container className="divide-y p-0 w-full max-w-4xl">
      <div className="px-6 py-4">
        <Heading>Brand requests</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Brands sellers applied for. Approve to add them to the catalog and make them assignable.
        </Text>
      </div>

      {isLoading ? (
        <div className="px-6 py-6"><Text className="text-ui-fg-muted">Loading…</Text></div>
      ) : pending.length === 0 && approved.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <Text className="text-ui-fg-muted">No seller brand applications yet.</Text>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="divide-y">
              <div className="px-6 pt-4 pb-1">
                <Text size="xsmall" weight="plus" className="text-ui-fg-muted uppercase">Pending ({pending.length})</Text>
              </div>
              {pending.map((b) => <Row key={b.id} b={b} isPending />)}
            </div>
          )}
          {approved.length > 0 && (
            <div className="divide-y">
              <div className="px-6 pt-4 pb-1">
                <Text size="xsmall" weight="plus" className="text-ui-fg-muted uppercase">Approved ({approved.length})</Text>
              </div>
              {approved.map((b) => <Row key={b.id} b={b} isPending={false} />)}
            </div>
          )}
        </>
      )}
    </Container>
  )
}
