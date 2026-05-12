'use client'

import { SingleColumnPage } from "../../components/layout/pages"
import { useSubscriptionStatus } from "../../hooks/api/subscription"

function statusBadge(status: "active" | "expired" | "cancelled" | "none") {
  const styles = {
    active: "bg-green-100 text-green-800",
    expired: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-600",
    none: "bg-gray-100 text-gray-500",
  }
  return `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[status]}`
}

export const SubscriptionPage = () => {
  const { data, isLoading, isError } = useSubscriptionStatus()

  const storeUrl = (typeof window !== "undefined" && (window as any).__ENV__?.VITE_STORE_URL) || ""

  if (isLoading) {
    return (
      <SingleColumnPage widgets={{ after: [], before: [] }}>
        <div className="flex h-40 items-center justify-center">
          <span className="text-sm text-gray-500">Loading subscription…</span>
        </div>
      </SingleColumnPage>
    )
  }

  if (isError || !data) {
    return (
      <SingleColumnPage widgets={{ after: [], before: [] }}>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load subscription data. Please refresh.
        </div>
      </SingleColumnPage>
    )
  }

  const { has_subscription, subscription, plan } = data

  return (
    <SingleColumnPage widgets={{ after: [], before: [] }}>
      <div className="flex flex-col gap-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
          <p className="mt-1 text-sm text-gray-500">
            Your subscription is billed and renewed automatically by GiyaPay.
          </p>
        </div>

        {has_subscription && subscription ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Current Plan</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{subscription.plan_name}</p>
                {plan?.features && (
                  <ul className="mt-3 space-y-1 text-sm text-gray-500">
                    {Object.entries(plan.features).map(([k, v]) => (
                      <li key={k} className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span className="capitalize">{k.replace(/_/g, " ")}: {
                          typeof v === "boolean" ? (v ? "Yes" : "No") : v === -1 ? "Unlimited" : String(v)
                        }</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <span className={statusBadge(subscription.status)}>
                {subscription.status}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-gray-400">Monthly price</p>
                <p className="font-semibold text-gray-900">₱{subscription.price.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400">Subscribed on</p>
                <p className="font-semibold text-gray-900">
                  {new Date(subscription.created_at).toLocaleDateString()}
                </p>
              </div>
              {subscription.payment_reference && (
                <div>
                  <p className="text-gray-400">Payment ref</p>
                  <p className="font-mono text-xs text-gray-600 break-all">{subscription.payment_reference}</p>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Billing and auto-renewal are managed by <strong>GiyaPay</strong>. To cancel or update your payment method, contact support.
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <p className="text-sm font-medium text-gray-600">No active subscription</p>
            <p className="mt-1 text-sm text-gray-400">
              Choose a plan to start selling on Maretinda.
            </p>
            {storeUrl && (
              <a
                href={`${storeUrl}/become-vendor`}
                className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                View Plans
              </a>
            )}
          </div>
        )}
      </div>
    </SingleColumnPage>
  )
}

export default SubscriptionPage
