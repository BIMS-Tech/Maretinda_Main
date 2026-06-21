import { PencilSquare, Trash } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Text, toast, usePrompt } from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { Link } from "react-router-dom"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { _DataTable } from "../../../../../components/table/data-table"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { useQueryParams } from "../../../../../hooks/use-query-params"
import {
  AdminBrand,
  useAdminBrands,
  useDeleteBrand,
} from "../../../../../hooks/api/admin-brands"

const PAGE_SIZE = 20

export const BrandListTable = () => {
  const queryObject = useQueryParams(["offset", "q"])
  const { offset, q } = queryObject

  const { brands, count, isLoading, isError } = useAdminBrands({
    q,
    limit: PAGE_SIZE,
    offset: offset ? Number(offset) : 0,
  })

  const columns = useColumns()

  const { table } = useDataTable({
    data: brands,
    columns,
    count,
    getRowId: (row) => row.id,
    enablePagination: true,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw new Error("Failed to load brands")
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Brands</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            The platform brand catalog. Sellers assign these to products; customers filter by them.
          </Text>
        </div>
        <Button size="small" variant="secondary" asChild>
          <Link to="create">Create</Link>
        </Button>
      </div>
      <_DataTable
        table={table}
        columns={columns}
        pageSize={PAGE_SIZE}
        count={count}
        isLoading={isLoading}
        navigateTo={(row) => row.original.id}
        queryObject={queryObject}
        search
        pagination
      />
    </Container>
  )
}

const BrandStatus = ({ brand }: { brand: AdminBrand }) => {
  if (brand.is_active) {
    return <Badge color="green" size="2xsmall">Active</Badge>
  }
  if (brand.requested_by) {
    return <Badge color="orange" size="2xsmall">Pending</Badge>
  }
  return <Badge color="grey" size="2xsmall">Inactive</Badge>
}

const BrandRowActions = ({ brand }: { brand: AdminBrand }) => {
  const prompt = usePrompt()
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
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete")
    }
  }

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: "Edit",
              to: `${brand.id}/edit`,
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
  )
}

const columnHelper = createColumnHelper<AdminBrand>()

const useColumns = () =>
  useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Brand",
        cell: ({ row }) => {
          const b = row.original
          return (
            <div className="flex items-center gap-x-3">
              {b.logo_url ? (
                <img
                  src={b.logo_url}
                  alt={b.name}
                  className="h-8 w-8 rounded object-contain border border-ui-border-base bg-ui-bg-base"
                />
              ) : (
                <div className="h-8 w-8 rounded bg-ui-bg-base border border-ui-border-base flex items-center justify-center text-xs text-ui-fg-muted">
                  {b.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-ui-fg-base">{b.name}</span>
            </div>
          )
        },
      }),
      columnHelper.accessor("is_active", {
        header: "Status",
        cell: ({ row }) => <BrandStatus brand={row.original} />,
      }),
      columnHelper.accessor("product_count", {
        header: "Products",
        cell: ({ getValue }) => (
          <span className="text-ui-fg-subtle">{getValue() ?? 0}</span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => <BrandRowActions brand={row.original} />,
      }),
    ],
    []
  )
