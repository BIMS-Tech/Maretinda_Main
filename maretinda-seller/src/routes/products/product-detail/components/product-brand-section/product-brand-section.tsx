import { useEffect, useState } from "react"
import { Container, Heading, Text, Button, Select, Badge, toast } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import {
  useBrands,
  useProductBrand,
  useAssignProductBrand,
} from "../../../../../hooks/api/brands"

type ProductBrandSectionProps = {
  product: HttpTypes.AdminProduct
}

export const ProductBrandSection = ({ product }: ProductBrandSectionProps) => {
  const { data: brandsData, isLoading: brandsLoading } = useBrands()
  const { data: currentData } = useProductBrand(product.id)
  const { mutateAsync, isPending } = useAssignProductBrand(product.id)

  const brands = brandsData?.brands ?? []
  const currentBrand = currentData?.brand ?? null
  const [selected, setSelected] = useState<string>("")

  useEffect(() => {
    setSelected(currentBrand?.id ?? "")
  }, [currentBrand?.id])

  const dirty = (selected || null) !== (currentBrand?.id ?? null)

  const handleSave = async () => {
    try {
      await mutateAsync(selected || null)
      toast.success(selected ? "Brand assigned" : "Brand removed")
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update brand")
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Brand</Heading>
        {currentBrand && (
          <Badge color="grey" size="2xsmall">
            {currentBrand.name}
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-y-3 px-6 py-4">
        <Text size="small" className="text-ui-fg-subtle">
          Assign a brand so customers can filter your product by brand.
        </Text>

        {brandsLoading ? (
          <div className="h-9 w-full animate-pulse rounded bg-ui-bg-subtle" />
        ) : brands.length === 0 ? (
          <Text size="small" className="text-ui-fg-muted">
            No brands available yet. Ask the marketplace admin to add brands.
          </Text>
        ) : (
          <>
            <Select value={selected} onValueChange={setSelected}>
              <Select.Trigger>
                <Select.Value placeholder="Select a brand" />
              </Select.Trigger>
              <Select.Content>
                {brands.map((b) => (
                  <Select.Item key={b.id} value={b.id}>
                    {b.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>

            <div className="flex gap-2">
              <Button
                size="small"
                variant="primary"
                disabled={!dirty}
                isLoading={isPending}
                onClick={handleSave}
              >
                Save
              </Button>
              {currentBrand && (
                <Button
                  size="small"
                  variant="secondary"
                  disabled={isPending}
                  onClick={() => {
                    setSelected("")
                    mutateAsync(null)
                      .then(() => toast.success("Brand removed"))
                      .catch((e: any) => toast.error(e?.message ?? "Failed"))
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </Container>
  )
}
