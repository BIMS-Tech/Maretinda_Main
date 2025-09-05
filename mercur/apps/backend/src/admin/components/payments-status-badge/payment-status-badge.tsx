import { StatusCell } from "../table/table-cells/common/status-cell"

export const PaymentStatusBadge = ({ status }: { status: string }) => {
  const safe = (status || '').toString()
  const formattedStatus = safe.charAt(0).toUpperCase() + safe.slice(1)
  switch(formattedStatus) {
    case 'Pending':
      return <StatusCell color='orange'>{formattedStatus}</StatusCell>
    case 'Captured':
      return <StatusCell color='green'>{formattedStatus}</StatusCell>
    case 'Completed':
      return <StatusCell color='green'>{formattedStatus}</StatusCell>
    case 'Awaiting':
      return <StatusCell color='orange'>{formattedStatus}</StatusCell>
    case 'Cancelled':
      return <StatusCell color='red'>{formattedStatus}</StatusCell>
    default:
      return <StatusCell color='grey'>{formattedStatus}</StatusCell>
  }
}