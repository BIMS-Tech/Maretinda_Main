import { Bolt } from "@medusajs/icons"
import { Container, Heading } from "@medusajs/ui"
import { useNavigate } from "react-router-dom"
import { useFlashSales } from "../../../../hooks/api/flash-sales"
import { FlashSale, getFlashSaleStatus, getTimeRemaining } from "../../../../lib/flash-sales"

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

export const FlashSaleListTable = () => {
  const { flash_sales = [], count = 0, isLoading } = useFlashSales()
  const navigate = useNavigate()

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Flash Sale Events</Heading>
          <p className="text-sm text-gray-500 mt-0.5">Apply your products to platform flash sales</p>
        </div>
      </div>

      {isLoading ? (
        <div className="px-6 py-8 text-center text-sm text-gray-400">Loading...</div>
      ) : flash_sales.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Bolt className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600">No flash sales scheduled</p>
          <p className="text-xs text-gray-400 mt-1">Check back soon — platform flash sales will appear here when scheduled</p>
        </div>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              {["Flash Sale", "Status", "Period", "My Applications", ""].map((h) => (
                <th key={h} className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flash_sales.map((sale: any) => {
              const myTotal = (sale.my_application_count ?? 0)
              const myApproved = (sale.my_approved_count ?? 0)
              const myPending = (sale.my_pending_count ?? 0)

              return (
                <tr key={sale.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => navigate(sale.id)}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-sm text-gray-900">{sale.title}</div>
                    {sale.description && (
                      <div className="text-xs text-gray-400 truncate max-w-xs">{sale.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4"><StatusBadge sale={sale} /></td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{new Date(sale.starts_at).toLocaleDateString()} – {new Date(sale.ends_at).toLocaleDateString()}</div>
                    {sale.status === "active" && (
                      <div className="text-xs text-green-600 font-medium">{getTimeRemaining(sale.ends_at)} left</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {myTotal === 0 ? (
                      <span className="text-xs text-gray-400">None yet</span>
                    ) : (
                      <div className="space-y-0.5">
                        {myApproved > 0 && <div className="text-xs text-green-600 font-medium">{myApproved} approved</div>}
                        {myPending > 0 && <div className="text-xs text-orange-500">{myPending} pending review</div>}
                        {myTotal - myApproved - myPending > 0 && (
                          <div className="text-xs text-red-500">{myTotal - myApproved - myPending} rejected</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      className="text-xs text-blue-600 hover:underline"
                      onClick={(e) => { e.stopPropagation(); navigate(sale.id) }}
                    >
                      {myTotal === 0 ? "Apply →" : "Manage →"}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </Container>
  )
}
