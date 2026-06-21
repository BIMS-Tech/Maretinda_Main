import { PencilSquare, Trash } from "@medusajs/icons"
import { Badge, Container, Heading, Text, toast, usePrompt } from "@medusajs/ui"
import { useNavigate } from "react-router-dom"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { AdminBrand, useDeleteBrand } from "../../../../../hooks/api/admin-brands"

type BrandGeneralSectionProps = {
  brand: AdminBrand
}

export const BrandGeneralSection = ({ brand }: BrandGeneralSectionProps) => {
  const prompt = usePrompt()
  const navigate = useNavigate()
  const { mutateAsync } = useDeleteBrand()

  const handleDelete = async () => {
    const ok = await prompt({
      title: `Delete ${brand.name}?`,
      description: "Products keep working but lose this brand. This cannot be undone.",
    })
    if (!ok) return
    try {
      await mutateAsync(brand.id)
      toast.success("Brand deleted")
      navigate("/brands", { replace: true })
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete")
    }
  }

  const status = brand.is_active
    ? { color: "green" as const, label: "Active" }
    : brand.requested_by
    ? { color: "orange" as const, label: "Pending" }
    : { color: "grey" as const, label: "Inactive" }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-x-4">
          {brand.logo_url ? (
            <img
              alt={brand.name}
              className="h-12 w-12 rounded-lg object-contain border border-ui-border-base flex-shrink-0"
              src={brand.logo_url}
            />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-ui-bg-base border border-ui-border-base flex items-center justify-center text-ui-fg-muted flex-shrink-0">
              {brand.name.charAt(0).toUpperCase()}
            </div>
          )}
          <Heading>{brand.name}</Heading>
        </div>
        <div className="flex items-center gap-x-3">
          <Badge color={status.color} size="2xsmall">{status.label}</Badge>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    icon: <PencilSquare />,
                    label: "Edit",
                    to: `/brands/${brand.id}/edit`,
                  },
                ],
              },
              {
                actions: [
                  {
                    icon: <Trash />,
                    label: "Delete",
                    onClick: handleDelete,
                  },
                ],
              },
            ]}
          />
        </div>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">Handle</Text>
        <Text size="small">/{brand.slug}</Text>
      </div>
      {brand.description && (
        <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
          <Text size="small" leading="compact" weight="plus">Description</Text>
          <Text size="small">{brand.description}</Text>
        </div>
      )}
    </Container>
  )
}
