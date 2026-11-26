import { createColumnHelper } from "@tanstack/react-table"
import { DateCell } from "../../../../components/table/table-cells/common/date-cell"
import { StatusCell } from "../../../../components/table/table-cells/common/status-cell"
import { useReturnCases } from "../../../../hooks/api/return-cases"

const columnHelper = createColumnHelper<any>()

const getStatusColor: any = (status: string) => {
  switch (status) {
    case "pending":
      return "orange"
    case "refunded":
      return "green"
    case "withdrawn":
      return "yellow"
    case "escalated":
      return "red"
    default:
      return "orange"
  }
}

const when = (d: string) => new Date(d).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })

export const useOrderReturnRequestTableColumns = () => {
  // The case beside each request: its stage and the next deadline
  const { data } = useReturnCases()
  const cases = new Map((data?.return_cases ?? []).map((c) => [c.request_id, c]))
  return [
    columnHelper.accessor("id", {
      header: "Order",
      cell: ({ row }) => `#${row.original.order.display_id}`,
    }),
    columnHelper.accessor("order.customer.first_name", {
      header: "Customer",
      cell: ({ row }) =>
        `${row.original.order.customer.first_name} ${row.original.order.customer.last_name}`,
    }),
    columnHelper.accessor("order.customer.email", {
      header: "Customer Email",
      cell: ({ row }) => row.original.order.customer.email,
    }),
    columnHelper.accessor("customer_note", {
      header: "Reason",
      cell: ({ row }) => row.original.customer_note,
    }),
    columnHelper.accessor("created_at", {
      header: "Date",
      cell: ({ row }) => <DateCell date={row.original.created_at} />,
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: ({ row }) => {
        const c = cases.get(row.original.id)
        const due = c?.stage === "seller_review" ? `Answer by ${when(c.respond_by)}` : c?.stage === "inspecting" && c.inspect_by ? `Check by ${when(c.inspect_by)}` : null
        return (
          <div className="flex h-full w-full flex-col justify-center overflow-hidden">
            <span className="truncate">
              <StatusCell color={c?.stage === "seller_review" ? "orange" : getStatusColor(row.original.status)}>
                {c?.stage_label ?? row.original.status}
              </StatusCell>
            </span>
            {due && <span className="text-ui-fg-muted truncate text-xs">{due}</span>}
          </div>
        )
      },
    }),
  ]
}
