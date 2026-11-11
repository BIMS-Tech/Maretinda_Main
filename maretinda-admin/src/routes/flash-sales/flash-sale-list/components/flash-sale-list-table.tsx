import { Bolt, PencilSquare, Trash, EllipsisHorizontal } from "@medusajs/icons"
import { Button, Container, Heading, usePrompt, toast } from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import {
  useFlashSales,
  useDeleteFlashSale,
  usePublishFlashSale,
  useEndFlashSale,
  useReviveFlashSale,
} from "../../../../hooks/api/flash-sales"
import { FlashSale, getFlashSaleStatus, getTimeRemaining } from "../../../../lib/flash-sales"

const columnHelper = createColumnHelper<FlashSale & { item_count?: number }>()

const STATUS_COLOR: Record<string, string> = {
  green: "bg-ui-tag-green-bg text-ui-tag-green-text",
  orange: "bg-ui-tag-orange-bg text-ui-tag-orange-text",
  blue: "bg-ui-tag-purple-bg text-ui-fg-interactive",
  grey: "bg-ui-bg-subtle text-ui-fg-subtle",
  red: "bg-ui-tag-red-bg text-ui-tag-red-text",
}

function StatusBadge({ sale }: { sale: FlashSale }) {
  const [color, label] = getFlashSaleStatus(sale)
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[color] || STATUS_COLOR.grey}`}>
      {sale.status === "active" && (
        <span className="relative flex w-1.5 h-1.5">
          <span className="absolute inset-0 rounded-full bg-ui-tag-green-icon animate-ping opacity-75" />
          <span className="relative w-1.5 h-1.5 rounded-full bg-ui-tag-green-icon" />
        </span>
      )}
      {label}
    </span>
  )
}

function ActionCell({ sale }: { sale: FlashSale }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const prompt = usePrompt()

  const { mutate: publish } = usePublishFlashSale(sale.id, {
    onSuccess: () => toast.success("Flash sale published"),
  })
  const { mutate: end } = useEndFlashSale(sale.id, {
    onSuccess: () => toast.success("Flash sale ended"),
  })
  const { mutate: revive } = useReviveFlashSale(sale.id, {
    onSuccess: () => toast.success("Flash sale revived"),
    onError: (err: any) => {
      // If ends_at has passed, redirect to detail page where admin can set a new date
      if (err?.message?.includes("already passed")) {
        navigate(sale.id)
        toast.warning("Set a new end date to revive this sale")
      } else {
        toast.error(err?.message || "Failed to revive")
      }
    },
  })
  const { mutate: deleteSale } = useDeleteFlashSale({
    onSuccess: () => toast.success("Flash sale deleted"),
  })

  const handleDelete = async () => {
    const isActive = sale.status === "active"
    const confirmed = await prompt({
      title: "Delete Flash Sale",
      description: isActive
        ? `"${sale.title}" is currently LIVE. Deleting it will immediately remove it from the storefront. Continue?`
        : `Are you sure you want to delete "${sale.title}"?`,
      confirmText: "Delete",
      cancelText: "Cancel",
    })
    if (confirmed) deleteSale(sale.id)
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className="p-1.5 rounded hover:bg-ui-bg-base-hover"
      >
        <EllipsisHorizontal className="w-4 h-4 text-ui-fg-subtle" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-8 z-50 bg-ui-bg-base border border-ui-border-base rounded-lg shadow-lg min-w-[180px] py-1"
          onMouseLeave={() => setOpen(false)}
        >
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-ui-bg-base-hover flex items-center gap-2"
            onClick={(e) => { e.stopPropagation(); navigate(sale.id); setOpen(false) }}
          >
            <PencilSquare className="w-3.5 h-3.5" /> View / Edit
          </button>

          {["draft", "scheduled"].includes(sale.status) && (
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-ui-bg-base-hover flex items-center gap-2 text-ui-tag-green-text"
              onClick={(e) => { e.stopPropagation(); publish(); setOpen(false) }}
            >
              <Bolt className="w-3.5 h-3.5" /> Publish
            </button>
          )}

          {["active", "scheduled"].includes(sale.status) && (
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-ui-bg-base-hover flex items-center gap-2 text-ui-tag-orange-text"
              onClick={(e) => { e.stopPropagation(); end(); setOpen(false) }}
            >
              End Sale
            </button>
          )}

          {["ended", "cancelled"].includes(sale.status) && (
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-ui-bg-base-hover flex items-center gap-2 text-ui-tag-green-text"
              onClick={(e) => { e.stopPropagation(); revive(); setOpen(false) }}
            >
              <Bolt className="w-3.5 h-3.5" /> Revive
            </button>
          )}

          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-ui-bg-base-hover flex items-center gap-2 text-ui-tag-red-text"
            onClick={(e) => { e.stopPropagation(); handleDelete(); setOpen(false) }}
          >
            <Trash className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  )
}

export const FlashSaleListTable = () => {
  const { flash_sales = [], count = 0, isLoading } = useFlashSales()
  const navigate = useNavigate()

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Flash Sale",
        cell: ({ row }) => (
          <div className="font-medium text-sm text-ui-fg-base">{row.original.title}</div>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => <StatusBadge sale={row.original} />,
      }),
      columnHelper.accessor("starts_at", {
        header: "Starts",
        cell: ({ getValue }) => (
          <span className="text-sm text-ui-fg-subtle">
            {new Date(getValue()).toLocaleString()}
          </span>
        ),
      }),
      columnHelper.accessor("ends_at", {
        header: "Ends",
        cell: ({ row }) => {
          const v = row.original.ends_at
          const isActive = row.original.status === "active"
          return (
            <div>
              <div className="text-sm text-ui-fg-subtle">{new Date(v).toLocaleString()}</div>
              {isActive && (
                <div className="text-xs text-ui-tag-green-text font-medium">
                  {getTimeRemaining(v)} left
                </div>
              )}
            </div>
          )
        },
      }),
      columnHelper.display({
        id: "item_count",
        header: "Products",
        cell: ({ row }) => (
          <span className="text-sm text-ui-fg-subtle">
            {(row.original as any).item_count ?? 0}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => <ActionCell sale={row.original} />,
      }),
    ],
    []
  )

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Flash Sales</Heading>
          <p className="text-sm text-ui-fg-subtle mt-0.5">{count} total</p>
        </div>
        <Button size="small" variant="secondary" asChild>
          <Link to="create">Create Flash Sale</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="px-6 py-8 text-center text-sm text-ui-fg-muted">Loading...</div>
      ) : flash_sales.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Bolt className="w-8 h-8 text-ui-fg-muted mx-auto mb-3" />
          <p className="text-sm font-medium text-ui-fg-subtle">No flash sales yet</p>
          <p className="text-xs text-ui-fg-muted mt-1">Create your first flash sale to get started</p>
        </div>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              {columns.map((col) => (
                <th
                  key={(col as any).id || (col as any).accessorKey}
                  className="px-6 py-3 text-xs font-medium text-ui-fg-subtle uppercase tracking-wide"
                >
                  {typeof (col as any).header === "string" ? (col as any).header : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flash_sales.map((sale) => (
              <tr
                key={sale.id}
                className="border-b hover:bg-ui-bg-base-hover cursor-pointer"
                onClick={() => navigate(sale.id)}
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-sm text-ui-fg-base">{sale.title}</div>
                </td>
                <td className="px-6 py-4"><StatusBadge sale={sale} /></td>
                <td className="px-6 py-4 text-sm text-ui-fg-subtle">
                  {new Date(sale.starts_at).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-ui-fg-subtle">{new Date(sale.ends_at).toLocaleString()}</div>
                  {sale.status === "active" && (
                    <div className="text-xs text-ui-tag-green-text font-medium">{getTimeRemaining(sale.ends_at)} left</div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-ui-fg-subtle">
                  {(sale as any).item_count ?? 0}
                </td>
                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                  <ActionCell sale={sale} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Container>
  )
}
