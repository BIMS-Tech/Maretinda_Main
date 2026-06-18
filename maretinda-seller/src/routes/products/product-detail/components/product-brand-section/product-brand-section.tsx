import { useEffect, useState } from "react"
import { Container, Heading, Text, Button, Select, Badge, Input, toast } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import {
  useBrands,
  useProductBrand,
  useAssignProductBrand,
  useRequestBrand,
} from "../../../../../hooks/api/brands"

type ProductBrandSectionProps = {
  product: HttpTypes.AdminProduct
}

export const ProductBrandSection = ({ product }: ProductBrandSectionProps) => {
  const { data: brandsData, isLoading: brandsLoading } = useBrands()
  const { data: currentData } = useProductBrand(product.id)
  const { mutateAsync, isPending } = useAssignProductBrand(product.id)
  const { mutateAsync: requestBrand, isPending: requesting } = useRequestBrand()

  const brands = brandsData?.brands ?? []
  const currentBrand = currentData?.brand ?? null
  const [selected, setSelected] = useState<string>("")
  const [showRequest, setShowRequest] = useState(false)
  const [requestName, setRequestName] = useState("")

  const submitRequest = async () => {
    if (!requestName.trim()) return toast.error("Enter a brand name")
    try {
      const r: any = await requestBrand({ name: requestName.trim() })
      toast.success(r?.message ?? "Brand requested")
      setRequestName("")
      setShowRequest(false)
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to request brand")
    }
  }

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

        {/* Request a new brand (pending admin approval) */}
        <div className="border-t border-ui-border-base pt-3 mt-1">
          {!showRequest ? (
            <button
              type="button"
              className="text-xs text-ui-fg-interactive hover:underline"
              onClick={() => setShowRequest(true)}
            >
              Can&apos;t find your brand? Request it
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <Text size="xsmall" className="text-ui-fg-subtle">
                Request a new brand — it becomes available once an admin approves it.
              </Text>
              <div className="flex gap-2">
                <Input
                  placeholder="Brand name"
                  value={requestName}
                  onChange={(e) => setRequestName(e.target.value)}
                />
                <Button size="small" variant="primary" isLoading={requesting} onClick={submitRequest}>
                  Request
                </Button>
                <Button size="small" variant="secondary" onClick={() => { setShowRequest(false); setRequestName("") }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  )
}
