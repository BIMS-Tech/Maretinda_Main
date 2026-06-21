import { Plus, Trash } from "@medusajs/icons"
import { Badge, Checkbox, Container, Heading, toast, usePrompt } from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { _DataTable } from "../../../../../components/table/data-table"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { useQueryParams } from "../../../../../hooks/use-query-params"
import {
  AdminBrand,
  BrandProduct,
  useBrandProducts,
  useUpdateBrandProducts,
} from "../../../../../hooks/api/admin-brands"

type BrandProductSectionProps = {
  brand: AdminBrand
}

const PAGE_SIZE = 10

export const BrandProductSection = ({ brand }: BrandProductSectionProps) => {
  const queryObject = useQueryParams(["offset", "q"])
  const { offset, q } = queryObject

  const { products, count, isLoading, isError, error } = useBrandProducts(brand.id, {
    q,
    limit: PAGE_SIZE,
    offset: offset ? Number(offset) : 0,
  })

  const columns = useColumns()

  const { table } = useDataTable({
    data: products,
    columns,
    getRowId: (row) => row.id,
    count,
    enablePagination: true,
    enableRowSelection: true,
    pageSize: PAGE_SIZE,
    meta: { brandId: brand.id },
  })

  const prompt = usePrompt()
  const { mutateAsync } = useUpdateBrandProducts(brand.id)

  const handleRemove = async (selection: Record<string, boolean>) => {
    const ids = Object.keys(selection)
    if (!ids.length) return
    const ok = await prompt({
      title: "Remove products?",
      description: `Remove ${ids.length} product(s) from this brand.`,
      confirmText: "Remove",
      cancelText: "Cancel",
    })
    if (!ok) return
    try {
      await mutateAsync({ remove: ids })
      toast.success("Products removed from brand")
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to remove")
    }
  }

  if (isError) {
    throw error
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Products</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <Plus />,
                  label: "Add",
                  to: "products",
                },
              ],
            },
          ]}
        />
      </div>
      <_DataTable
        table={table}
        columns={columns}
        search
        pagination
        pageSize={PAGE_SIZE}
        navigateTo={({ original }) => `/products/${original.id}`}
        count={count}
        isLoading={isLoading}
        queryObject={queryObject}
        commands={[
          {
            action: handleRemove,
            label: "Remove",
            shortcut: "r",
          },
        ]}
        noRecords={{
          message: "No products assigned to this brand yet.",
        }}
      />
    </Container>
  )
}

const ProductActions = ({
  product,
  brandId,
}: {
  product: BrandProduct
  brandId: string
}) => {
  const prompt = usePrompt()
  const { mutateAsync } = useUpdateBrandProducts(brandId)

  const handleRemove = async () => {
    const ok = await prompt({
      title: "Remove product?",
      description: `Remove "${product.title}" from this brand.`,
      confirmText: "Remove",
      cancelText: "Cancel",
    })
    if (!ok) return
    try {
      await mutateAsync({ remove: [product.id] })
      toast.success("Product removed from brand")
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to remove")
    }
  }

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <Trash />,
              label: "Remove",
              onClick: handleRemove,
            },
          ],
        },
      ]}
    />
  )
}

const columnHelper = createColumnHelper<BrandProduct>()

const useColumns = () =>
  useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : table.getIsAllPageRowsSelected()
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            onClick={(e) => e.stopPropagation()}
          />
        ),
      }),
      columnHelper.accessor("title", {
        header: "Product",
        cell: ({ row }) => {
          const p = row.original
          return (
            <div className="flex items-center gap-x-3">
              {p.thumbnail ? (
                <img
                  src={p.thumbnail}
                  alt={p.title}
                  className="h-8 w-8 rounded object-cover border border-ui-border-base bg-ui-bg-base"
                />
              ) : (
                <div className="h-8 w-8 rounded bg-ui-bg-base border border-ui-border-base" />
              )}
              <span className="text-ui-fg-base">{p.title}</span>
            </div>
          )
        },
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue()
          const color = status === "published" ? "green" : "grey"
          return (
            <Badge color={color as any} size="2xsmall">
              {status ?? "—"}
            </Badge>
          )
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row, table }) => {
          const { brandId } = table.options.meta as { brandId: string }
          return <ProductActions product={row.original} brandId={brandId} />
        },
      }),
    ],
    []
  )
