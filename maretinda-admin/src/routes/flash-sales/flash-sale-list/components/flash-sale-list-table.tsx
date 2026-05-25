import { Bolt, PencilSquare, Trash, EllipsisHorizontal, XCircle } from "@medusajs/icons"
import { Badge, Button, Container, Heading, usePrompt, toast } from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import {
  useFlashSales,
  useDeleteFlashSale,
  usePublishFlashSale,
  useEndFlashSale,
  useApproveFlashSale,
  useRejectFlashSale,
} from "../../../../hooks/api/flash-sales"
import { FlashSale, getFlashSaleStatus, getTimeRemaining } from "../../../../lib/flash-sales"

const columnHelper = createColumnHelper<FlashSale & { item_count?: number }>()

const STATUS_COLOR: Record<string, string> = {
  green: "bg-green-100 text-green-700",
  orange: "bg-orange-100 text-orange-700",
  blue: "bg-blue-100 text-blue-700",
  grey: "bg-gray-100 text-gray-600",
  red: "bg-red-100 text-red-700",
}

function StatusBadge({ sale }: { sale: FlashSale }) {
  const [color, label] = getFlashSaleStatus(sale)
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[color] || STATUS_COLOR.grey}`}>
      {sale.status === "active" && (
        <span className="relative flex w-1.5 h-1.5">
          <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
          <span className="relative w-1.5 h-1.5 rounded-full bg-green-500" />
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
  const { mutate: approve } = useApproveFlashSale(sale.id, {
    onSuccess: () => toast.success("Flash sale approved"),
  })
  const { mutate: reject } = useRejectFlashSale(sale.id, {
    onSuccess: () => toast.success("Flash sale rejected"),
  })
  const { mutate: deleteSale } = useDeleteFlashSale({
    onSuccess: () => toast.success("Flash sale deleted"),
  })

  const handleDelete = async () => {
    const confirmed = await prompt({
      title: "Delete Flash Sale",
      description: `Are you sure you want to delete "${sale.title}"?`,
      confirmText: "Delete",
      cancelText: "Cancel",
    })
    if (confirmed) deleteSale(sale.id)
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className="p-1.5 rounded hover:bg-gray-100"
      >
        <EllipsisHorizontal className="w-4 h-4 text-gray-500" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[180px] py-1"
          onMouseLeave={() => setOpen(false)}
        >
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
            onClick={(e) => { e.stopPropagation(); navigate(sale.id); setOpen(false) }}
          >
            <PencilSquare className="w-3.5 h-3.5" /> View / Edit
          </button>

          {["draft", "pending", "scheduled"].includes(sale.status) && (
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-green-700"
              onClick={(e) => { e.stopPropagation(); publish(); setOpen(false) }}
            >
              <Bolt className="w-3.5 h-3.5" />
              {sale.status === "pending" ? "Approve & Publish" : "Publish"}
            </button>
          )}

          {sale.status === "pending" && (
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-orange-700"
              onClick={(e) => { e.stopPropagation(); approve(); setOpen(false) }}
            >
              Approve
            </button>
          )}

          {sale.status === "pending" && (
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
              onClick={(e) => { e.stopPropagation(); reject(); setOpen(false) }}
            >
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
          )}

          {["active", "scheduled"].includes(sale.status) && (
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-orange-700"
              onClick={(e) => { e.stopPropagation(); end(); setOpen(false) }}
            >
              End Sale
            </button>
          )}

          {!["active"].includes(sale.status) && (
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
              onClick={(e) => { e.stopPropagation(); handleDelete(); setOpen(false) }}
            >
              <Trash className="w-3.5 h-3.5" /> Delete
            </button>
          )}
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
          <div>
            <div className="font-medium text-sm text-gray-900">{row.original.title}</div>
            {row.original.seller_id && (
              <div className="text-xs text-gray-400">Vendor submission</div>
            )}
          </div>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => <StatusBadge sale={row.original} />,
      }),
      columnHelper.accessor("starts_at", {
        header: "Starts",
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-600">
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
              <div className="text-sm text-gray-600">{new Date(v).toLocaleString()}</div>
              {isActive && (
                <div className="text-xs text-green-600 font-medium">
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
          <span className="text-sm text-gray-600">
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
          <p className="text-sm text-gray-500 mt-0.5">{count} total</p>
        </div>
        <Button size="small" variant="secondary" asChild>
          <Link to="create">Create Flash Sale</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="px-6 py-8 text-center text-sm text-gray-400">Loading...</div>
      ) : flash_sales.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Bolt className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600">No flash sales yet</p>
          <p className="text-xs text-gray-400 mt-1">Create your first flash sale to get started</p>
        </div>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              {columns.map((col) => (
                <th
                  key={(col as any).id || (col as any).accessorKey}
                  className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide"
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
                className="border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(sale.id)}
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-sm text-gray-900">{sale.title}</div>
                  {sale.seller_id && <div className="text-xs text-gray-400">Vendor submission</div>}
                </td>
                <td className="px-6 py-4"><StatusBadge sale={sale} /></td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(sale.starts_at).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600">{new Date(sale.ends_at).toLocaleString()}</div>
                  {sale.status === "active" && (
                    <div className="text-xs text-green-600 font-medium">{getTimeRemaining(sale.ends_at)} left</div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
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
